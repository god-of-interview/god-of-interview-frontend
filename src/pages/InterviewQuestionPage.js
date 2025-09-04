// src/pages/InterviewQuestionPage.js - 버그 수정 및 레이아웃 개선 버전

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
    const [isProcessingVideo, setIsProcessingVideo] = useState(false); // 비디오 처리 중 상태 추가

    // WebRTC 관련 상태
    const [mediaStream, setMediaStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingError, setRecordingError] = useState(null);
    const [cameraInitialized, setCameraInitialized] = useState(false);
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

    // 비디오 스트림이 변경될 때마다 비디오 엘리먼트 업데이트
    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;

            const playVideo = async () => {
                try {
                    await videoRef.current.play();
                    setCameraInitialized(true);
                } catch (error) {
                    setTimeout(playVideo, 100);
                }
            };

            videoRef.current.onloadedmetadata = playVideo;
            videoRef.current.onloadeddata = playVideo;
            videoRef.current.oncanplay = playVideo;
            videoRef.current.onplaying = () => setCameraInitialized(true);
        }
    }, [mediaStream]);

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
            const result = await interviewService.startInterview(selectedJob.id);
            setInterviewId(result.data.id);

            setInterviewStarted(true);
            setCurrentQuestionIndex(0);
            await initializeCamera();
        } catch (error) {
            setError(error.message);
        }
    };

    // 카메라 초기화
    const initializeCamera = async () => {
        try {
            setRecordingError(null);
            setCameraInitialized(false);

            // 기존 스트림 정리
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            // 단계별 constraint 시도
            const constraintOptions = [
                {
                    video: {
                        width: { ideal: 1280, min: 320 },
                        height: { ideal: 720, min: 240 },
                        frameRate: { ideal: 30, min: 15 },
                        facingMode: 'user'
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    }
                },
                {
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: 'user'
                    },
                    audio: true
                },
                {
                    video: true,
                    audio: true
                },
                {
                    video: true,
                    audio: false
                }
            ];

            let stream = null;
            for (let i = 0; i < constraintOptions.length; i++) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraintOptions[i]);
                    break;
                } catch (error) {
                    if (i === constraintOptions.length - 1) {
                        throw error;
                    }
                }
            }

            if (!stream) {
                throw new Error('모든 카메라 설정 시도가 실패했습니다.');
            }

            setMediaStream(stream);

        } catch (error) {
            let errorMessage = '카메라 연결에 실패했습니다.';

            if (error.name === 'NotAllowedError') {
                errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '카메라가 다른 프로그램에서 사용 중입니다. 다른 프로그램을 종료하고 다시 시도해주세요.';
            }

            setRecordingError(errorMessage);
        }
    };

    const startRecording = async () => {
        // 이미 녹화 중이거나 비디오 처리 중인 경우 중단
        if (isRecording || isProcessingVideo) {
            console.log('이미 녹화 중이거나 처리 중입니다.');
            return;
        }

        // 현재 질문에 이미 답변이 있는 경우 확인
        if (hasCurrentAnswer()) {
            const confirmed = confirm('이미 녹화된 답변이 있습니다. 다시 녹화하시겠습니까?');
            if (!confirmed) return;
        }

        if (!mediaStream) {
            await initializeCamera();
            return;
        }

        try {
            setRecordingError(null);
            setRecordingTime(0);
            setIsProcessingVideo(false);

            // 파일 크기를 줄이기 위해 더 낮은 품질 설정 사용
            const options = {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: 1000000, // 1 Mbps로 제한
                audioBitsPerSecond: 128000   // 128 kbps로 제한
            };

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm';
                delete options.videoBitsPerSecond;
                delete options.audioBitsPerSecond;
            }

            const recorder = new MediaRecorder(mediaStream, options);
            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                setIsProcessingVideo(true);
                const blob = new Blob(chunks, { type: 'video/webm' });
                handleVideoRecorded(blob);
            };

            recorder.onerror = (event) => {
                setRecordingError('녹화 중 오류가 발생했습니다.');
                console.error('녹화 오류:', event.error);
            };

            recorder.start(1000);
            setMediaRecorder(recorder);
            setIsRecording(true);

        } catch (error) {
            setRecordingError('녹화를 시작할 수 없습니다: ' + error.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording' && !isProcessingVideo) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleVideoRecorded = async (videoBlob) => {
        try {
            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex] = {
                questionId: questions[currentQuestionIndex].id,
                videoBlob: videoBlob,
                recordingTime: recordingTime,
                timestamp: new Date().toISOString(),
                uploaded: false
            };
            setAnswers(newAnswers);

            console.log(`답변 저장: ${(videoBlob.size / (1024 * 1024)).toFixed(1)}MB`);

            // 백엔드 업로드 (에러 처리 개선)
            try {
                await interviewService.uploadVideo(
                    interviewId,
                    currentQuestionIndex + 1,
                    videoBlob
                );

                newAnswers[currentQuestionIndex].uploaded = true;
                setAnswers([...newAnswers]);
                console.log('서버 업로드 성공');
            } catch (error) {
                console.error('업로드 실패:', error);

                // 구체적인 오류 메시지 표시
                let errorMsg = '서버 업로드에 실패했습니다.';
                if (error.message.includes('413') || error.message.includes('파일이 너무 큽니다')) {
                    errorMsg = '파일이 너무 큽니다. 더 짧게 답변해주세요.';
                } else if (error.message.includes('500')) {
                    errorMsg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                }

                setRecordingError(errorMsg);

                // 로컬에는 저장되어 있으므로 사용자에게 알림
                alert('업로드에 실패했지만 답변은 로컬에 저장되었습니다. 면접을 계속 진행할 수 있습니다.');
            }
        } finally {
            setIsProcessingVideo(false);
        }
    };

    // 답변이 있는지 확인하는 함수
    const hasCurrentAnswer = () => {
        return answers[currentQuestionIndex] && answers[currentQuestionIndex].videoBlob;
    };

    const goToNextQuestion = () => {
        if (isRecording) {
            stopRecording();
            return;
        }

        // 현재 질문에 답변이 없으면 경고
        if (!hasCurrentAnswer()) {
            alert('먼저 현재 질문에 답변을 녹화해주세요.');
            return;
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setRecordingTime(0);
            setIsProcessingVideo(false);
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
            setIsProcessingVideo(false);
        }
    };

    const completeInterview = async () => {
        // 모든 질문에 답변했는지 확인
        const unansweredQuestions = answers.filter(answer => !answer || !answer.videoBlob).length;
        if (unansweredQuestions > 0) {
            if (!confirm(`${unansweredQuestions}개의 질문에 답변하지 않았습니다. 정말 면접을 완료하시겠습니까?`)) {
                return;
            }
        }

        try {
            if (interviewId) {
                await interviewService.completeInterview(interviewId);
            }

            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
            }

            setInterviewCompleted(true);
        } catch (error) {
            console.error('면접 완료 오류:', error);
            setInterviewCompleted(true);
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
                        AI 분석 결과는 잠시 후 확인하실 수 있습니다.
                    </p>

                    {interviewId && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <p className="text-blue-800 text-sm">면접 ID: {interviewId}</p>
                        </div>
                    )}

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
                <div className="max-w-6xl mx-auto px-4 py-4">
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

            {/* 메인 컨텐츠 - 개선된 레이아웃 */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 왼쪽: 질문 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 현재 질문 */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                                    {currentQuestionIndex + 1}
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">질문</h2>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                                    {currentQuestion?.content}
                                </p>
                            </div>
                        </div>

                        {/* 카메라 화면 - 크기 조정 */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">카메라</h2>
                                <button
                                    onClick={initializeCamera}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    새로고침
                                </button>
                            </div>

                            {/* 카메라 화면 - 크기 줄임 */}
                            <div className="relative mb-4">
                                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden" style={{ maxHeight: '300px' }}>
                                    {mediaStream ? (
                                        <>
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                                style={{
                                                    transform: 'scaleX(-1)',
                                                    backgroundColor: '#000'
                                                }}
                                            />
                                            {/* 녹화 중 표시 */}
                                            {isRecording && (
                                                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                                    <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
                                                    <span className="text-sm">녹화 중</span>
                                                </div>
                                            )}
                                            {/* 처리 중 표시 */}
                                            {isProcessingVideo && (
                                                <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-white rounded-full animate-spin"></div>
                                                    <span className="text-sm">처리 중...</span>
                                                </div>
                                            )}
                                            {/* 카메라 상태 표시 */}
                                            {!cameraInitialized && (
                                                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                                                    <div className="text-center text-white">
                                                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm mb-2">비디오 초기화 중...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center text-white">
                                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p className="text-gray-300 mb-4">
                                                {recordingError ? '카메라 연결 실패' : '카메라 연결 중...'}
                                            </p>
                                            {recordingError && (
                                                <button
                                                    onClick={initializeCamera}
                                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                                >
                                                    다시 시도
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 녹화 컨트롤 */}
                                <div className="flex items-center justify-center gap-4 mt-4">
                                    {!isRecording ? (
                                        <button
                                            onClick={startRecording}
                                            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                                            disabled={!mediaStream || isProcessingVideo}
                                        >
                                            <Play className="w-5 h-5" />
                                            {isProcessingVideo ? '처리 중...' : '답변 시작'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopRecording}
                                            className="flex items-center gap-3 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
                                        >
                                            <Square className="w-5 h-5" />
                                            답변 완료
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 오류 메시지 */}
                            {recordingError && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="text-red-700 text-sm font-medium">오류 발생</p>
                                        <p className="text-red-600 text-sm">{recordingError}</p>
                                    </div>
                                </div>
                            )}

                            {/* 성공 메시지 */}
                            {cameraInitialized && !recordingError && (
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <p className="text-green-700 text-sm">카메라가 성공적으로 연결되었습니다!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 답변 진행 상황 */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">답변 진행 상황</h2>
                            <div className="space-y-3">
                                {questions.map((_, index) => (
                                    <div key={index} className={`p-4 rounded-lg border-2 transition-colors ${
                                        answers[index]
                                            ? 'border-green-200 bg-green-50'
                                            : index === currentQuestionIndex
                                                ? 'border-blue-200 bg-blue-50'
                                                : 'border-gray-200 bg-gray-50'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                                                answers[index]
                                                    ? 'bg-green-600 text-white'
                                                    : index === currentQuestionIndex
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-400 text-white'
                                            }`}>
                                                {answers[index]
                                                    ? <CheckCircle className="w-4 h-4" />
                                                    : index + 1
                                                }
                                            </div>
                                            <span className={`font-medium text-sm ${
                                                answers[index]
                                                    ? 'text-green-700'
                                                    : index === currentQuestionIndex
                                                        ? 'text-blue-700'
                                                        : 'text-gray-500'
                                            }`}>
                                                질문 {index + 1}
                                            </span>
                                        </div>
                                        {answers[index] && (
                                            <div className="text-xs text-gray-600">
                                                {formatTime(answers[index].recordingTime)}
                                                <br />
                                                {answers[index].uploaded ? (
                                                    <span className="text-green-600">✓ 업로드됨</span>
                                                ) : (
                                                    <span className="text-orange-600">⏳ 대기중</span>
                                                )}
                                            </div>
                                        )}
                                        {index === currentQuestionIndex && !answers[index] && (
                                            <div className="text-xs text-blue-600 font-medium">현재 질문</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 현재 답변 상태 */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 답변</h3>
                            <div className="text-center">
                                {hasCurrentAnswer() ? (
                                    <div className="text-green-600">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-medium">답변 완료</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {formatTime(answers[currentQuestionIndex]?.recordingTime || 0)}
                                        </p>
                                    </div>
                                ) : isRecording ? (
                                    <div className="text-red-600">
                                        <div className="w-8 h-8 bg-red-600 rounded-full mx-auto mb-2 animate-pulse"></div>
                                        <p className="font-medium">녹화 중</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {formatTime(recordingTime)}
                                        </p>
                                    </div>
                                ) : isProcessingVideo ? (
                                    <div className="text-orange-600">
                                        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-2 animate-spin"></div>
                                        <p className="font-medium">처리 중</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                        <p className="font-medium">답변 대기</p>
                                        <p className="text-sm mt-1">녹화 버튼을 눌러 답변을 시작하세요</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 네비게이션 */}
                <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            이전 질문
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">
                                질문 {currentQuestionIndex + 1} / {questions.length}
                            </p>
                            <div className="flex items-center gap-2">
                                {hasCurrentAnswer() ? (
                                    <span className="text-green-600 text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        답변 완료
                                    </span>
                                ) : (
                                    <span className="text-orange-600 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        답변 필요
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={goToNextQuestion}
                            disabled={!hasCurrentAnswer() || isRecording || isProcessingVideo}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                hasCurrentAnswer() && !isRecording && !isProcessingVideo
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {currentQuestionIndex === questions.length - 1 ? '면접 완료' : '다음 질문'}
                            {currentQuestionIndex < questions.length - 1 && <SkipForward className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* 안내 메시지 */}
                    {!hasCurrentAnswer() && !isRecording && !isProcessingVideo && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-600 text-sm">
                                현재 질문에 답변을 녹화한 후 다음 질문으로 넘어갈 수 있습니다.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterviewQuestionPage;