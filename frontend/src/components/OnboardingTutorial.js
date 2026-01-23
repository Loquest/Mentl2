import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Heart, TrendingUp, MessageCircle, Users, Sparkles } from 'lucide-react';

const TUTORIAL_SLIDES = [
  {
    id: 1,
    title: 'Track Your Mood & Symptoms',
    description: 'Log how you\'re feeling daily with our intuitive mood tracker. Track energy levels, sleep, symptoms, and add personal notes.',
    icon: Heart,
    gradient: 'from-pink-500 to-rose-500',
    bgGradient: 'from-pink-50 to-rose-50',
    darkBgGradient: 'from-pink-950/30 to-rose-950/30',
    features: ['Daily mood ratings (1-10)', 'Symptom tracking', 'Medication reminders', 'Personal notes']
  },
  {
    id: 2,
    title: '24/7 AI Support',
    description: 'Chat with our AI assistant anytime. Get personalized coping strategies, evidence-based techniques, and crisis support when you need it.',
    icon: MessageCircle,
    gradient: 'from-purple-500 to-indigo-500',
    bgGradient: 'from-purple-50 to-indigo-50',
    darkBgGradient: 'from-purple-950/30 to-indigo-950/30',
    features: ['Always available', 'Crisis detection & resources', 'CBT techniques', 'Personalized advice']
  },
  {
    id: 3,
    title: 'Insights & Analytics',
    description: 'Discover patterns in your mental health journey. Our AI identifies triggers, correlations, and trends to help you understand yourself better.',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    darkBgGradient: 'from-emerald-950/30 to-teal-950/30',
    features: ['Mood trend analysis', 'Pattern recognition', 'Sleep-mood correlations', 'Export your data']
  },
  {
    id: 4,
    title: 'Caregiver Network & More',
    description: 'Connect with trusted caregivers who can support your journey. Plus get personalized activity and nutrition suggestions based on your mood.',
    icon: Users,
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50',
    darkBgGradient: 'from-amber-950/30 to-orange-950/30',
    features: ['Invite caregivers', 'Permission-based sharing', 'Activity suggestions', 'Mood-based nutrition']
  }
];

const OnboardingTutorial = ({ onComplete, isDark = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('next');

  const handleNext = () => {
    if (isAnimating) return;
    if (currentSlide === TUTORIAL_SLIDES.length - 1) {
      handleComplete();
      return;
    }
    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isAnimating || currentSlide === 0) return;
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(prev => prev - 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleComplete = () => {
    localStorage.setItem('mentl_tutorial_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 300);
  };

  const slide = TUTORIAL_SLIDES[currentSlide];
  const Icon = slide.icon;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'ArrowRight') {
        if (currentSlide === TUTORIAL_SLIDES.length - 1) {
          localStorage.setItem('mentl_tutorial_completed', 'true');
          onComplete();
        } else if (!isAnimating) {
          setDirection('next');
          setIsAnimating(true);
          setTimeout(() => {
            setCurrentSlide(prev => prev + 1);
            setIsAnimating(false);
          }, 300);
        }
      }
      if (e.key === 'ArrowLeft' && currentSlide > 0 && !isAnimating) {
        setDirection('prev');
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentSlide(prev => prev - 1);
          setIsAnimating(false);
        }, 300);
      }
      if (e.key === 'Escape') {
        localStorage.setItem('mentl_tutorial_completed', 'true');
        onComplete();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentSlide, isAnimating, onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm`}
      data-testid="onboarding-tutorial"
    >
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all hover:scale-110 ${
          isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        data-testid="tutorial-skip-btn"
        aria-label="Skip tutorial"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main content container */}
      <div className="w-full max-w-4xl">
        {/* Slide content */}
        <div 
          className={`relative overflow-hidden rounded-3xl shadow-2xl ${
            isDark ? slide.darkBgGradient : slide.bgGradient
          } bg-gradient-to-br transition-all duration-500`}
        >
          <div 
            className={`p-8 md:p-12 transition-all duration-300 ${
              isAnimating 
                ? direction === 'next' 
                  ? 'opacity-0 translate-x-8' 
                  : 'opacity-0 -translate-x-8'
                : 'opacity-100 translate-x-0'
            }`}
          >
            {/* Icon and title */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {slide.title}
              </h2>
              <p className={`text-base md:text-lg max-w-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {slide.description}
              </p>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {slide.features.map((feature, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-white/70'
                  } backdrop-blur-sm`}
                >
                  <Sparkles className={`w-4 h-4 flex-shrink-0 bg-gradient-to-br ${slide.gradient} text-transparent bg-clip-text`} 
                    style={{ color: slide.gradient.includes('pink') ? '#ec4899' : 
                             slide.gradient.includes('purple') ? '#8b5cf6' :
                             slide.gradient.includes('emerald') ? '#10b981' : '#f59e0b' }}
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 px-4">
          {/* Previous button */}
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              currentSlide === 0
                ? 'opacity-0 pointer-events-none'
                : isDark 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid="tutorial-prev-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {/* Dots indicator */}
          <div className="flex items-center gap-2">
            {TUTORIAL_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? `w-8 h-2 bg-gradient-to-r ${TUTORIAL_SLIDES[currentSlide].gradient}`
                    : `w-2 h-2 ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`
                }`}
                aria-label={`Go to slide ${index + 1}`}
                data-testid={`tutorial-dot-${index}`}
              />
            ))}
          </div>

          {/* Next/Get Started button */}
          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r ${slide.gradient} shadow-lg hover:shadow-xl transition-all hover:scale-105`}
            data-testid="tutorial-next-btn"
          >
            {currentSlide === TUTORIAL_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard hint */}
        <p className={`text-center mt-6 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Use arrow keys to navigate • Press Esc to skip
        </p>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
