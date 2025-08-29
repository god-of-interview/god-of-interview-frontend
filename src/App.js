import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import UserSearchPage from './pages/UserSearchPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import GuidePage from './pages/GuidePage';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigation = (page) => {
    setCurrentPage(page);
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
      case 'dashboard':
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">대시보드</h1>
                <p className="text-gray-600 mb-8">곧 멋진 대시보드가 완성될 예정입니다!</p>
                <div className="flex gap-4 justify-center">
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