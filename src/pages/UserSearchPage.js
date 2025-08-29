import React, { useState, useEffect } from 'react';
import { Search, User, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { userService } from '../services/userService';

const UserSearchPage = ({ onNavigate }) => {
    const [keyword, setKeyword] = useState('');
    const [users, setUsers] = useState([]);
    const [pageInfo, setPageInfo] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        // 컴포넌트 마운트 시 전체 사용자 조회
        searchUsers();
    }, [currentPage]);

    const searchUsers = async (searchKeyword = keyword) => {
        try {
            setIsLoading(true);
            const result = await userService.searchUsers(searchKeyword, currentPage, 10);
            setUsers(result.data.data);
            setPageInfo(result.data);
            setHasSearched(true);
        } catch (error) {
            console.error('사용자 검색 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(0);
        searchUsers();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => onNavigate('home')}
                            className="flex items-center text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            홈으로
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">사용자 검색</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 검색 바 */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="닉네임으로 사용자를 검색하세요..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {isLoading ? '검색 중...' : '검색'}
                        </button>
                    </div>
                </div>

                {/* 검색 결과 */}
                {hasSearched && (
                    <div className="bg-white rounded-2xl shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                검색 결과 ({pageInfo.totalElements || 0}명)
                            </h2>
                        </div>

                        {users.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center">
                                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
                                                <User className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {user.nickname}
                                                    </h3>
                                                    <span className="text-sm text-gray-500">
                                                        #{user.id}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center text-sm text-gray-600">
                                                    <span>{user.gender}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{user.birth}</span>
                                                </div>
                                                {user.bio && (
                                                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                                                        {user.bio}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    검색 결과가 없습니다
                                </h3>
                                <p className="text-gray-600">
                                    다른 키워드로 다시 검색해보세요.
                                </p>
                            </div>
                        )}

                        {/* 페이지네이션 */}
                        {pageInfo.totalPages > 1 && (
                            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    {pageInfo.totalElements}개 중 {(pageInfo.pageNumber * pageInfo.pageSize) + 1}-
                                    {Math.min((pageInfo.pageNumber + 1) * pageInfo.pageSize, pageInfo.totalElements)}개 표시
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                                            const pageNum = i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-8 h-8 text-sm rounded ${
                                                        pageNum === currentPage
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {pageNum + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= pageInfo.totalPages - 1}
                                        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSearchPage;