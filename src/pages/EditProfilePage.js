import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { userService } from '../services/userService';

const EditProfilePage = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        nickname: '',
        bio: ''
    });
    const [originalData, setOriginalData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const result = await userService.getMyProfile();
            const profileData = {
                nickname: result.data.nickname || '',
                bio: result.data.bio || ''
            };
            setFormData(profileData);
            setOriginalData(profileData);
        } catch (error) {
            setErrors({ general: '프로필을 불러오는데 실패했습니다.' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (formData.nickname.trim() && formData.nickname.trim().length < 2) {
            newErrors.nickname = '닉네임은 2글자 이상이어야 합니다.';
        }

        if (formData.bio.length > 500) {
            newErrors.bio = '자기소개는 500자 이내로 작성해주세요.';
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setErrors({});
        setSuccessMessage('');

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsLoading(false);
            return;
        }

        // 변경된 필드만 전송
        const updatedData = {};
        if (formData.nickname !== originalData.nickname) {
            updatedData.nickname = formData.nickname;
        }
        if (formData.bio !== originalData.bio) {
            updatedData.bio = formData.bio;
        }

        // 변경사항이 없는 경우
        if (Object.keys(updatedData).length === 0) {
            setErrors({ general: '변경된 내용이 없습니다.' });
            setIsLoading(false);
            return;
        }

        try {
            await userService.updateProfile(updatedData);
            setSuccessMessage('프로필이 성공적으로 수정되었습니다!');

            setTimeout(() => {
                onNavigate('profile');
            }, 1500);
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => onNavigate('profile')}
                            className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            프로필로 돌아가기
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="text-center mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 w-16 h-16 mx-auto mb-4">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">프로필 수정</h1>
                        <p className="text-gray-600">정보를 수정하고 저장하세요</p>
                    </div>

                    {errors.general && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700 text-sm">{errors.general}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700 text-sm">{successMessage}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                닉네임
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    name="nickname"
                                    value={formData.nickname}
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
                            <p className="mt-1 text-sm text-gray-500">
                                비워두면 기존 닉네임이 유지됩니다.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                자기소개
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                                        errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="자기소개를 입력하세요"
                                />
                            </div>
                            <div className="mt-1 flex justify-between">
                                {errors.bio && (
                                    <p className="text-sm text-red-600">{errors.bio}</p>
                                )}
                                <p className="text-sm text-gray-500 ml-auto">
                                    {formData.bio.length}/500
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                                {isLoading ? '저장 중...' : '저장하기'}
                            </button>
                            <button
                                onClick={() => onNavigate('profile')}
                                className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-gray-400 py-3 rounded-lg font-medium transition-all duration-300"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;