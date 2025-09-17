import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Star,
    Eye,
    Smile,
    Volume2,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    BarChart3,
    Calendar,
    Briefcase,
    Award,
    Target,
    Lightbulb
} from 'lucide-react';

const InterviewFeedbackPage = ({ onNavigate, interviewId }) => {
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (interviewId) {
            loadFeedback();
        }
    }, [interviewId]);

    const loadFeedback = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError('로그인이 필요합니다.');
                return;
            }

            const response = await fetch(`https://api.god-of-interview.site/api/feedback/interviews/${interviewId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '피드백을 불러오는데 실패했습니다.');
            }

            console.log('피드백 API 응답:', result);
            setFeedback(result.data);

        } catch (error) {
            console.error('피드백 로딩 오류:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
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

    const getGradeColor = (grade) => {
        switch (grade) {
            case 'S':
                return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
            case 'A+':
            case 'A':
                return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
            case 'B+':
            case 'B':
                return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
            case 'C+':
            case 'C':
                return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
            default:
                return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = '#3b82f6' }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative inline-flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{percentage}</span>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">분석 결과를 불러오는 중...</p>
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
                            onClick={loadFeedback}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => onNavigate('interview-records')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                        >
                            면접 기록으로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!feedback) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">피드백 데이터를 찾을 수 없습니다.</p>
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
                            onClick={() => onNavigate('interview-records')}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            면접 기록으로
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">면접 분석 결과</h1>
                        <div className="text-sm text-gray-500">
                            ID: {feedback.interviewId}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 면접 기본 정보 */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 rounded-lg p-3">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{feedback.jobName}</h2>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(feedback.interviewDate)}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`px-6 py-3 rounded-xl font-bold text-2xl ${getGradeColor(feedback.overAllFeedbackResponse.grade)}`}>
                            {feedback.overAllFeedbackResponse.grade}등급
                        </div>
                    </div>
                </div>

                {/* 종합 점수 및 평가 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* 종합 점수 */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">종합 점수</h3>
                            <CircularProgress
                                percentage={feedback.overAllFeedbackResponse.totalScore}
                                color="#3b82f6"
                            />
                            <p className="mt-4 text-gray-600">{feedback.overAllFeedbackResponse.overAllComment}</p>
                        </div>
                    </div>

                    {/* 영역별 점수 */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">영역별 점수</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Smile className="w-5 h-5 text-orange-500" />
                                    <span className="font-medium">표정 분석</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${feedback.overAllFeedbackResponse.emotionScore}%` }}
                                        ></div>
                                    </div>
                                    <span className={`font-bold ${getScoreColor(feedback.overAllFeedbackResponse.emotionScore)}`}>
                                        {feedback.overAllFeedbackResponse.emotionScore}점
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium">시선 분석</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${feedback.overAllFeedbackResponse.gazeScore}%` }}
                                        ></div>
                                    </div>
                                    <span className={`font-bold ${getScoreColor(feedback.overAllFeedbackResponse.gazeScore)}`}>
                                        {feedback.overAllFeedbackResponse.gazeScore}점
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-green-500" />
                                    <span className="font-medium">음성 분석</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${feedback.overAllFeedbackResponse.speechScore}%` }}
                                        ></div>
                                    </div>
                                    <span className={`font-bold ${getScoreColor(feedback.overAllFeedbackResponse.speechScore)}`}>
                                        {feedback.overAllFeedbackResponse.speechScore}점
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 강점 및 개선점 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-100 rounded-lg p-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">강점</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{feedback.overAllFeedbackResponse.strengths}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-100 rounded-lg p-2">
                                <Target className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">개선점</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{feedback.overAllFeedbackResponse.improvements}</p>
                    </div>
                </div>

                {/* 질문별 상세 분석 */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-purple-100 rounded-lg p-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">질문별 상세 분석</h3>
                    </div>

                    <div className="space-y-6">
                        {feedback.questionFeedbackResponseList.map((question, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">
                                        질문 {question.questionNumber}: {question.questionContent}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-yellow-500" />
                                        <span className={`font-bold text-lg ${getScoreColor(question.questionScore)}`}>
                                            {question.questionScore}점
                                        </span>
                                    </div>
                                </div>

                                {/* 영역별 세부 분석 */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                                    {/* 표정 분석 */}
                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Smile className="w-4 h-4 text-orange-600" />
                                            <span className="font-medium text-orange-800">표정 분석</span>
                                            <span className={`font-bold ${getScoreColor(question.emotionFeedbackResponse.score)}`}>
                                                {question.emotionFeedbackResponse.score}점
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">주요 감정:</span>
                                                <span className="font-medium">{question.emotionFeedbackResponse.dominantEmotion}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">긍정 비율:</span>
                                                <span className="font-medium">{question.emotionFeedbackResponse.happyRatio?.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">자연스러움:</span>
                                                <span className="font-medium">{question.emotionFeedbackResponse.neutralRatio?.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-orange-700 mt-3">{question.emotionFeedbackResponse.comment}</p>
                                    </div>

                                    {/* 시선 분석 */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Eye className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-blue-800">시선 분석</span>
                                            <span className={`font-bold ${getScoreColor(question.gazeFeedbackResponse.score)}`}>
                                                {question.gazeFeedbackResponse.score}점
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">카메라 응시율:</span>
                                                <span className="font-medium">{question.gazeFeedbackResponse.attentionRatio?.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-blue-700 mt-3">{question.gazeFeedbackResponse.comment}</p>
                                    </div>

                                    {/* 음성 분석 */}
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Volume2 className="w-4 h-4 text-green-600" />
                                            <span className="font-medium text-green-800">음성 분석</span>
                                            <span className={`font-bold ${getScoreColor(question.speechFeedbackResponse.score)}`}>
                                                {question.speechFeedbackResponse.score}점
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">습관어 개수:</span>
                                                <span className="font-medium">{question.speechFeedbackResponse.totalFillerWords}개</span>
                                            </div>
                                            {Object.entries(question.speechFeedbackResponse.fillerDetails || {}).length > 0 && (
                                                <div className="mt-2">
                                                    <span className="text-gray-600 text-xs">습관어 상세:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Object.entries(question.speechFeedbackResponse.fillerDetails).map(([word, count]) => (
                                                            <span key={word} className="bg-white px-2 py-1 rounded text-xs">
                                                                {word}: {count}회
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-green-700 mt-3">{question.speechFeedbackResponse.comment}</p>
                                    </div>
                                </div>

                                {/* 질문별 종합 피드백 */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="font-medium text-green-800">잘한 점</span>
                                        </div>
                                        <p className="text-sm text-green-700">{question.positivePoints}</p>
                                    </div>

                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-orange-600" />
                                            <span className="font-medium text-orange-800">개선할 점</span>
                                        </div>
                                        <p className="text-sm text-orange-700">{question.improvementPoints}</p>
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Lightbulb className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-blue-800">조언</span>
                                        </div>
                                        <p className="text-sm text-blue-700">{question.advice}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 하단 액션 버튼들 */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => onNavigate('interview-records')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                    >
                        면접 기록으로 돌아가기
                    </button>
                    <button
                        onClick={() => onNavigate('job-selection')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                        새로운 면접 연습하기
                    </button>
                </div>

                {/* 추가 안내 메시지 */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-2">🎯 면접 실력 향상을 위한 팁</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• 정기적인 연습을 통해 면접 실력을 꾸준히 향상시키세요</li>
                                <li>• 피드백을 바탕으로 약점을 보완하고 강점을 더욱 발전시키세요</li>
                                <li>• 다양한 직업군의 면접을 경험해보며 폭넓은 대응 능력을 기르세요</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewFeedbackPage;