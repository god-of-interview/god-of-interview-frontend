const API_BASE_URL = 'http://localhost:8080/api/auth';

export const authService = {
    login: async (loginData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '로그인에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    signup: async (signupData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '회원가입에 실패했습니다.');
            }

            return result;
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
    },

    getToken: () => {
        return localStorage.getItem('accessToken');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken');
    }
};