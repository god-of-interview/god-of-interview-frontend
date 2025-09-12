import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

const LoginPage = ({ onNavigate }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
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

    const validateLogin = () => {
        const newErrors = {};

        if (!loginData.email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        if (!loginData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        }

        return newErrors;
    };

    const handleLogin = async () => {
        setIsLoading(true);
        setErrors({});
        setSuccessMessage('');

        const validationErrors = validateLogin();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsLoading(false);
            return;
        }

        try {
            const result = await apiCall('login', 'POST', {
                email: loginData.email,
                password: loginData.password
            });

            localStorage.setItem('accessToken', result.data.accessToken);
            setSuccessMessage('로그인이 완료되었습니다!');

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
        setLoginData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
                <div className="absolute top-4 left-4">
                    <button
                        onClick={() => onNavigate('home')}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="text-center mb-8 mt-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 w-16 h-16 mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">로그인</h1>
                    <p className="text-gray-600">면접의 神에 오신 것을 환영합니다</p>
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

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이메일
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="email"
                                name="email"
                                value={loginData.email}
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
                            비밀번호
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={loginData.password}
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

                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                        {isLoading ? '로그인 중...' : '로그인'}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        아직 계정이 없으신가요?{' '}
                        <button
                            onClick={() => onNavigate('signup')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            회원가입
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;