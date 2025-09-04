// src/services/interviewService.js - 수정된 버전

const API_BASE_URL = 'http://localhost:8080/api/interviews';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const interviewService = {
    // 면접 시작 - 새로운 백엔드 API 사용
    startInterview: async (jobId) => {
        try {
            console.log('면접 시작 요청:', { jobId });

            const response = await fetch(`${API_BASE_URL}/start?jobId=${jobId}`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            console.log('면접 시작 응답 상태:', response.status);
            const result = await response.json();
            console.log('면접 시작 응답 데이터:', result);

            if (!response.ok) {
                throw new Error(result.message || '면접 시작에 실패했습니다.');
            }

            return result;
        } catch (error) {
            console.error('면접 시작 오류:', error);
            throw error;
        }
    },

    // 영상 업로드 - 개선된 버전
    uploadVideo: async (interviewId, questionNumber, videoFile) => {
        try {
            console.log('비디오 업로드 시작:', {
                interviewId,
                questionNumber,
                fileSize: videoFile.size,
                fileType: videoFile.type
            });

            const formData = new FormData();

            // 파일을 'video'라는 이름으로 추가 (백엔드 @RequestPart와 일치)
            formData.append('video', videoFile, `question_${questionNumber}.webm`);

            console.log('FormData 생성 완료');

            const response = await fetch(`${API_BASE_URL}/${interviewId}/upload?questionNumber=${questionNumber}`, {
                method: 'POST',
                headers: {
                    // Content-Type을 설정하지 않음 - 브라우저가 자동으로 multipart boundary 설정
                    ...getAuthHeaders()
                },
                body: formData
            });

            console.log('업로드 응답 상태:', response.status);

            // 응답 텍스트 먼저 확인
            const responseText = await response.text();
            console.log('업로드 응답 텍스트:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON 파싱 오류:', jsonError);
                throw new Error(`서버 응답을 파싱할 수 없습니다: ${responseText}`);
            }

            if (!response.ok) {
                console.error('업로드 실패 응답:', result);
                throw new Error(result.message || `업로드 실패 (HTTP ${response.status})`);
            }

            console.log('업로드 성공:', result);
            return result;
        } catch (error) {
            console.error('비디오 업로드 오류:', error);
            throw error;
        }
    },

    // 면접 완료 - 새로운 백엔드 API 사용
    completeInterview: async (interviewId) => {
        try {
            console.log('면접 완료 요청:', { interviewId });

            const response = await fetch(`${API_BASE_URL}/${interviewId}/complete`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            console.log('면접 완료 응답 상태:', response.status);
            const result = await response.json();
            console.log('면접 완료 응답 데이터:', result);

            if (!response.ok) {
                throw new Error(result.message || '면접 완료 처리에 실패했습니다.');
            }

            return result;
        } catch (error) {
            console.error('면접 완료 오류:', error);
            throw error;
        }
    }
};