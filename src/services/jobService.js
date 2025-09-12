const API_BASE_URL = '43.200.102.117:8080/api/jobs';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const jobService = {
    // 모든 직업 카테고리 조회
    getAllCategories: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '카테고리 조회에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 카테고리별 직업 목록 조회
    getJobsByCategory: async (jobCategory) => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${jobCategory}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '직업 목록 조회에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }
};