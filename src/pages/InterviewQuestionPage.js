// src/pages/InterviewQuestionPage.js 파일을 이것으로 교체

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Square, SkipForward, Clock, Camera, Mic, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { interviewService } from '../services/interviewService';

const InterviewQuestionPage = ({ onNavigate, selectedJob }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 면접 관련 상태
    const [interviewId, setInterviewId] = useState(null);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewCompleted, setInterviewCompleted] = useState(false);

    // 녹화 관련 상태
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [answers, setAnswers] = useState([]);

    // WebRTC 관련 상태
    const [mediaStream, setMediaStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingError, setRecordingError] = useState(null);
    const [debugInfo, setDebugInfo] = useState([]);
    const videoRef = useRef(null);

    // 디버그 정보 추가 함수
    const addDebugInfo = (message) => {
        console.log('[Camera Debug]', message);
        setDebugInfo(prev => [...prev, { message, timestamp: new Date().toLocaleTimeString() }]);
    };

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
            setAnswers(new Array(result.data.length).fill(null));

        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startInterview = async () => {
        try {
            // 백엔드에 면접 시작 요청
            addDebugInfo('면접 시작 요청 중...');
            const result = await interviewService.startInterview(selectedJob.id);
            setInterviewId(result.data.id);
            addDebugInfo(`면접 ID ${result.data.id}로 시작됨`);

            setInterviewStarted(true);
            setCurrentQuestionIndex(0);
            await initializeCamera();
        } catch (error) {
            setError(error.message);
            addDebugInfo(`면접 시작 실패: ${error.message}`);
        }
    };

    // 카메라 초기화 (디버깅 포함)
    const initializeCamera = async () => {
        try {
            setRecordingError(null);
            addDebugInfo('카메라 초기화 시작...');

            // 기존 스트림 정리
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
            }

            // 디바이스 확인
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            addDebugInfo(`비디오 디바이스 ${videoDevices.length}개 발견`);

            const constraints = {
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            addDebugInfo('스트림 획득 성공');

            setMediaStream(stream);

            // 비디오 엘리먼트 설정
            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // 이벤트 리스너들
                videoRef.current.onloadedmetadata = () => {
                    addDebugInfo(`비디오 해상도: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                };

                videoRef.current.oncanplay = () => {
                    addDebugInfo('비디오 재생 준비 완료');
                };

                // 자동 재생 시도
                try {
                    await videoRef.current.play();
                    addDebugInfo('비디오 재생 시작');
                } catch (playError) {
                    addDebugInfo(`재생 오류: ${playError.message}`);
                }
            }

        } catch (error) {
            addDebugInfo(`카메라 오류: ${error.name} - ${error.message}`);

            let errorMessage = '카메라 연결에 실패했습니다.';

            if (error.name === 'NotAllowedError') {
                errorMessage = '카메라 권한이 거부되었습니다.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '카메라를 찾을 수 없습니다.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '카메라가 다른 프로그램에서 사용 중입니다.';
            }

            setRecordingError(errorMessage);
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

            const options = { mimeType: 'video/webm;codecs=vp9,opus' };

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

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                handleVideoRecorded(blob);
            };

            recorder.onerror = (event) => {
                setRecordingError('녹화 중 오류가 발생했습니다.');
                addDebugInfo(`녹화 오류: ${event.error}`);
            };

            recorder.start(1000);
            setMediaRecorder(recorder);
            setIsRecording(true);

            addDebugInfo('녹화 시작');

        } catch (error) {
            setRecordingError('녹화를 시작할 수 없습니다: ' + error.message);
            addDebugInfo(`녹화 시작 오류: ${error.message}`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            addDebugInfo('녹화 중지');
        }
    };

    const handleVideoRecorded = async (videoBlob) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = {
            questionId: questions[currentQuestionIndex].id,
            videoBlob: videoBlob,
            recordingTime: recordingTime,
            timestamp: new Date().toISOString(),
            uploaded: false
        };
        setAnswers(newAnswers);

        addDebugInfo(`답변 저장: ${(videoBlob.size / (1024 * 1024)).toFixed(1)}MB`);

        // 백엔드 업로드
        try {
            await interviewService.uploadVideo(
                interviewId,
                currentQuestionIndex + 1,
                videoBlob
            );

            newAnswers[currentQuestionIndex].uploaded = true;
            setAnswers([...newAnswers]);
            addDebugInfo('서버 업로드 성공');
        } catch (error) {
            addDebugInfo(`업로드 실패: ${error.message}`);
            setRecordingError('서버 업로드에 실패했습니다.');
        }
    };

    const goToNextQuestion = () => {
        if (isRecording) {
            stopRecording();
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setRecordingTime(0);
        } else {
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
            if (interviewId) {
                await interviewService.completeInterview(interviewId);
                addDebugInfo('면접 완료 처리됨');
            }

            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
            }

            setInterviewCompleted(true);
        } catch (error) {
            addDebugInfo(`면접 완료 오류: ${error.message}`);
            setInterviewCompleted(true); // 오류가 있어도 UI상 완료 처리
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        return ((currentQuestionIndex + 1) / questions.length) * 100;
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
                    </p>

                    {interviewId && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <p className="text-blue-800 text-sm">면접 ID: {interviewId}</p>
                        </div>
                    )}

                    {/* 답변들 표시 */}
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
                                            className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
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
                            대시보드로
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
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                                >
                                    {isLoading ? '준비 중...' : '면접 시작하기'}
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
                            {selectedJob?.name} 면접 {interviewId && `(ID: ${interviewId})`}
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

                    {/* 카메라 미리보기 영역 (디버깅 포함) */}
                    <div className="bg-white rounded-xl shadow-sm p-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">카메라 미리보기</h2>
                            <button
                                onClick={initializeCamera}
                                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                새로고침
                            </button>
                        </div>

                        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                            {mediaStream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
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

                        {/* 성공 메시지 */}
                        {mediaStream && !recordingError && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <p className="text-green-700 text-sm">카메라가 성공적으로 연결되었습니다!</p>
                            </div>
                        )}

                        {/* 답변 상태 표시 */}
                        <div className="space-y-2 mb-4">
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

                        {/* 디버그 로그 */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">디버그 로그</h3>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {debugInfo.length === 0 ? (
                                    <p className="text-gray-500 text-xs">로그가 없습니다.</p>
                                ) : (
                                    debugInfo.slice(-10).map((log, index) => (
                                        <div key={index} className="text-xs font-mono">
                                            <span className="text-gray-400">[{log.timestamp}]</span>
                                            <span className="ml-2 text-gray-700">{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
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