import React, { useState } from 'react';
import {
    ArrowLeft,
    CheckCircle,
    Camera,
    Mic,
    Monitor,
    Lightbulb,
    Eye,
    Clock,
    Volume2,
    ArrowRight,
    AlertTriangle,
    Wifi,
    Settings
} from 'lucide-react';

const GuidePage = ({ onNavigate }) => {
    const [currentSection, setCurrentSection] = useState('preparation');

    const sections = {
        preparation: {
            title: '면접 환경 준비',
            icon: Settings,
            content: [
                {
                    icon: Camera,
                    title: '카메라 설정',
                    description: '웹캠이 얼굴을 명확히 비출 수 있도록 위치를 조정하세요.',
                    tips: [
                        '카메라는 눈높이에 맞춰 설정',
                        '화면에서 1-2미터 거리 유지',
                        '카메라 렌즈가 깨끗한지 확인'
                    ]
                },
                {
                    icon: Mic,
                    title: '마이크 설정',
                    description: '명확한 음성 녹음을 위해 마이크를 테스트하세요.',
                    tips: [
                        '마이크 권한 허용 확인',
                        '주변 소음 최소화',
                        '마이크 감도 적절히 조정'
                    ]
                },
                {
                    icon: Monitor,
                    title: '화면 환경',
                    description: '적절한 조명과 배경으로 전문적인 인상을 연출하세요.',
                    tips: [
                        '자연광 또는 밝은 조명 활용',
                        '깔끔하고 정돈된 배경',
                        '화면 밝기 적절히 조정'
                    ]
                },
                {
                    icon: Wifi,
                    title: '네트워크 연결',
                    description: '안정적인 인터넷 연결을 확인하세요.',
                    tips: [
                        '와이파이 연결 상태 확인',
                        '다른 프로그램 종료로 대역폭 확보',
                        '유선 연결 권장'
                    ]
                }
            ]
        },
        interview: {
            title: '면접 진행 방법',
            icon: Eye,
            content: [
                {
                    icon: Clock,
                    title: '시간 관리',
                    description: '각 질문당 2-3분 내외로 답변하는 것을 권장합니다.',
                    tips: [
                        '핵심 내용을 간결하게 전달',
                        '구체적인 사례와 함께 설명',
                        '너무 길거나 짧지 않게 조절'
                    ]
                },
                {
                    icon: Eye,
                    title: '시선 처리',
                    description: '카메라를 바라보며 면접관과 눈을 맞추는 느낌으로 답변하세요.',
                    tips: [
                        '카메라 렌즈를 직접 바라보기',
                        '자연스러운 시선 이동',
                        '화면이 아닌 카메라 응시'
                    ]
                },
                {
                    icon: Volume2,
                    title: '음성 및 발음',
                    description: '명확하고 자신감 있는 목소리로 답변하세요.',
                    tips: [
                        '적절한 속도로 또박또박',
                        '습관어 사용 주의',
                        '감정을 담아 표현력 있게'
                    ]
                }
            ]
        },
        tips: {
            title: '면접 성공 팁',
            icon: Lightbulb,
            content: [
                {
                    icon: CheckCircle,
                    title: 'STAR 기법 활용',
                    description: 'Situation, Task, Action, Result 순서로 경험을 구조화하여 설명하세요.',
                    tips: [
                        'S: 상황 설명 (언제, 어디서)',
                        'T: 맡은 역할과 목표',
                        'A: 구체적인 행동과 과정',
                        'R: 결과와 배운점'
                    ]
                },
                {
                    icon: Lightbulb,
                    title: '핵심 키워드',
                    description: '지원 직무와 관련된 키워드를 자연스럽게 포함하세요.',
                    tips: [
                        '직무 관련 전문 용어 사용',
                        '회사 가치와 연결된 표현',
                        '성과를 수치로 구체화'
                    ]
                },
                {
                    icon: AlertTriangle,
                    title: '주의사항',
                    description: '면접에서 피해야 할 행동들을 숙지하세요.',
                    tips: [
                        '부정적인 표현 지양',
                        '과도한 제스처 자제',
                        '준비되지 않은 질문도 당황하지 말기'
                    ]
                }
            ]
        }
    };

    const sectionOrder = ['preparation', 'interview', 'tips'];
    const currentIndex = sectionOrder.indexOf(currentSection);

    const nextSection = () => {
        if (currentIndex < sectionOrder.length - 1) {
            setCurrentSection(sectionOrder[currentIndex + 1]);
        }
    };

    const prevSection = () => {
        if (currentIndex > 0) {
            setCurrentSection(sectionOrder[currentIndex - 1]);
        }
    };

    const currentSectionData = sections[currentSection];
    const SectionIcon = currentSectionData.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onNavigate('home')}
                                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                                    <SectionIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">면접 가이드</h1>
                                    <p className="text-sm text-gray-600">{currentSectionData.title}</p>
                                </div>
                            </div>
                        </div>

                        {/* 진행 상태 */}
                        <div className="hidden sm:flex items-center gap-2">
                            {sectionOrder.map((section, index) => (
                                <div
                                    key={section}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        index <= currentIndex
                                            ? 'bg-blue-600'
                                            : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Section Navigation */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {sectionOrder.map((section) => {
                            const SectionNavIcon = sections[section].icon;
                            return (
                                <button
                                    key={section}
                                    onClick={() => setCurrentSection(section)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        currentSection === section
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    <SectionNavIcon className="w-4 h-4" />
                                    {sections[section].title}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section Content */}
                <div className="space-y-6">
                    {currentSectionData.content.map((item, index) => {
                        const ItemIcon = item.icon;
                        return (
                            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                                        <ItemIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-600 mb-4 leading-relaxed">
                                            {item.description}
                                        </p>
                                        <ul className="space-y-2">
                                            {item.tips.map((tip, tipIndex) => (
                                                <li key={tipIndex} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-700">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
                    <button
                        onClick={prevSection}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        이전
                    </button>

                    <div className="flex items-center gap-4">
                        {currentIndex < sectionOrder.length - 1 ? (
                            <button
                                onClick={nextSection}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                다음
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => onNavigate('job-selection')} // 다음 단계로 이동
                                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                직업 선택하러 가기
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Start Button */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">준비가 완료되었다면 바로 시작할 수도 있습니다</p>
                    <button
                        onClick={() => onNavigate('job-selection')}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                        가이드 건너뛰고 바로 시작
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuidePage;