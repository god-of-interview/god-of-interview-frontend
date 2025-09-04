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
            const response = await fetch(`${API_BASE_URL}/start?jobId=${jobId}`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '면접 시작에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 영상 업로드 - 새로운 백엔드 API 사용
    uploadVideo: async (interviewId, questionNumber, videoFile) => {
        try {
            const formData = new FormData();

            // 파일명 생성
            const timestamp = Date.now();
            const fileName = `interview_${interviewId}_question_${questionNumber}_${timestamp}.webm`;

            formData.append('video', videoFile, fileName);

            const response = await fetch(`${API_BASE_URL}/${interviewId}/upload?questionNumber=${questionNumber}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '영상 업로드에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 면접 완료 - 새로운 백엔드 API 사용
    completeInterview: async (interviewId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${interviewId}/complete`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '면접 완료 처리에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }
};