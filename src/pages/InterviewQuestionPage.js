import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Square, SkipForward, Clock, Camera, Mic, AlertCircle, CheckCircle } from 'lucide-react';

const InterviewQuestionPage = ({ onNavigate, selectedJob }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 녹화 관련 상태
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [answers, setAnswers] = useState([]); // 각 질문별 답변 저장

    // 면접 진행 상태
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewCompleted, setInterviewCompleted] = useState(false);

    useEffect(() => {
        if (selectedJob) {
            fetchQuestions();
        }
    }, [selectedJob]);

    // 녹화 시간 카운터
    useEffect(() => {
        let interval = null;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('accessToken');

            const response = await fetch(
                `http://localhost:8080/api/questions/random?jobId=${selectedJob.id}&count=5`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('질문을 불러오는데 실패했습니다.');
            }

            const result = await response.json();
            setQuestions(result.data);

            // 각 질문별 답변 상태 초기화
            setAnswers(new Array(result.data.length).fill(null));

        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startInterview = () => {
        setInterviewStarted(true);
        setCurrentQuestionIndex(0);
    };

    const startRecording = () => {
        setIsRecording(true);
        setRecordingTime(0);
        // 실제 녹화 로직은 나중에 구현 (WebRTC)
        console.log('녹화 시작:', questions[currentQuestionIndex].content);
    };

    const stopRecording = () => {
        setIsRecording(false);

        // 현재 질문의 답변 저장
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = {
            questionId: questions[currentQuestionIndex].id,
            recordingTime: recordingTime,
            timestamp: new Date().toISOString()
        };
        setAnswers(newAnswers);

        console.log('녹화 종료. 답변 저장:', newAnswers[currentQuestionIndex]);
    };

    const goToNextQuestion = () => {
        if (isRecording) {
            stopRecording();
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setRecordingTime(0);
        } else {
            // 마지막 질문이면 면접 완료
            completeInterview();
        }
    };

    const goToPreviousQuestion = () => {
        if (isRecording) {
            stopRecording();
        }

        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setRecordingTime(0);
        }
    };

    const completeInterview = () => {
        setInterviewCompleted(true);
        console.log('면접 완료! 모든 답변:', answers);
        // 여기서 서버로 답변 데이터 전송 (향후 구현)
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">면접 질문을 준비하는 중...</p>
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
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    if (interviewCompleted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-4 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">면접이 완료되었습니다!</h1>
                    <p className="text-gray-600 mb-6">
                        총 {questions.length}개의 질문에 답변하셨습니다.
                        AI 분석 결과는 잠시 후 확인하실 수 있습니다.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => onNavigate('home')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
                        >
                            홈으로
                        </button>
                        <button
                            onClick={() => onNavigate('results')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                        >
                            결과 보기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!interviewStarted) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* 헤더 */}
                    <div className="flex items-center mb-8">
                        <button
                            onClick={() => onNavigate('job-selection')}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">면접 준비</h1>
                            <p className="text-gray-600">{selectedJob?.name} 면접을 시작할 준비가 되셨나요?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 질문 미리보기 */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                면접 질문 ({questions.length}개)
                            </h2>
                            <div className="space-y-3">
                                {questions.map((question, index) => (
                                    <div key={question.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-800 leading-relaxed">{question.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 면접 안내 */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">면접 진행 방법</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Camera className="w-5 h-5 text-blue-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">영상 녹화</h3>
                                        <p className="text-sm text-gray-600">각 질문마다 개별적으로 답변을 녹화합니다</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-blue-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">시간 제한</h3>
                                        <p className="text-sm text-gray-600">각 질문당 최대 3분의 답변 시간이 주어집니다</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mic className="w-5 h-5 text-blue-600 mt-1" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">음성 분석</h3>
                                        <p className="text-sm text-gray-600">말하기 속도와 습관어를 분석합니다</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={startInterview}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                                >
                                    면접 시작하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 상단 진행률 바 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {selectedJob?.name} 면접
                        </h1>
                        <span className="text-sm text-gray-600">
                            {currentQuestionIndex + 1} / {questions.length}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgress()}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 질문 영역 */}
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                                    {currentQuestionIndex + 1}
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">질문</h2>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                                <p className="text-lg text-gray-800 leading-relaxed">
                                    {currentQuestion?.content}
                                </p>
                            </div>
                        </div>

                        {/* 녹화 컨트롤 */}
                        <div className="flex items-center justify-center gap-4">
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    <Play className="w-5 h-5" />
                                    답변 시작
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    <Square className="w-5 h-5" />
                                    답변 완료
                                </button>
                            )}
                        </div>

                        {/* 녹화 시간 표시 */}
                        {isRecording && (
                            <div className="mt-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-lg font-mono text-red-600">
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">답변 녹화 중...</p>
                            </div>
                        )}
                    </div>

                    {/* 비디오 미리보기 영역 */}
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">카메라 미리보기</h2>
                        </div>

                        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                            <div className="text-center text-white">
                                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-gray-300">카메라가 곧 연결됩니다</p>
                            </div>
                        </div>

                        {/* 답변 상태 표시 */}
                        <div className="space-y-2">
                            {questions.map((_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                        index < currentQuestionIndex
                                            ? 'bg-green-100 text-green-600'
                                            : index === currentQuestionIndex
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {index < currentQuestionIndex
                                            ? <CheckCircle className="w-4 h-4" />
                                            : index + 1
                                        }
                                    </div>
                                    <span className={`text-sm ${
                                        index < currentQuestionIndex
                                            ? 'text-green-600 font-medium'
                                            : index === currentQuestionIndex
                                                ? 'text-blue-600 font-medium'
                                                : 'text-gray-500'
                                    }`}>
                                        질문 {index + 1} {answers[index] ? '답변 완료' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 하단 네비게이션 */}
                <div className="flex justify-between items-center mt-8">
                    <button
                        onClick={goToPreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        이전 질문
                    </button>

                    <button
                        onClick={goToNextQuestion}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        {currentQuestionIndex === questions.length - 1 ? '면접 완료' : '다음 질문'}
                        {currentQuestionIndex < questions.length - 1 && <SkipForward className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewQuestionPage;