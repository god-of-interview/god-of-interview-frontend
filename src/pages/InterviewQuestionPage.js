
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Square, SkipForward, Clock, Camera, Mic, AlertCircle, CheckCircle } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { questionService } from '../services/questionService';

const InterviewQuestionPage = ({ onNavigate, selectedJob }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 면접 세션 관련 상태
    const [interviewId, setInterviewId] = useState(null);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewCompleted, setInterviewCompleted] = useState(false);

    // 녹화 관련 상태
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [answers, setAnswers] = useState([]); // 각 질문별 답변 저장

    // WebRTC 관련 상태
    const [mediaStream, setMediaStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [recordingError, setRecordingError] = useState(null);
    const videoRef = useRef(null);

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

    // 컴포넌트 언마운트 시 카메라 정리
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaStream]);

    const fetchQuestions = async () => {
        try {
            setIsLoading(true);
            const result = await questionService.getRandomQuestions(selectedJob.id, 5);
            setQuestions(result.data);

            // 각 질문별 답변 상태 초기화
            setAnswers(new Array(result.data.length).fill(null));

        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startInterview = async () => {
        try {
            // 백엔드에서 면접 세션 시작
            const result = await interviewService.startInterview(selectedJob.id);
            setInterviewId(result.data.id);

            setInterviewStarted(true);
            setCurrentQuestionIndex(0);
            await initializeCamera();
        } catch (error) {
            setError('면접 시작에 실패했습니다: ' + error.message);
        }
    };

    // 카메라 초기화
    const initializeCamera = async () => {
        try {
            setRecordingError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            setMediaStream(stream);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

        } catch (error) {
            console.error('카메라 초기화 실패:', error);

            if (error.name === 'NotAllowedError') {
                setRecordingError('카메라와 마이크 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
            } else if (error.name === 'NotFoundError') {
                setRecordingError('카메라 또는 마이크를 찾을 수 없습니다.');
            } else if (error.name === 'NotReadableError') {
                setRecordingError('카메라 또는 마이크가 다른 애플리케이션에서 사용 중입니다.');
            } else {
                setRecordingError('카메라 연결 실패: ' + error.message);
            }
        }
    };

    const startRecording = async () => {
        if (!mediaStream) {
            await initializeCamera();
            return;
        }

        try {
            setRecordingError(null);
            setRecordingTime(0);

            // MediaRecorder 설정
            const options = { mimeType: 'video/webm;codecs=vp9,opus' };

            // 브라우저 호환성 체크
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8,opus';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'video/webm';
                }
            }

            const recorder = new MediaRecorder(mediaStream, options);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                setRecordedChunks([blob]);
                await handleVideoRecorded(blob);
            };

            recorder.onerror = (event) => {
                console.error('녹화 오류:', event.error);
                setRecordingError('녹화 중 오류가 발생했습니다.');
            };

            recorder.start(1000); // 1초마다 데이터 수집
            setMediaRecorder(recorder);
            setIsRecording(true);

            console.log('녹화 시작:', questions[currentQuestionIndex].content);

        } catch (error) {
            console.error('녹화 시작 실패:', error);
            setRecordingError('녹화를 시작할 수 없습니다: ' + error.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            console.log('녹화 중지');
        }
    };

    const handleVideoRecorded = async (videoBlob) => {
        // 현재 질문의 답변 저장
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = {
            questionId: questions[currentQuestionIndex].id,
            videoBlob: videoBlob,
            recordingTime: recordingTime,
            timestamp: new Date().toISOString(),
            uploaded: false
        };
        setAnswers(newAnswers);

        console.log('답변 저장 완료:', {
            question: questions[currentQuestionIndex].content,
            duration: recordingTime,
            fileSize: videoBlob.size
        });

        // 서버에 업로드
        try {
            await uploadVideoToServer(videoBlob, currentQuestionIndex + 1);
            newAnswers[currentQuestionIndex].uploaded = true;
            setAnswers([...newAnswers]);
            console.log('서버 업로드 성공');
        } catch (error) {
            console.error('서버 업로드 실패:', error);
            // 업로드 실패해도 로컬에는 저장되어 있음
        }
    };

    const uploadVideoToServer = async (videoBlob, questionNumber) => {
        if (!interviewId) {
            throw new Error('면접 세션이 시작되지 않았습니다.');
        }

        try {
            const result = await interviewService.uploadVideo(interviewId, questionNumber, videoBlob);
            console.log('업로드 성공:', result);
            return result;
        } catch (error) {
            console.error('업로드 실패:', error);
            throw error;
        }
    };

    const downloadVideo = (videoBlob, filename) => {
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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

    const completeInterview = async () => {
        try {
            // 백엔드에 면접 완료 알림
            if (interviewId) {
                await interviewService.completeInterview(interviewId);
            }
        } catch (error) {
            console.error('면접 완료 처리 실패:', error);
        }

        // 카메라 스트림 정리
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }

        setInterviewCompleted(true);
        console.log('면접 완료! 모든 답변:', answers);
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

                    {/* 면접 ID 표시 */}
                    {interviewId && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                면접 ID: <span className="font-mono font-semibold">{interviewId}</span>
                            </p>
                        </div>
                    )}

                    {/* 녹화된 비디오들 다운로드 옵션 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold mb-3">녹화된 답변들</h3>
                        <div className="space-y-2">
                            {answers.map((answer, index) => (
                                answer && answer.videoBlob && (
                                    <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                                        <div className="text-left">
                                            <span className="text-sm font-medium">질문 {index + 1}</span>
                                            <p className="text-xs text-gray-500">
                                                {formatTime(answer.recordingTime)} | {(answer.videoBlob.size / (1024 * 1024)).toFixed(1)}MB
                                            </p>
                                            {answer.uploaded ? (
                                                <span className="text-xs text-green-600">✓ 업로드 완료</span>
                                            ) : (
                                                <span className="text-xs text-orange-600">⏳ 업로드 대기</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => downloadVideo(answer.videoBlob, `question_${index + 1}.webm`)}
                                            className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                                        >
                                            다운로드
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => onNavigate('home')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
                        >
                            홈으로
                        </button>
                        <button
                            onClick={() => onNavigate('dashboard')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                        >
                            대시보드
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
                        <div className="flex items-center gap-4">
                            {interviewId && (
                                <span className="text-sm text-gray-500">
                                    면접 ID: {interviewId}
                                </span>
                            )}
                            <span className="text-sm text-gray-600">
                                {currentQuestionIndex + 1} / {questions.length}
                            </span>
                        </div>
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

                        {/* 오류 메시지 */}
                        {recordingError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-red-700 text-sm font-medium">녹화 오류</p>
                                    <p className="text-red-600 text-sm">{recordingError}</p>
                                </div>
                            </div>
                        )}

                        {/* 녹화 컨트롤 */}
                        <div className="flex items-center justify-center gap-4">
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    disabled={!mediaStream && recordingError}
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

                        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                            {mediaStream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center text-white">
                                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-gray-300">
                                        {recordingError ? '카메라 연결 실패' : '카메라 연결 중...'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 답변 상태 표시 */}
                        <div className="space-y-2">
                            {questions.map((_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                        answers[index]
                                            ? 'bg-green-100 text-green-600'
                                            : index === currentQuestionIndex
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {answers[index]
                                            ? <CheckCircle className="w-4 h-4" />
                                            : index + 1
                                        }
                                    </div>
                                    <span className={`text-sm ${
                                        answers[index]
                                            ? 'text-green-600 font-medium'
                                            : index === currentQuestionIndex
                                                ? 'text-blue-600 font-medium'
                                                : 'text-gray-500'
                                    }`}>
                                        질문 {index + 1} {answers[index] ? `(${formatTime(answers[index].recordingTime)})` : ''}
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