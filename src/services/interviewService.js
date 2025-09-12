// src/services/interviewService.js - 백엔드 코드에 정확히 맞춘 버전

const API_BASE_URL = '43.200.102.117:8080/api/interviews';

const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const interviewService = {
    // 면접 시작
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

    // 영상 업로드 - 백엔드 매개변수명 'video'에 맞춤
    uploadVideo: async (interviewId, questionNumber, videoFile) => {
        try {
            console.log('=== 비디오 업로드 디버깅 ===');
            console.log('면접 ID:', interviewId);
            console.log('질문 번호:', questionNumber);
            console.log('파일 크기:', videoFile.size, 'bytes');
            console.log('파일 타입:', videoFile.type);
            console.log('파일명:', videoFile.name);

            // FormData 생성 - 백엔드 매개변수명과 정확히 일치시킴
            const formData = new FormData();
            formData.append('video', videoFile); // 백엔드 @RequestPart MultipartFile video와 일치

            console.log('FormData 생성 완료');

            // 요청 URL 확인
            const uploadUrl = `${API_BASE_URL}/${interviewId}/upload?questionNumber=${questionNumber}`;
            console.log('업로드 URL:', uploadUrl);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    // Content-Type을 명시적으로 설정하지 않음 - 브라우저가 자동으로 boundary 설정
                    ...getAuthHeaders()
                    // 'Content-Type': 'multipart/form-data' <- 이것을 설정하면 boundary가 없어서 오류 발생
                },
                body: formData
            });

            console.log('업로드 응답 상태:', response.status);
            console.log('응답 헤더:', response.headers);

            if (!response.ok) {
                // 에러 응답 상세 분석
                const errorText = await response.text();
                console.error('업로드 실패 응답 텍스트:', errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('업로드 실패 응답 JSON:', errorJson);
                    throw new Error(errorJson.message || `업로드 실패 (HTTP ${response.status})`);
                } catch (parseError) {
                    console.error('에러 응답 JSON 파싱 실패:', parseError);
                    throw new Error(`업로드 실패 (HTTP ${response.status}): ${errorText}`);
                }
            }

            const result = await response.json();
            console.log('업로드 성공 응답:', result);
            return result;

        } catch (error) {
            console.error('비디오 업로드 오류:', error);

            // 네트워크 오류인지 확인
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('네트워크 연결 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
            }

            throw error;
        }
    },

    // 면접 완료
    completeInterview: async (interviewId) => {
        try {
            console.log('면접 완료 요청:', { interviewId });

            // 백엔드 URL 패턴에 맞춤 - /{interviewId}/complete
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