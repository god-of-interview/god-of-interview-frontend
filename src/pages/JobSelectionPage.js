import React, { useState, useEffect } from 'react';
import { Briefcase, ChevronRight, ArrowLeft, Users, Building2, Code, TrendingUp, Heart, Gavel, Filter, AlertCircle, GraduationCap, Palette, Wrench, Zap, Factory, TreePine, ShoppingCart } from 'lucide-react';
import { jobService } from '../services/jobService';

const JobSelectionPage = ({ onNavigate, onJobSelect }) => {
    const [categories, setCategories] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isJobsLoading, setIsJobsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: 카테고리 선택, 2: 직업 선택

    // JobCategory enum에 맞는 아이콘 매핑
    const categoryIcons = {
        'MANAGEMENT_ACCOUNTING_OFFICE': { icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
        'FINANCE_INSURANCE': { icon: TrendingUp, color: 'bg-green-100 text-green-600' },
        'EDUCATION': { icon: GraduationCap, color: 'bg-purple-100 text-purple-600' },
        'MEDICAL_PHARMACEUTICAL_WELFARE': { icon: Heart, color: 'bg-red-100 text-red-600' },
        'CULTURE_ART_DESIGN': { icon: Palette, color: 'bg-pink-100 text-pink-600' },
        'SERVICE': { icon: Users, color: 'bg-yellow-100 text-yellow-600' },
        'CONSTRUCTION': { icon: Building2, color: 'bg-orange-100 text-orange-600' },
        'MACHINERY_NEW_MATERIALS': { icon: Wrench, color: 'bg-gray-100 text-gray-600' },
        'TEXTILE_CLOTHING': { icon: Users, color: 'bg-indigo-100 text-indigo-600' },
        'ELECTRICAL_ELECTRONICS': { icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
        'IT_DATA': { icon: Code, color: 'bg-blue-100 text-blue-600' },
        'FOOD': { icon: Users, color: 'bg-green-100 text-green-600' },
        'CHEMICAL_ENERGY_ENVIRONMENT': { icon: Factory, color: 'bg-emerald-100 text-emerald-600' },
        'WOOD_FURNITURE_PAPER': { icon: TreePine, color: 'bg-amber-100 text-amber-600' },
        'SALES_MARKETING_DISTRIBUTION_TRADE': { icon: ShoppingCart, color: 'bg-cyan-100 text-cyan-600' },
        'POLITICS': { icon: Gavel, color: 'bg-slate-100 text-slate-600' }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // 카테고리 목록 조회
    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const result = await jobService.getAllCategories();
            setCategories(result.data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 카테고리별 직업 목록 조회
    const fetchJobsByCategory = async (jobCategory) => {
        try {
            setIsJobsLoading(true);
            const result = await jobService.getJobsByCategory(jobCategory);
            setJobs(result.data);
        } catch (error) {
            console.error('직업 목록 조회 중 오류:', error);
            setJobs([]);
        } finally {
            setIsJobsLoading(false);
        }
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setStep(2);
        fetchJobsByCategory(category.jobCategory);
    };

    const handleJobSelect = (job) => {
        // 선택한 직업을 부모 컴포넌트로 전달
        onJobSelect && onJobSelect(job);
        // 면접 페이지로 이동
        onNavigate('interview');
    };

    const handleBackToCategories = () => {
        setStep(1);
        setSelectedCategory(null);
        setJobs([]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">직업 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            다시 시도
                        </button>
                        <button
                            onClick={() => onNavigate('home')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                        >
                            홈으로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={step === 1 ? () => onNavigate('guide') : handleBackToCategories}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {step === 1 ? '직업 분야 선택' : '직업 선택'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {step === 1
                                    ? '면접을 연습할 직업 분야를 선택해주세요'
                                    : `${selectedCategory?.displayName} 분야의 직업을 선택해주세요`
                                }
                            </p>
                        </div>
                    </div>

                    {/* 단계 표시기 */}
                    <div className="mb-6">
                        <div className="flex items-center justify-center space-x-4">
                            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                    1
                                </div>
                                <span className="ml-2 font-medium">직업 분야 선택</span>
                            </div>
                            <ChevronRight className="text-gray-400" />
                            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                                    2
                                </div>
                                <span className="ml-2 font-medium">세부 직업 선택</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Step 1: 카테고리 선택 */}
                {step === 1 && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">직업 분야를 선택하세요</h2>
                            <span className="text-sm text-gray-500">총 {categories.length}개 분야</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {categories.map((category) => {
                                const iconInfo = categoryIcons[category.jobCategory] || { icon: Briefcase, color: 'bg-gray-100 text-gray-600' };
                                const IconComponent = iconInfo.icon;

                                return (
                                    <button
                                        key={category.jobCategory}
                                        onClick={() => handleCategorySelect(category)}
                                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left group hover:scale-105"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${iconInfo.color}`}>
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                                            {category.displayName}
                                        </h3>
                                        <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                            <span className="text-sm">선택하기</span>
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: 직업 선택 */}
                {step === 2 && selectedCategory && (
                    <div>
                        {isJobsLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">직업 목록을 불러오는 중...</p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <Filter className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    등록된 직업이 없습니다
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    이 분야의 직업이 곧 추가될 예정입니다
                                </p>
                                <button
                                    onClick={handleBackToCategories}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                >
                                    다른 분야 선택하기
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">직업 목록</h2>
                                    <span className="text-sm text-gray-500">
                                        {jobs.length}개의 직업
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobs.map((job) => {
                                        const iconInfo = categoryIcons[job.jobCategory] || { icon: Briefcase, color: 'bg-gray-100 text-gray-600' };
                                        const IconComponent = iconInfo.icon;

                                        return (
                                            <button
                                                key={job.id}
                                                onClick={() => handleJobSelect(job)}
                                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 p-6 group text-left"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-lg p-2 ${iconInfo.color}`}>
                                                            <IconComponent className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {job.name}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>

                                                <div className="flex items-center text-sm text-blue-600 font-medium">
                                                    면접 연습 시작하기
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobSelectionPage;