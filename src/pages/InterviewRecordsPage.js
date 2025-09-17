import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Briefcase, Eye, AlertCircle, Clock, BarChart3 } from 'lucide-react';

const InterviewRecordsPage = ({ onNavigate }) => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageInfo, setPageInfo] = useState({});

    useEffect(() => {
        loadInterviewRecords();
    }, []);

    const loadInterviewRecords = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('로그인이 필요합니다.');
                return;
            }

            const response = await fetch('https://api.god-of-interview.site/api/interviews/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '면접 기록을 불러오는데 실패했습니다.');
            }

            console.log('면접 기록 API 응답:', result);

            // PageResponse 구조에 맞게 데이터 처리
            setRecords(result.data.data || []);
            setPageInfo({
                totalElements: result.data.totalElements,
                totalPages: result.data.totalPages,
                pageNumber: result.data.pageNumber,
                pageSize: result.data.pageSize
            });

        } catch (error) {
            console.error('면접 기록 로딩 오류:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewFeedback = (interviewId) => {
        // 피드백 페이지로 이동
        onNavigate('interview-feedback', { interviewId });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ANALYZED':
                return '분석 완료';
            case 'COMPLETED':
                return '면접 완료';
            case 'IN_PROGRESS':
                return '진행중';
            default:
                return '알 수 없음';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ANALYZED':
                return 'bg-green-100 text-green-800';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">면접 기록을 불러오는 중...</p>
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
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={loadInterviewRecords}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => onNavigate('home')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => onNavigate('home')}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            홈으로
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">나의 면접 기록</h1>
                        <div className="text-sm text-gray-500">
                            총 {pageInfo.totalElements || 0}개
                        </div>
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm">
                    {records.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                아직 완료된 면접이 없습니다
                            </h3>
                            <p className="text-gray-600 mb-6">
                                첫 모의면접을 시작해보세요!
                            </p>
                            <button
                                onClick={() => onNavigate('job-selection')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                면접 연습 시작하기
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* 테이블 헤더 */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        면접 일시
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        직업
                                    </div>
                                    <div>상태</div>
                                    <div className="text-center">분석 결과</div>
                                    <div className="text-center">피드백 보기</div>
                                </div>
                            </div>

                            {/* 테이블 내용 */}
                            <div className="divide-y divide-gray-200">
                                {records.map((record) => (
                                    <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="grid grid-cols-5 gap-4 items-center">
                                            {/* 면접 일시 */}
                                            <div className="text-sm text-gray-900">
                                                {formatDate(record.createdAt)}
                                            </div>

                                            {/* 직업 */}
                                            <div className="text-sm font-medium text-gray-900">
                                                {record.jobName}
                                            </div>

                                            {/* 상태 */}
                                            <div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                                    {getStatusText(record.status)}
                                                </span>
                                            </div>

                                            {/* 분석 결과 상태 */}
                                            <div className="text-center">
                                                {record.status === 'ANALYZED' ? (
                                                    <div className="flex items-center justify-center gap-1 text-green-600">
                                                        <BarChart3 className="w-4 h-4" />
                                                        <span className="text-sm font-medium">완료</span>
                                                    </div>
                                                ) : record.status === 'COMPLETED' ? (
                                                    <div className="flex items-center justify-center gap-1 text-blue-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-sm font-medium">분석 중</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
                                                )}
                                            </div>

                                            {/* 피드백 보기 버튼 */}
                                            <div className="text-center">
                                                {record.status === 'ANALYZED' ? (
                                                    <button
                                                        onClick={() => handleViewFeedback(record.id)}
                                                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        피드백 보기
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="inline-flex items-center gap-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        {record.status === 'COMPLETED' ? '분석 중' : '분석 대기'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* 하단 액션 버튼들 */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => onNavigate('job-selection')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                        새로운 면접 연습하기
                    </button>
                </div>

                {/* 안내 메시지 */}
                {records.length > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">💡 분석 완료까지는 약 5-10분이 소요됩니다</p>
                                <p>AI가 여러분의 면접 영상을 꼼꼼히 분석하여 표정, 시선, 습관어 피드백을 제공합니다.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewRecordsPage;