export const validation = {
    email: (email) => {
        if (!email) return '이메일을 입력해주세요.';
        if (!/\S+@\S+\.\S+/.test(email)) return '올바른 이메일 형식이 아닙니다.';
        return null;
    },

    password: (password) => {
        if (!password) return '비밀번호를 입력해주세요.';
        // 정규식 수정 - 백슬래시 이스케이프 문제 해결
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",<.>/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return '비밀번호는 최소 8글자 이상, 대소문자 포함 영문 + 숫자 + 특수문자를 최소 1글자씩 포함해야합니다.';
        }
        return null;
    },

    confirmPassword: (password, confirmPassword) => {
        if (!confirmPassword) return '비밀번호 확인을 입력해주세요.';
        if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.';
        return null;
    },

    nickname: (nickname) => {
        if (!nickname) return '닉네임을 입력해주세요.';
        if (nickname.length < 2) return '닉네임은 2글자 이상이어야 합니다.';
        return null;
    },

    required: (value, fieldName) => {
        if (!value) return `${fieldName}을(를) 입력해주세요.`;
        return null;
    }
};