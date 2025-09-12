import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, UserCheck, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const SignupPage = ({ onNavigate }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const [signupData, setSignupData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nickname: '',
        gender: '',
        bio: '',
        birth: ''
    });

    const apiCall = async (endpoint, method, data) => {
        try {
            const response = await fetch(`https://api.god-of-interview.site/api/auth/${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '오류가 발생했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    };

    const validateSignup = () => {
        const newErrors = {};

        if (!signupData.email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        if (!signupData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else {
            // 정규식 수정: 백슬래시 이스케이프 문제 해결
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",<.>/?]).{8,}$/;
            if (!passwordRegex.test(signupData.password)) {
                newErrors.password = '비밀번호는 최소 8글자 이상, 대소문자 포함 영문 + 숫자 + 특수문자를 최소 1글자씩 포함해야합니다.';
            }
        }

        if (!signupData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        } else if (signupData.password !== signupData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        if (!signupData.nickname) {
            newErrors.nickname = '닉네임을 입력해주세요.';
        }

        if (!signupData.gender) {
            newErrors.gender = '성별을 선택해주세요.';
        }

        if (!signupData.birth) {
            newErrors.birth = '생년월일을 입력해주세요.';
        }

        if (signupData.bio && signupData.bio.length > 500) {
            newErrors.bio = '자기소개는 500자 이내로 작성해주세요.';
        }

        return newErrors;
    };

    const handleSignup = async () => {
        setIsLoading(true);
        setErrors({});
        setSuccessMessage('');

        const validationErrors = validateSignup();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsLoading(false);
            return;
        }

        try {
            const result = await apiCall('signup', 'POST', {
                email: signupData.email,
                password: signupData.password,
                nickname: signupData.nickname,
                gender: signupData.gender,
                bio: signupData.bio,
                birth: signupData.birth
            });

            localStorage.setItem('accessToken', result.data.accessToken);
            setSuccessMessage('회원가입이 완료되었습니다!');

            setTimeout(() => {
                onNavigate('home');
            }, 1000);

        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSignupData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
                <div className="absolute top-4 left-4">
                    <button
                        onClick={() => onNavigate('login')}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="text-center mb-8 mt-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 w-16 h-16 mx-auto mb-4">
                        <UserCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">회원가입</h1>
                    <p className="text-gray-600">면접의 神과 함께 시작해보세요</p>
                </div>

                {errors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 text-sm">{errors.general}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 text-sm">{successMessage}</span>
                    </div>
                )}

                <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이메일 *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                name="email"
                                value={signupData.email}
                                onChange={handleChange}
                                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="이메일을 입력하세요"
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            비밀번호 *
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={signupData.password}
                                onChange={handleChange}
                                className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="비밀번호를 입력하세요"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            비밀번호 확인 *
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={signupData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="비밀번호를 다시 입력하세요"
                            />
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            닉네임 *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="nickname"
                                value={signupData.nickname}
                                onChange={handleChange}
                                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.nickname ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="닉네임을 입력하세요"
                            />
                        </div>
                        {errors.nickname && (
                            <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                성별 *
                            </label>
                            <select
                                name="gender"
                                value={signupData.gender}
                                onChange={handleChange}
                                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            >
                                <option value="">선택</option>
                                <option value="남자">남자</option>
                                <option value="여자">여자</option>
                            </select>
                            {errors.gender && (
                                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                생년월일 *
                            </label>
                            <input
                                type="date"
                                name="birth"
                                value={signupData.birth}
                                onChange={handleChange}
                                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                    errors.birth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {errors.birth && (
                                <p className="mt-1 text-sm text-red-600">{errors.birth}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            자기소개 (선택사항)
                        </label>
                        <textarea
                            name="bio"
                            value={signupData.bio}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                                errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="간단한 자기소개를 작성해주세요 (최대 500자)"
                        />
                        <div className="mt-1 flex justify-between">
                            {errors.bio && (
                                <p className="text-sm text-red-600">{errors.bio}</p>
                            )}
                            <p className="text-sm text-gray-500 ml-auto">
                                {signupData.bio.length}/500
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleSignup}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                        {isLoading ? '가입 중...' : '회원가입'}
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <button
                            onClick={() => onNavigate('login')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            로그인
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;