import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import UserSearchPage from './pages/UserSearchPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import GuidePage from './pages/GuidePage';
import JobSelectionPage from './pages/JobSelectionPage'; // 직업 선택 페이지 추가
import InterviewQuestionPage from './pages/InterviewQuestionPage'; // 면접 질문 페이지 추가

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null); // 선택된 직업 저장

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleJobSelection = (job) => {
    setSelectedJob(job);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigation} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigation} />;
      case 'signup':
        return <SignupPage onNavigate={handleNavigation} />;
      case 'guide':
        return <GuidePage onNavigate={handleNavigation} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigation} />;
      case 'edit-profile':
        return <EditProfilePage onNavigate={handleNavigation} />;
      case 'user-search':
        return <UserSearchPage onNavigate={handleNavigation} />;
      case 'delete-account':
        return <DeleteAccountPage onNavigate={handleNavigation} />;
      case 'job-selection':
        return (
            <JobSelectionPage
                onNavigate={handleNavigation}
                onJobSelect={handleJobSelection}
            />
        );
      case 'interview':
        return (
            <InterviewQuestionPage
                onNavigate={handleNavigation}
                selectedJob={selectedJob}
            />
        );
      case 'dashboard':
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">대시보드</h1>
                <p className="text-gray-600 mb-8">곧 멋진 대시보드가 완성될 예정입니다!</p>
                <div className="flex gap-4 justify-center">
                  <button
                      onClick={() => handleNavigation('job-selection')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                  >
                    면접 연습 시작하기
                  </button>
                  <button
                      onClick={() => handleNavigation('profile')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                  >
                    내 프로필
                  </button>
                  <button
                      onClick={() => handleNavigation('user-search')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
                  >
                    사용자 검색
                  </button>
                  <button
                      onClick={() => handleNavigation('home')}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
                  >
                    홈으로 돌아가기
                  </button>
                </div>
              </div>
            </div>
        );
      default:
        return <HomePage onNavigate={handleNavigation} />;
    }
  };

  return <div>{renderCurrentPage()}</div>;
};

export default App;