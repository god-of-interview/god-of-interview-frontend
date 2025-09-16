import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Briefcase, Eye, AlertCircle, Clock } from 'lucide-react';

const InterviewRecordsPage = ({ onNavigate }) => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // 임시 데이터 (나중에 API 호출로 대체)
    useEffect(() => {
        const loadRecords = async () => {
            try {
                setIsLoading(true);
                // TODO: API 호출로 면접 기록 가져오기
                // const result = await interviewService.getMyInterviewRecords();

                // 임시 데이터
                const mockData = [
                    {
                        id: 1,
                        date: '2024-10-30',
                        jobName: '백엔드 개발자',
                        status: 'COMPLETED',
                        createdAt: '2024-10-30T14:30:00'
                    },
                    {
                        id: 2,
                        date: '2024-10-29',
                        jobName: '프론트엔드 개발자',
                        status: 'COMPLETED',
                        createdAt: '2024-10-29T10:15:00'
                    }
                ];

                setTimeout(() => {
                    setRecords(mockData);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                setError('면접 기록을 불러오는데 실패했습니다.');
                setIsLoading(false);
            }
        };

        loadRecords();
    }, []);

    const handleViewDetails = (recordId) => {
        // TODO: 면접 상세 결과 페이지로 이동
        // onNavigate('interview-detail', { recordId });
        alert(`면접 ID ${recordId}의 상세 결과를 보여줄 예정입니다.`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'COMPLETED':
                return '완료';
            case 'IN_PROGRESS':
                return '진행중';
            case 'CANCELLED':
                return '취소됨';
            default:
                return '알 수 없음';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
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
            {/* 헤더 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => onNavigate('home')}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            홈으로
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">나의 모의면접</h1>
                        <div></div> {/* 균형을 위한 빈 div */}
                    </div>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-sm">
                    {/* 테이블 헤더 */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                날짜
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                직업
                            </div>
                            <div>상태</div>
                            <div className="text-center">세부 정보</div>
                        </div>
                    </div>

                    {/* 테이블 내용 */}
                    {records.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                아직 면접 기록이 없습니다
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
                        <div className="divide-y divide-gray-200">
                            {records.map((record) => (
                                <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="grid grid-cols-4 gap-4 items-center">
                                        {/* 날짜 */}
                                        <div className="text-sm text-gray-900">
                                            {formatDate(record.date)}
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

                                        {/* 자세히 보기 버튼 */}
                                        <div className="text-center">
                                            <button
                                                onClick={() => handleViewDetails(record.id)}
                                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                자세히 보기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 하단 액션 버튼들 */}
                {records.length > 0 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => onNavigate('job-selection')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                            새로운 면접 연습하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewRecordsPage;