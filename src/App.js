import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

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
      case 'dashboard':
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">환영합니다!</h1>
                <p className="text-gray-600 mb-8">로그인이 완료되었습니다.</p>
                <button
                    onClick={() => handleNavigation('home')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  홈으로 돌아가기
                </button>
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