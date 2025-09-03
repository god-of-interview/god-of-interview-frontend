import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Square, SkipForward, Clock, Camera, Mic, AlertCircle, CheckCircle, X } from 'lucide-react';
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

    // 질문별 녹화 필수 검증
    const [hasRecordedCurrentQuestion, setHasRecordedCurrentQuestion] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // WebRTC 관련 상태
    const [mediaStream, setMediaStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [recordingError, setRecordingError] = useState(null);
    const [cameraInitialized, setCameraInitialized] = useState(false);
    const videoRef = useRef(null);

    // 다음 질문 이동 시 확인 모달
    const [showNavigationWarning, setShowNavigationWarning] = useState(false);

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

    // 현재 질문 변경 시 녹화 상태 리셋
    useEffect(() => {
        setHasRecordedCurrentQuestion(false);
        setRecordingTime(0);
    }, [currentQuestionIndex]);

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
            setError('면접 시작에 실패했습니다: ' + error.message);
        }
    };

    const initializeCamera = async () => {
        try {
            console.log('=== 카메라 초기화 시작 ===');
            setRecordingError(null);
            setCameraInitialized(false);

            // 기존 스트림 정리
            if (mediaStream) {
                console.log('기존 스트림 정리 중...');
                mediaStream.getTracks().forEach(track => {
                    console.log('트랙 중지:', track.kind, track.label);
                    track.stop();
                });
            }

            console.log('권한 요청 및 스트림 생성 중...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            console.log('스트림 획득 성공:', stream);
            console.log('비디오 트랙:', stream.getVideoTracks().map(t => ({
                kind: t.kind,
                label: t.label,
                enabled: t.enabled,
                readyState: t.readyState
            })));

            setMediaStream(stream);

            // 비디오 요소에 스트림 설정
            if (videoRef.current) {
                console.log('비디오 요소에 스트림 설정 중...');
                videoRef.current.srcObject = stream;

                // 즉시 재생 시도
                try {
                    await videoRef.current.play();
                    console.log('비디오 재생 시작됨');
                } catch (playError) {
                    console.log('자동 재생 실패 (정상):', playError.message);
                }

                // 메타데이터 로드 대기
                const waitForMetadata = new Promise((resolve) => {
                    if (videoRef.current.readyState >= 1) { // HAVE_METADATA
                        resolve();
                    } else {
                        videoRef.current.onloadedmetadata = resolve;
                    }
                });

                await waitForMetadata;
                console.log('=== 비디오 메타데이터 로드 완료 ===');
                setCameraInitialized(true);

            } else {
                console.error('videoRef.current가 null입니다!');
                throw new Error('비디오 요소를 찾을 수 없습니다.');
            }

        } catch (error) {
            console.error('=== 카메라 초기화 실패 ===');
            console.error('에러 타입:', error.constructor.name);
            console.error('에러 이름:', error.name);
            console.error('에러 메시지:', error.message);

            let errorMessage = '';

            switch (error.name) {
                case 'NotAllowedError':
                    errorMessage = '카메라 권한이 거부되었습니다. 브라우저에서 권한을 허용해주세요.';
                    break;
                case 'NotFoundError':
                    errorMessage = '카메라를 찾을 수 없습니다.';
                    break;
                case 'NotReadableError':
                    errorMessage = '카메라가 다른 앱에서 사용 중입니다.';
                    break;
                case 'OverconstrainedError':
                    errorMessage = '카메라 설정을 지원하지 않습니다.';
                    break;
                default:
                    errorMessage = '카메라 연결 실패: ' + error.message;
            }

            setRecordingError(errorMessage);
        }
    };

    const startRecording = async () => {
        if (!mediaStream || !cameraInitialized) {
            setRecordingError('카메라가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
            await initializeCamera();
            return;
        }

        try {
            setRecordingError(null);
            setRecordingTime(0);
            console.log('녹화 시작 시도...');

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

            recorder.onstop = async () => {
                console.log('녹화 중지, 데이터 처리 시작...');
                const blob = new Blob(chunks, { type: 'video/webm' });

                if (blob.size > 0) {
                    setRecordedChunks([blob]);
                    await handleVideoRecorded(blob);
                    setHasRecordedCurrentQuestion(true);
                } else {
                    console.error('녹화된 데이터가 없습니다.');
                    setRecordingError('녹화 데이터가 생성되지 않았습니다. 다시 시도해주세요.');
                }
            };

            recorder.onerror = (event) => {
                console.error('녹화 오류:', event.error);
                setRecordingError('녹화 중 오류가 발생했습니다.');
                setIsRecording(false);
            };

            recorder.start(100);
            setMediaRecorder(recorder);
            setIsRecording(true);

            console.log('녹화 시작됨');

        } catch (error) {
            console.error('녹화 시작 실패:', error);
            setRecordingError('녹화를 시작할 수 없습니다: ' + error.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            console.log('녹화 중지 요청...');
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleVideoRecorded = async (videoBlob) => {
        console.log('비디오 녹화 완료:', {
            size: videoBlob.size,
            type: videoBlob.type,
            duration: recordingTime
        });

        // 현재 질문의 답변 저장
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = {
            questionId: questions[currentQuestionIndex].id,
            videoBlob: videoBlob,
            recordingTime: recordingTime,
            timestamp: new Date().toISOString(),
            uploaded: false,
            uploading: false
        };
        setAnswers(newAnswers);

        // 서버에 업로드
        await uploadVideoToServer(videoBlob, newAnswers);
    };

    const uploadVideoToServer = async (videoBlob, currentAnswers) => {
        if (!interviewId) {
            console.error('면접 세션 ID가 없습니다.');
            return;
        }

        try {
            setIsUploading(true);

            // 업로딩 상태 표시
            const newAnswers = [...currentAnswers];
            newAnswers[currentQuestionIndex].uploading = true;
            setAnswers(newAnswers);

            console.log('서버 업로드 시작...');
            const result = await interviewService.uploadVideo(interviewId, currentQuestionIndex + 1, videoBlob);
            console.log('서버 업로드 성공:', result);

            // 업로드 완료 상태 업데이트
            newAnswers[currentQuestionIndex].uploaded = true;
            newAnswers[currentQuestionIndex].uploading = false;
            newAnswers[currentQuestionIndex].videoUrl = result.data?.videoUrl;
            setAnswers([...newAnswers]);

        } catch (error) {
            console.error('서버 업로드 실패:', error);

            // 업로드 실패 상태 업데이트
            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex].uploading = false;
            setAnswers([...newAnswers]);

            setRecordingError('업로드에 실패했습니다: ' + error.message);
        } finally {
            setIsUploading(false);
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

    const handleNavigationRequest = (direction) => {
        // 녹화 중이면 경고
        if (isRecording) {
            setShowNavigationWarning(true);
            return;
        }

        // 현재 질문에 대한 답변이 없으면 경고 (마지막 질문이 아닌 경우)
        if (!hasRecordedCurrentQuestion && direction === 'next' && currentQuestionIndex < questions.length - 1) {
            setShowNavigationWarning(true);
            return;
        }

        // 실제 이동 실행
        executeNavigation(direction);
    };

    const executeNavigation = (direction) => {
        if (isRecording) {
            stopRecording();
        }

        if (direction === 'next') {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                completeInterview();
            }
        } else if (direction === 'prev') {
            if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1);
            }
        }

        setShowNavigationWarning(false);
    };

    const completeInterview = async () => {
        try {
            if (interviewId) {
                await interviewService.completeInterview(interviewId);
            }
        } catch (error) {
            console.error('면접 완료 처리 실패:', error);
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }

        setInterviewCompleted(true);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgress = () => {
        return ((currentQuestionIndex + 1) / questions.length) * 100;
    };

    // 업로드 대기 중인 질문 수 계산
    const getPendingUploads = () => {
        return answers.filter(answer => answer && !answer.uploaded && !answer.uploading).length;
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
        const pendingUploads = getPendingUploads();

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-4 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">면접이 완료되었습니다!</h1>
                    <p className="text-gray-600 mb-6">
                        총 {questions.length}개의 질문에 답변하셨습니다.
                        {pendingUploads > 0 && (
                            <span className="block text-orange-600 mt-2">
                                {pendingUploads}개 영상이 아직 업로드 대기 중입니다.
                            </span>
                        )}
                    </p>

                    {interviewId && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                면접 ID: <span className="font-mono font-semibold">{interviewId}</span>
                            </p>
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
                                            {answer.uploading ? (
                                                <span className="text-xs text-blue-600">⏳ 업로드 중...</span>
                                            ) : answer.uploaded ? (
                                                <span className="text-xs text-green-600">✓ 업로드 완료</span>
                                            ) : (
                                                <span className="text-xs text-red-600">❌ 업로드 실패</span>
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
                                        <h3 className="font-medium text-gray-900">녹화 필수</h3>
                                        <p className="text-sm text-gray-600">모든 질문에 대해 녹화된 답변이 필요합니다</p>
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
            {/* 경고 모달 */}
            {showNavigationWarning && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-orange-500" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isRecording ? '녹화 중입니다' : '답변이 녹화되지 않았습니다'}
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            {isRecording
                                ? '녹화를 중지하고 이동하시겠습니까?'
                                : '현재 질문에 대한 답변을 녹화하지 않았습니다. 계속 진행하시겠습니까?'
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowNavigationWarning(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => executeNavigation('next')}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                            >
                                계속 진행
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 상단 진행률 바 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4">
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
                            {isUploading && (
                                <span className="text-sm text-blue-600">업로드 중...</span>
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

            {/* 메인 컨텐츠 - 새로운 레이아웃: 질문이 위, 카메라가 아래 중앙에 크게 */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 질문 영역 - 상단에 중앙 정렬 */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-lg">
                                {currentQuestionIndex + 1}
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">질문</h2>
                            {hasRecordedCurrentQuestion && (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            )}
                        </div>
                        <div className="bg-blue-50 border-l-4 border-blue-600 p-8 rounded-r-lg max-w-4xl mx-auto">
                            <p className="text-xl text-gray-800 leading-relaxed text-center">
                                {currentQuestion?.content}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 왼쪽: 답변 상태 */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">답변 진행 상황</h3>
                        <div className="space-y-3">
                            {questions.map((_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        answers[index]
                                            ? answers[index].uploading
                                                ? 'bg-blue-100 text-blue-600'
                                                : answers[index].uploaded
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-orange-100 text-orange-600'
                                            : index === currentQuestionIndex
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {answers[index] ? (
                                            answers[index].uploading ? (
                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            ) : answers[index].uploaded ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                '!'
                                            )
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span className={`text-sm ${
                                        answers[index]
                                            ? answers[index].uploading
                                                ? 'text-blue-600 font-medium'
                                                : answers[index].uploaded
                                                    ? 'text-green-600 font-medium'
                                                    : 'text-orange-600 font-medium'
                                            : index === currentQuestionIndex
                                                ? 'text-blue-600 font-medium'
                                                : 'text-gray-500'
                                    }`}>
                                        질문 {index + 1}
                                        {answers[index] ? (
                                            answers[index].uploading ? ' (업로드 중)' :
                                                answers[index].uploaded ? ` (${formatTime(answers[index].recordingTime)})` :
                                                    ' (업로드 실패)'
                                        ) : (
                                            index === currentQuestionIndex ? ' (현재)' : ''
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 중앙: 카메라 영역 - 크게 */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="text-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">카메라</h2>
                            <div className="flex items-center justify-center gap-2 text-sm">
                                {cameraInitialized ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        연결됨
                                    </span>
                                ) : (
                                    <span className="text-orange-600 flex items-center gap-1">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                        연결 중...
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 큰 카메라 화면 */}
                        <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center mb-6 overflow-hidden shadow-lg" style={{ minHeight: '300px' }}>
                            {mediaStream && cameraInitialized ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <div className="text-center text-white p-8">
                                    <Camera className="w-20 h-20 mx-auto mb-6 opacity-50" />
                                    <p className="text-lg text-gray-300 mb-4">
                                        {recordingError ? '카메라 연결 실패' : '카메라 연결 중...'}
                                    </p>
                                    {recordingError && (
                                        <div className="text-red-400 text-sm mb-4">
                                            {recordingError}
                                        </div>
                                    )}
                                    {recordingError && recordingError.includes('권한') && (
                                        <button
                                            onClick={initializeCamera}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                                        >
                                            권한 재요청
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 녹화 컨트롤 */}
                        <div className="text-center space-y-4">
                            {/* 오류 메시지 */}
                            {recordingError && !recordingError.includes('권한') && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">{recordingError}</p>
                                    <button
                                        onClick={initializeCamera}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            )}

                            {/* 녹화 버튼 */}
                            <div className="flex justify-center">
                                {!isRecording ? (
                                    <button
                                        onClick={startRecording}
                                        className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!cameraInitialized || recordingError}
                                    >
                                        <Play className="w-6 h-6" />
                                        답변 시작
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        className="flex items-center gap-3 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
                                    >
                                        <Square className="w-6 h-6" />
                                        답변 완료
                                    </button>
                                )}
                            </div>

                            {/* 녹화 시간 표시 */}
                            {isRecording && (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-2xl font-mono text-red-600 font-bold">
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                            )}

                            {/* 녹화 완료 상태 */}
                            {hasRecordedCurrentQuestion && !isRecording && (
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">이 질문의 답변이 녹화되었습니다</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 컨트롤 및 정보 */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">면접 컨트롤</h3>

                        {/* 현재 상태 */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">현재 질문:</span>
                                <span className="font-medium">{currentQuestionIndex + 1} / {questions.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">녹화 상태:</span>
                                <span className={`font-medium ${isRecording ? 'text-red-600' : hasRecordedCurrentQuestion ? 'text-green-600' : 'text-orange-600'}`}>
                                    {isRecording ? '녹화 중' : hasRecordedCurrentQuestion ? '녹화 완료' : '녹화 필요'}
                                </span>
                            </div>
                            {isUploading && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">업로드:</span>
                                    <span className="font-medium text-blue-600">진행 중...</span>
                                </div>
                            )}
                        </div>

                        {/* 네비게이션 버튼 */}
                        <div className="space-y-3">
                            <button
                                onClick={() => executeNavigation('prev')}
                                disabled={currentQuestionIndex === 0}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                이전 질문
                            </button>

                            {!hasRecordedCurrentQuestion && currentQuestionIndex < questions.length - 1 && (
                                <div className="text-center text-sm text-orange-600 py-2">
                                    답변을 녹화해주세요
                                </div>
                            )}

                            <button
                                onClick={() => handleNavigationRequest('next')}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                    hasRecordedCurrentQuestion || currentQuestionIndex === questions.length - 1
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                            >
                                {currentQuestionIndex === questions.length - 1 ? '면접 완료' : '다음 질문'}
                                {currentQuestionIndex < questions.length - 1 && <SkipForward className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* 팁 */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 면접 팁</h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• 카메라를 직접 바라보며 답변하세요</li>
                                <li>• 명확하고 자신감 있게 말하세요</li>
                                <li>• STAR 기법을 활용해보세요</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewQuestionPage;