import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Check } from 'lucide-react';

const CONDITION_OPTIONS = [
  { id: 'bipolar', label: 'Bipolar Disorder', color: 'bg-blue-100 border-blue-300', darkColor: 'bg-blue-900/40 border-blue-700' },
  { id: 'adhd', label: 'ADHD', color: 'bg-green-100 border-green-300', darkColor: 'bg-green-900/40 border-green-700' },
  { id: 'depression', label: 'Depression', color: 'bg-purple-100 border-purple-300', darkColor: 'bg-purple-900/40 border-purple-700' },
  { id: 'ocd', label: 'OCD', color: 'bg-orange-100 border-orange-300', darkColor: 'bg-orange-900/40 border-orange-700' },
];

const Register = () => {
  const [step, setStep] = useState(1); // 1: Basic info, 2: Condition selection
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [conditions, setConditions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme === 'dark' || (!savedTheme && systemDark));
  }, []);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setStep(2);
  };

  const toggleCondition = (conditionId) => {
    setConditions(prev => 
      prev.includes(conditionId)
        ? prev.filter(c => c !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password, conditions);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8" data-testid="register-header">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {step === 1 ? 'Create Account' : 'Personalize Your Experience'}
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            {step === 1 
              ? 'Begin your journey to better mental health' 
              : 'Select conditions you want to focus on (optional)'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-purple-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-purple-500' : isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {/* Form Container */}
        <div className={`rounded-2xl shadow-xl p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="register-form">
          {error && (
            <div className={`px-4 py-3 rounded-lg mb-6 ${isDark ? 'bg-red-900/30 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`} data-testid="register-error">
              {error}
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Basic Information */
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  placeholder="Your name"
                  data-testid="name-input"
                />
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  placeholder="you@example.com"
                  data-testid="email-input"
                />
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  placeholder="At least 6 characters"
                  data-testid="password-input"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  placeholder="Confirm password"
                  data-testid="confirm-password-input"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition mt-6"
                data-testid="step1-continue-button"
              >
                Continue
              </button>
            </form>
          ) : (
            /* Step 2: Condition Selection */
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="space-y-3">
                {CONDITION_OPTIONS.map((condition) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => toggleCondition(condition.id)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition flex items-center justify-between ${
                      conditions.includes(condition.id)
                        ? (isDark ? condition.darkColor : condition.color) + ' border-opacity-100'
                        : isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`condition-${condition.id}`}
                  >
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{condition.label}</span>
                    {conditions.includes(condition.id) && (
                      <div className={`rounded-full p-1 ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                        <Check className="h-5 w-5 text-purple-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <p className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                You can skip this step or change your selections later in settings.
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex-1 border-2 py-3 rounded-lg font-semibold transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  data-testid="back-button"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
                  data-testid="register-submit-button"
                >
                  {loading ? 'Creating Account...' : 'Get Started'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Already have an account?{' '}
              <Link to="/login" className="text-purple-500 hover:text-purple-400 font-semibold" data-testid="login-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;