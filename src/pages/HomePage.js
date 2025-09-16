import React, { useState, useEffect, useRef } from 'react';
import { Camera, Users, BarChart3, Sparkles, ArrowRight, Star, Menu, X, User, MessageCircle, LogOut, ChevronDown, Edit, Trash2 } from 'lucide-react';

const HomePage = ({ onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 로그인 상태 확인 및 사용자 정보 가져오기
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLoggedIn(true);
            fetchUserProfile(token);
        } else {
            setIsLoggedIn(false);
            setUserInfo(null);
        }
    }, []);

    const fetchUserProfile = async (token) => {
        try {
            const response = await fetch('https://api.god-of-interview.site/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setUserInfo({
                    name: result.data.nickname,
                    nickname: result.data.nickname,
                    id: result.data.id
                });
            } else {
                // 토큰이 유효하지 않은 경우 로그아웃 처리
                localStorage.removeItem('accessToken');
                setIsLoggedIn(false);
                setUserInfo(null);
            }
        } catch (error) {
            console.error('사용자 정보를 가져오는데 실패했습니다:', error);
            // 네트워크 오류 등의 경우 기본값 설정
            setUserInfo({ name: '사용자', nickname: '사용자' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
        setUserInfo(null);
        setIsProfileDropdownOpen(false);
        // 페이지 새로고침으로 상태 초기화
        window.location.reload();
    };

    const features = [
        {
            icon: Camera,
            title: "실시간 영상 분석",
            description: "AI가 당신의 시선, 표정, 자세를 실시간으로 분석하여 개선점을 제안합니다.",
            color: "bg-blue-100 text-blue-600"
        },
        {
            icon: MessageCircle,
            title: "습관어 분석",
            description: "음성 인식을 통해 '음', '어' 같은 습관어 사용 빈도를 분석하고 개선 방법을 알려드립니다.",
            color: "bg-green-100 text-green-600"
        },
        {
            icon: BarChart3,
            title: "상세한 피드백",
            description: "면접 후 종합적인 분석 결과와 개인 맞춤형 개선 방안을 제공합니다.",
            color: "bg-purple-100 text-purple-600"
        },
        {
            icon: Users,
            title: "직업별 맞춤 질문",
            description: "백엔드 개발자, 프론트엔드 개발자, 디자이너 등 다양한 직업의 실제 면접 질문으로 연습할 수 있습니다.",
            color: "bg-orange-100 text-orange-600"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "면접 가이드 확인",
            description: "면접 전 준비사항과 팁을 확인하고 환경을 점검합니다."
        },
        {
            number: "02",
            title: "직업 선택",
            description: "다양한 분야의 직업 중에서 면접을 연습할 직업을 바로 선택합니다."
        },
        {
            number: "03",
            title: "모의면접 진행",
            description: "5개의 맞춤형 질문에 영상으로 답변하며 면접을 진행합니다."
        },
        {
            number: "04",
            title: "AI 분석 결과",
            description: "시선, 표정, 습관어 등을 종합 분석한 개인별 피드백을 받습니다."
        }
    ];

    const testimonials = [
        {
            name: "김민수",
            role: "백엔드 개발자 합격",
            content: "AI 분석 덕분에 면접에서 시선 처리와 습관어를 많이 개선할 수 있었어요. 정말 실질적인 도움이 되었습니다!",
            rating: 5
        },
        {
            name: "박지은",
            role: "프론트엔드 개발자 합격",
            content: "혼자 연습하기 어려웠던 부분들을 객관적으로 분석해주니까 정말 좋더라구요. 면접 통과율이 확실히 올라갔어요.",
            rating: 5
        },
        {
            name: "이준호",
            role: "프로덕트 매니저 합격",
            content: "직업별 맞춤 질문이 실제 면접과 거의 비슷해서 놀랐습니다. 덕분에 자신감 있게 면접을 볼 수 있었어요!",
            rating: 5
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                면접의 神
                            </span>
                        </div>

                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    서비스 소개
                                </a>
                                <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    이용 방법
                                </a>
                                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                    후기
                                </a>

                                {/* 로그인 상태에 따른 버튼 변경 */}
                                {isLoggedIn ? (
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => onNavigate('user-search')}
                                            className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                                        >
                                            사용자 검색
                                        </button>

                                        {/* 프로필 드롭다운 */}
                                        <div className="relative" ref={dropdownRef}>
                                            <button
                                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-white" />
                                                </div>
                                                <span>{userInfo?.nickname || '사용자'}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${
                                                    isProfileDropdownOpen ? 'rotate-180' : ''
                                                }`} />
                                            </button>

                                            {/* 드롭다운 메뉴 */}
                                            {isProfileDropdownOpen && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                    <button
                                                        onClick={() => {
                                                            onNavigate('profile');
                                                            setIsProfileDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <User className="w-4 h-4" />
                                                        마이페이지
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            onNavigate('edit-profile');
                                                            setIsProfileDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        내 정보 수정
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            onNavigate('interview-records');
                                                            setIsProfileDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <BarChart3 className="w-4 h-4" />
                                                        내 면접 기록
                                                    </button>

                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    <button
                                                        onClick={() => {
                                                            onNavigate('delete-account');
                                                            setIsProfileDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        회원 탈퇴
                                                    </button>

                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        로그아웃
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onNavigate('login')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        로그인
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 모바일 메뉴 버튼 */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-700 hover:text-blue-600"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 모바일 메뉴 */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
                            <a href="#features" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
                                서비스 소개
                            </a>
                            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
                                이용 방법
                            </a>
                            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium">
                                후기
                            </a>

                            {/* 모바일 메뉴 로그인 상태 처리 */}
                            {isLoggedIn ? (
                                <div className="border-t pt-3 mt-3">
                                    <div className="px-3 py-2 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{userInfo?.nickname || '사용자'}</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onNavigate('user-search');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 block text-base font-medium"
                                    >
                                        사용자 검색
                                    </button>

                                    <button
                                        onClick={() => {
                                            onNavigate('profile');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 block text-base font-medium"
                                    >
                                        마이페이지
                                    </button>

                                    <button
                                        onClick={() => {
                                            onNavigate('edit-profile');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 block text-base font-medium"
                                    >
                                        내 정보 수정
                                    </button>

                                    <button
                                        onClick={() => {
                                            onNavigate('interview-records');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 block text-base font-medium"
                                    >
                                        내 면접 기록
                                    </button>

                                    <button
                                        onClick={() => {
                                            onNavigate('delete-account');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-red-600 hover:text-red-700 block text-base font-medium"
                                    >
                                        회원 탈퇴
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:text-red-600 block text-base font-medium flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onNavigate('login')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-base font-medium mt-4"
                                >
                                    로그인
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section - 로그인 상태에 따른 버튼 변경 */}
            <section className="pt-16 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
                        <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl lg:text-6xl">
                                <span className="block">AI가 도와주는</span>
                                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    스마트 면접 연습
                                </span>
                            </h1>
                            <p className="mt-6 text-xl text-gray-600 sm:max-w-xl sm:mx-auto lg:mx-0">
                                실시간 영상 분석과 AI 피드백으로 면접 실력을 향상시키세요.
                                시선, 표정, 습관어까지 모든 것을 분석해드립니다.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                                {isLoggedIn ? (
                                    <>
                                        <button
                                            onClick={() => onNavigate('guide')} // 면접 가이드로 이동 (향후 구현)
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                        >
                                            면접 연습 시작하기
                                        </button>
                                        <button
                                            onClick={() => onNavigate('dashboard')}
                                            className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2"
                                        >
                                            <User className="w-5 h-5" />
                                            내 대시보드
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onNavigate('signup')}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                        >
                                            회원가입
                                        </button>
                                        <button
                                            onClick={() => onNavigate('login')}
                                            className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2"
                                        >
                                            <User className="w-5 h-5" />
                                            로그인
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                            <div className="relative mx-auto w-full rounded-2xl shadow-2xl lg:max-w-md">
                                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                                    <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                                        <div className="flex items-center mb-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="h-3 bg-white/40 rounded w-20 mb-2"></div>
                                                <div className="h-2 bg-white/30 rounded w-16"></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">시선 접촉</span>
                                                <span className="text-sm font-bold">85%</span>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-2">
                                                <div className="bg-white h-2 rounded-full w-4/5"></div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">표정 자연스러움</span>
                                                <span className="text-sm font-bold">92%</span>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-2">
                                                <div className="bg-white h-2 rounded-full w-11/12"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            왜 면접의 神을 선택해야 할까요?
                        </h2>
                        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                            최신 AI 기술로 면접의 모든 요소를 분석하고 개인 맞춤형 피드백을 제공합니다.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
                                <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-6`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            4단계로 완성하는 완벽한 면접
                        </h2>
                        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                            간단한 4단계로 전문적인 면접 연습을 경험해보세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {step.description}
                                </p>
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block">
                                        <ArrowRight className="w-6 h-6 text-gray-400 mx-auto mt-8" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            실제 사용자들의 생생한 후기
                        </h2>
                        <p className="mt-4 text-xl text-gray-600">
                            면접의 神으로 꿈의 회사에 합격한 사용자들의 이야기를 들어보세요.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm">
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                                    "{testimonial.content}"
                                </blockquote>
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-2">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section - 로그인 상태에 따른 버튼 변경 */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                        지금 바로 AI 면접 연습을 시작해보세요
                    </h2>
                    <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
                        {isLoggedIn
                            ? "준비된 맞춤형 질문으로 면접 실력을 더욱 향상시켜보세요."
                            : "무료로 시작하여 면접 실력을 향상시키고 꿈의 직장에 한 걸음 더 가까워지세요."
                        }
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick={() => onNavigate('guide')}
                                    className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    면접 연습 시작하기
                                </button>
                                <button
                                    onClick={() => onNavigate('dashboard')}
                                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300"
                                >
                                    내 대시보드 보기
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => onNavigate('signup')}
                                    className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    회원가입
                                </button>
                                <button
                                    onClick={() => onNavigate('login')}
                                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300"
                                >
                                    로그인
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <span className="ml-3 text-2xl font-bold">면접의 神</span>
                        </div>
                        <p className="text-gray-400 mb-8">
                            AI 기술로 더 나은 면접을 경험하세요
                        </p>
                        <div className="border-t border-gray-800 pt-8">
                            <p className="text-gray-500 text-sm">
                                © 2024 면접의 神. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;