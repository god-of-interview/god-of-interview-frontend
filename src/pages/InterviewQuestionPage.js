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
        setInterviewStarted(true);
        setCurrentQuestionIndex(0);
        // 약간의 지연을 두어 DOM이 렌더링되도록 함
        setTimeout(async () => {
            await initializeCamera();
        }, 100);
    };
    // 카메라 초기화 - 원래 코드 기반으로 약간만 개선
    const initializeCamera = async () => {
        try {
            setRecordingError(null);
            // 기존 스트림 정리
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
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
            // videoRef 확인 후 설정
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // 자동 재생 시도
                videoRef.current.play().catch(e => {
                    console.log('자동 재생 제한 (정상):', e.message);
                });
            } else {
                // 100ms 후 재시도
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(e => {
                            console.log('자동 재생 제한 (정상):', e.message);
                        });
                    }
                }, 100);
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

    // const initializeCamera = async () => {
    //     try {
    //         console.log('=== 카메라 초기화 시작 ===');
    //         setRecordingError(null);
    //         setCameraInitialized(false);
    //         // 기존 스트림 정리
    //         if (mediaStream) {
    //             console.log('기존 스트림 정리 중...');
    //             mediaStream.getTracks().forEach(track => {
    //                 console.log('트랙 중지:', track.kind, track.label);
    //                 track.stop();
    //             });
    //             setMediaStream(null);
    //         }
    //         // 권한 상태 확인
    //         const permissions = await navigator.permissions.query({ name: 'camera' });
    //         console.log('카메라 권한 상태:', permissions.state);
    //         console.log('권한 요청 및 스트림 생성 중...');
    //         // 더 관대한 제약 조건으로 시작
    //         const constraints = {
    //             video: {
    //                 width: { min: 320, ideal: 1280, max: 1920 },
    //                 height: { min: 240, ideal: 720, max: 1080 },
    //                 frameRate: { min: 15, ideal: 30, max: 60 },
    //                 facingMode: 'user' // 전면 카메라 우선
    //             },
    //             audio: {
    //                 echoCancellation: true,
    //                 noiseSuppression: true,
    //                 autoGainControl: true,
    //                 sampleRate: { ideal: 44100 },
    //                 channelCount: { ideal: 2 }
    //             }
    //         };
    //         let stream;
    //         try {
    //             // 첫 번째 시도: 이상적인 설정으로
    //             stream = await navigator.mediaDevices.getUserMedia(constraints);
    //             console.log('이상적인 설정으로 스트림 획득 성공');
    //         } catch (error) {
    //             console.warn('이상적인 설정 실패, 기본 설정으로 재시도:', error);
    //             // 두 번째 시도: 기본 설정으로
    //             try {
    //                 stream = await navigator.mediaDevices.getUserMedia({
    //                     video: true,
    //                     audio: true
    //                 });
    //                 console.log('기본 설정으로 스트림 획득 성공');
    //             } catch (fallbackError) {
    //                 console.warn('기본 설정도 실패, 비디오만으로 재시도:', fallbackError);
    //                 // 세 번째 시도: 비디오만
    //                 stream = await navigator.mediaDevices.getUserMedia({
    //                     video: true,
    //                     audio: false
    //                 });
    //                 console.log('비디오만으로 스트림 획득 성공');
    //             }
    //         }
    //         console.log('스트림 획득 성공:', stream);
    //         console.log('비디오 트랙:', stream.getVideoTracks().map(t => ({
    //             kind: t.kind,
    //             label: t.label,
    //             enabled: t.enabled,
    //             readyState: t.readyState,
    //             settings: t.getSettings()
    //         })));
    //         setMediaStream(stream);
    //         // :불: 핵심 수정: videoRef가 준비될 때까지 기다리기
    //         const waitForVideoElement = () => {
    //             return new Promise((resolve, reject) => {
    //                 let attempts = 0;
    //                 const maxAttempts = 50; // 5초 동안 시도 (100ms * 50)
    //                 const checkVideoElement = () => {
    //                     console.log(`비디오 요소 확인 시도 ${attempts + 1}/${maxAttempts}`);
    //                     if (videoRef.current) {
    //                         console.log('비디오 요소 찾음:', videoRef.current);
    //                         resolve(videoRef.current);
    //                     } else if (attempts >= maxAttempts) {
    //                         reject(new Error('비디오 요소를 찾을 수 없습니다. 컴포넌트가 마운트되지 않았을 수 있습니다.'));
    //                     } else {
    //                         attempts++;
    //                         setTimeout(checkVideoElement, 100);
    //                     }
    //                 };
    //                 checkVideoElement();
    //             });
    //         };
    //         // 비디오 요소가 준비될 때까지 대기
    //         const videoElement = await waitForVideoElement();
    //         console.log('비디오 요소에 스트림 설정 중...');
    //         videoElement.srcObject = stream;
    //         // 비디오 요소 이벤트 리스너 설정
    //         const setupVideoEvents = () => {
    //             return new Promise((resolve, reject) => {
    //                 const timeout = setTimeout(() => {
    //                     reject(new Error('비디오 메타데이터 로드 타임아웃'));
    //                 }, 15000); // 15초 타임아웃
    //                 const handleMetadataLoaded = () => {
    //                     console.log('비디오 메타데이터 로드 완료');
    //                     clearTimeout(timeout);
    //                     videoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
    //                     videoElement.removeEventListener('error', handleError);
    //                     resolve(true);
    //                 };
    //                 const handleError = (e) => {
    //                     console.error('비디오 요소 오류:', e);
    //                     clearTimeout(timeout);
    //                     videoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
    //                     videoElement.removeEventListener('error', handleError);
    //                     reject(new Error('비디오 요소 로드 실패'));
    //                 };
    //                 // 이벤트 리스너 등록
    //                 videoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
    //                 videoElement.addEventListener('error', handleError);
    //                 // 추가 이벤트 로깅
    //                 videoElement.addEventListener('loadstart', () => {
    //                     console.log('비디오 로드 시작');
    //                 });
    //                 videoElement.addEventListener('canplay', () => {
    //                     console.log('비디오 재생 준비 완료');
    //                 });
    //                 // 이미 메타데이터가 로드되었다면 즉시 완료
    //                 if (videoElement.readyState >= 1) { // HAVE_METADATA
    //                     handleMetadataLoaded();
    //                     return;
    //                 }
    //                 // 자동 재생 시도
    //                 videoElement.play().catch(playError => {
    //                     console.log('자동 재생 실패 (정상적임):', playError.message);
    //                 });
    //             });
    //         };
    //         // 비디오 이벤트 설정 및 대기
    //         await setupVideoEvents();
    //         console.log('=== 카메라 초기화 완료 ===');
    //         setCameraInitialized(true);
    //     } catch (error) {
    //         console.error('=== 카메라 초기화 실패 ===');
    //         console.error('에러 타입:', error.constructor.name);
    //         console.error('에러 이름:', error.name);
    //         console.error('에러 메시지:', error.message);
    //         console.error('전체 에러:', error);
    //         let errorMessage = '';
    //         switch (error.name) {
    //             case 'NotAllowedError':
    //                 errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
    //                 break;
    //             case 'NotFoundError':
    //                 errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
    //                 break;
    //             case 'NotReadableError':
    //                 errorMessage = '카메라가 다른 앱에서 사용 중입니다. 다른 프로그램을 종료 후 다시 시도해주세요.';
    //                 break;
    //             case 'OverconstrainedError':
    //                 errorMessage = '요청한 카메라 설정을 지원하지 않습니다. 기본 설정으로 다시 시도하겠습니다.';
    //                 break;
    //             case 'AbortError':
    //                 errorMessage = '카메라 접근이 중단되었습니다.';
    //                 break;
    //             case 'TypeError':
    //                 errorMessage = '카메라 기능이 지원되지 않는 환경입니다. HTTPS 연결을 확인해주세요.';
    //                 break;
    //             default:
    //                 if (error.message.includes('타임아웃')) {
    //                     errorMessage = '카메라 연결 시간이 초과되었습니다. 다시 시도해주세요.';
    //                 } else if (error.message.includes('비디오 요소를 찾을 수 없습니다')) {
    //                     errorMessage = '화면 로딩 중입니다. 잠시 후 다시 시도해주세요.';
    //                 } else {
    //                     errorMessage = '카메라 연결 실패: ' + error.message;
    //                 }
    //         }
    //         setRecordingError(errorMessage);
    //         setCameraInitialized(false);
    //     }
    // };

    const startRecording = async () => {
        if (!mediaStream || !cameraInitialized) {
            console.log('카메라가 준비되지 않아 재연결 시도');
            setRecordingError('카메라가 준비되지 않았습니다. 다시 연결하는 중...');
            await initializeCamera();

            // 재연결 후에도 문제가 있다면 중단
            if (!mediaStream || !cameraInitialized) {
                setRecordingError('카메라 연결에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
                return;
            }
        }

        try {
            setRecordingError(null);
            setRecordingTime(0);
            console.log('녹화 시작 시도...');

            // MediaRecorder 지원 형식 확인
            const supportedTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=h264,opus',
                'video/webm',
                'video/mp4;codecs=h264,aac',
                'video/mp4'
            ];

            let selectedType = '';
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedType = type;
                    console.log('지원되는 형식 선택:', selectedType);
                    break;
                }
            }

            if (!selectedType) {
                throw new Error('지원되는 녹화 형식을 찾을 수 없습니다.');
            }

            const options = {
                mimeType: selectedType,
                videoBitsPerSecond: 2500000, // 2.5 Mbps
                audioBitsPerSecond: 128000   // 128 kbps
            };

            const recorder = new MediaRecorder(mediaStream, options);
            const chunks = [];

            // 녹화 데이터 수집
            recorder.ondataavailable = (event) => {
                console.log('녹화 데이터 수신:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            // 녹화 완료 처리
            recorder.onstop = async () => {
                console.log('녹화 중지, 총 청크 수:', chunks.length);

                if (chunks.length === 0) {
                    console.error('녹화된 데이터가 없습니다.');
                    setRecordingError('녹화 데이터가 생성되지 않았습니다. 다시 시도해주세요.');
                    return;
                }

                const blob = new Blob(chunks, { type: selectedType });
                console.log('최종 블롭 생성:', {
                    size: blob.size,
                    type: blob.type,
                    duration: recordingTime
                });

                if (blob.size > 0) {
                    setRecordedChunks([blob]);
                    await handleVideoRecorded(blob);
                    setHasRecordedCurrentQuestion(true);
                } else {
                    console.error('생성된 블롭이 비어있습니다.');
                    setRecordingError('녹화 파일이 비어있습니다. 다시 시도해주세요.');
                }
            };

            // 녹화 오류 처리
            recorder.onerror = (event) => {
                console.error('녹화 오류:', event.error);
                setRecordingError('녹화 중 오류가 발생했습니다: ' + (event.error?.message || '알 수 없는 오류'));
                setIsRecording(false);
            };

            // 녹화 시작
            recorder.start(1000); // 1초마다 데이터 이벤트 발생
            setMediaRecorder(recorder);
            setIsRecording(true);

            console.log('녹화 시작됨 - 형식:', selectedType);

        } catch (error) {
            console.error('녹화 시작 실패:', error);
            let errorMessage = '녹화를 시작할 수 없습니다.';

            if (error.name === 'NotSupportedError') {
                errorMessage = '이 브라우저에서는 녹화 기능을 지원하지 않습니다.';
            } else if (error.name === 'InvalidStateError') {
                errorMessage = '녹화 상태가 올바르지 않습니다. 카메라를 다시 연결해주세요.';
            } else if (error.message) {
                errorMessage += ' ' + error.message;
            }

            setRecordingError(errorMessage);
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
                <div className="max-w-5xl mx-auto px-4 py-4">
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

            {/* 메인 컨텐츠 - 새로운 중앙 집중형 레이아웃 */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* 질문 영역 - 상단에 중앙 정렬 */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                                {currentQuestionIndex + 1}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">질문</h2>
                            {hasRecordedCurrentQuestion && (
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 text-sm font-medium">완료</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 p-10 rounded-2xl">
                            <p className="text-2xl text-gray-800 leading-relaxed font-medium">
                                {currentQuestion?.content}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 카메라 영역 - 중앙에 크게 */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Camera className="w-6 h-6 text-gray-700" />
                            <h2 className="text-2xl font-bold text-gray-900">면접 카메라</h2>
                            <div className="flex items-center gap-2">
                                {cameraInitialized ? (
                                    <>
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-green-600 font-medium">연결됨</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                                        <span className="text-orange-600 font-medium">연결 중...</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 대형 카메라 화면 */}
                    <div className="relative">
                        <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-4 border-gray-200" style={{ minHeight: '400px' }}>
                            {mediaStream && cameraInitialized ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <div className="text-center text-white p-12">
                                    <Camera className="w-24 h-24 mx-auto mb-8 opacity-30" />
                                    <h3 className="text-2xl text-gray-300 mb-4 font-medium">
                                        {recordingError ? '카메라 연결 실패' : '카메라 연결 중...'}
                                    </h3>
                                    {recordingError && (
                                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                                            <p className="text-red-300 text-lg mb-3">{recordingError}</p>
                                            <button
                                                onClick={initializeCamera}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                            >
                                                카메라 다시 연결
                                            </button>
                                        </div>
                                    )}
                                    {!recordingError && (
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 녹화 시간 오버레이 */}
                        {isRecording && (
                            <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="font-mono font-bold text-lg">REC {formatTime(recordingTime)}</span>
                            </div>
                        )}
                    </div>

                    {/* 녹화 컨트롤 - 카메라 바로 아래 */}
                    <div className="mt-8">
                        {/* 오류 메시지 */}
                        {recordingError && !recordingError.includes('권한') && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-700 font-medium">{recordingError}</p>
                                </div>
                                <button
                                    onClick={initializeCamera}
                                    className="mt-3 text-blue-600 hover:text-blue-800 underline font-medium"
                                >
                                    다시 시도하기
                                </button>
                            </div>
                        )}

                        {/* 녹화 버튼 */}
                        <div className="flex justify-center mb-6">
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                                    disabled={!cameraInitialized || !!recordingError}
                                >
                                    <Play className="w-7 h-7" />
                                    답변 시작하기
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    <Square className="w-7 h-7" />
                                    답변 완료하기
                                </button>
                            )}
                        </div>

                        {/* 녹화 완료 상태 */}
                        {hasRecordedCurrentQuestion && !isRecording && (
                            <div className="flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <span className="text-green-700 font-semibold text-lg">이 질문의 답변이 성공적으로 녹화되었습니다!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 하단: 답변 진행 상황과 네비게이션 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 답변 진행 상황 */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                            답변 진행 상황
                        </h3>
                        <div className="space-y-4">
                            {questions.map((_, index) => (
                                <div key={index} className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                                    index === currentQuestionIndex ? 'border-blue-300 bg-blue-50' : 'border-gray-100'
                                }`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
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
                                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            ) : answers[index].uploaded ? (
                                                <CheckCircle className="w-6 h-6" />
                                            ) : (
                                                '!'
                                            )
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-semibold ${
                                            answers[index]
                                                ? answers[index].uploading
                                                    ? 'text-blue-600'
                                                    : answers[index].uploaded
                                                        ? 'text-green-600'
                                                        : 'text-orange-600'
                                                : index === currentQuestionIndex
                                                    ? 'text-blue-600'
                                                    : 'text-gray-500'
                                        }`}>
                                            질문 {index + 1}
                                            {index === currentQuestionIndex && (
                                                <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">현재</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {answers[index] ? (
                                                answers[index].uploading ? '업로드 중...' :
                                                    answers[index].uploaded ? `녹화 시간: ${formatTime(answers[index].recordingTime)}` :
                                                        '업로드 실패'
                                            ) : (
                                                '답변 대기 중'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 면접 컨트롤 */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-green-600 to-blue-600 rounded-full"></div>
                            면접 컨트롤
                        </h3>

                        {/* 현재 상태 */}
                        <div className="space-y-4 mb-8">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-600 font-medium">현재 질문</span>
                                    <span className="font-bold text-lg text-blue-600">{currentQuestionIndex + 1} / {questions.length}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${getProgress()}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 font-medium">녹화 상태</span>
                                <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                                    isRecording ? 'bg-red-100 text-red-600' :
                                        hasRecordedCurrentQuestion ? 'bg-green-100 text-green-600' :
                                            'bg-orange-100 text-orange-600'
                                }`}>
                                    {isRecording ? 'REC 녹화 중' : hasRecordedCurrentQuestion ? '✓ 녹화 완료' : '⏺ 녹화 필요'}
                                </span>
                            </div>

                            {isUploading && (
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="text-gray-600 font-medium">업로드</span>
                                    <span className="font-medium text-blue-600 flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        진행 중...
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 네비게이션 버튼 */}
                        <div className="space-y-4">
                            <button
                                onClick={() => executeNavigation('prev')}
                                disabled={currentQuestionIndex === 0}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 text-gray-600 hover:text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                이전 질문으로
                            </button>

                            {!hasRecordedCurrentQuestion && currentQuestionIndex < questions.length - 1 && (
                                <div className="text-center text-orange-600 py-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <span className="font-medium">⚠️ 답변을 녹화한 후 다음 질문으로 이동하세요</span>
                                </div>
                            )}

                            <button
                                onClick={() => handleNavigationRequest('next')}
                                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                                    hasRecordedCurrentQuestion || currentQuestionIndex === questions.length - 1
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                                }`}
                            >
                                {currentQuestionIndex === questions.length - 1 ? (
                                    <>
                                        🎉 면접 완료하기
                                    </>
                                ) : (
                                    <>
                                        다음 질문으로
                                        <SkipForward className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 면접 팁 */}
                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                            <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                💡 면접 성공 팁
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>카메라 렌즈를 직접 바라보며 답변하세요</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>명확하고 자신감 있는 목소리로 말하세요</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>STAR 기법(상황-과제-행동-결과)을 활용하세요</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600">•</span>
                                    <span>구체적인 사례와 수치를 포함하여 답변하세요</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewQuestionPage;