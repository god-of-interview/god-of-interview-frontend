const API_BASE_URL = '43.200.102.117:8080/api/users';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const userService = {
    // 내 프로필 조회
    getMyProfile: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '프로필 조회에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 다른 사용자 프로필 조회
    getUserProfile: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${userId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '프로필 조회에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 사용자 검색
    searchUsers: async (keyword = '', page = 0, size = 10) => {
        try {
            const params = new URLSearchParams({
                keyword,
                page: page.toString(),
                size: size.toString()
            });

            const response = await fetch(`${API_BASE_URL}?${params}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '사용자 검색에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 프로필 수정
    updateProfile: async (profileData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '프로필 수정에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    // 회원 탈퇴
    deleteAccount: async (password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/me`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '회원 탈퇴에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }
};