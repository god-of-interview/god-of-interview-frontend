import React, { useState } from 'react';
import { ArrowLeft, Trash2, Lock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { userService } from '../services/userService';

const DeleteAccountPage = ({ onNavigate }) => {
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1); // 1: 확인, 2: 비밀번호 입력

    const handleConfirm = () => {
        if (confirmText !== '회원탈퇴') {
            setErrors({ confirm: "'회원탈퇴'라고 정확히 입력해주세요." });
            return;
        }
        setErrors({});
        setStep(2);
    };

    const handleDeleteAccount = async () => {
        if (!password) {
            setErrors({ password: '비밀번호를 입력해주세요.' });
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            await userService.deleteAccount(password);

            // 로컬 스토리지에서 토큰 제거
            localStorage.removeItem('accessToken');

            // 성공 메시지 표시 후 홈으로 이동
            alert('회원탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
            onNavigate('home');

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
                        <div className="bg-red-100 rounded-xl p-3 w-16 h-16 mx-auto mb-4">
                            <Trash2 className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">회원 탈퇴</h1>
                        <p className="text-gray-600">정말로 탈퇴하시겠습니까?</p>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                                    <div>
                                        <h3 className="text-sm font-medium text-red-800 mb-2">
                                            탈퇴 시 주의사항
                                        </h3>
                                        <ul className="text-sm text-red-700 space-y-1">
                                            <li>• 모든 개인정보가 삭제되며 복구할 수 없습니다.</li>
                                            <li>• 면접 연습 기록과 분석 결과가 모두 삭제됩니다.</li>
                                            <li>• 동일한 이메일로 재가입이 가능하지만 이전 데이터는 복구되지 않습니다.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    탈퇴를 진행하려면 아래에 <strong>'회원탈퇴'</strong>라고 입력하세요
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => {
                                        setConfirmText(e.target.value);
                                        if (errors.confirm) {
                                            setErrors({ ...errors, confirm: '' });
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                                        errors.confirm ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                    placeholder="회원탈퇴"
                                />
                                {errors.confirm && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => onNavigate('profile')}
                                    className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-gray-400 py-3 rounded-lg font-medium transition-all duration-300"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-all duration-300"
                                >
                                    다음 단계
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            {errors.general && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="text-red-700 text-sm">{errors.general}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    현재 비밀번호를 입력하세요
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) {
                                                setErrors({ ...errors, password: '' });
                                            }
                                        }}
                                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                                            errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="현재 비밀번호"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium mb-1">최종 확인</p>
                                        <p>이 작업은 되돌릴 수 없습니다. 정말로 계정을 삭제하시겠습니까?</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-gray-400 py-3 rounded-lg font-medium transition-all duration-300"
                                >
                                    이전 단계
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isLoading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                                >
                                    {isLoading ? '탈퇴 처리 중...' : '계정 삭제'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountPage;