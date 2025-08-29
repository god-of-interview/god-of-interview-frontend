import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, ArrowLeft, Edit3, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { userService } from '../services/userService';

const ProfilePage = ({ onNavigate }) => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const result = await userService.getMyProfile();
            setProfile(result.data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">프로필을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => onNavigate('home')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => onNavigate('home')}
                            className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            홈으로
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                                <User className="w-12 h-12 text-white" />
                            </div>
                            <div className="ml-6">
                                <h1 className="text-2xl font-bold text-gray-900">{profile?.nickname}</h1>
                                <p className="text-gray-600 mt-1">회원 ID: {profile?.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onNavigate('edit-profile')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                                프로필 수정
                            </button>
                            <button
                                onClick={() => onNavigate('delete-account')}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                회원 탈퇴
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">성별</h3>
                                <p className="text-gray-900">{profile?.gender}</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">생년월일</h3>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                    <p className="text-gray-900">{profile?.birth}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">자기소개</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-900">
                                    {profile?.bio || '자기소개가 없습니다.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;