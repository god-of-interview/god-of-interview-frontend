const API_BASE_URL = 'http://43.200.102.117:8080/api/questions';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const questionService = {
    // 랜덤 질문 조회
    getRandomQuestions: async (jobId, count = 5) => {
        try {
            const params = new URLSearchParams({
                jobId: jobId.toString(),
                count: count.toString()
            });

            const response = await fetch(`${API_BASE_URL}/random?${params}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '질문 조회에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }
};