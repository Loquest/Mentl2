import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Layout from '../components/Layout';
import OnboardingTutorial from '../components/OnboardingTutorial';
import api from '../utils/api';
import { User, Check, AlertCircle, Heart, Activity, Scale, Ruler, Bell, BellOff, HelpCircle, BookOpen } from 'lucide-react';
import { 
  isPushSupported, 
  getNotificationPermission, 
  requestNotificationPermission,
  initializePushNotifications,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  showLocalNotification
} from '../utils/pushNotifications';

const CONDITION_OPTIONS = [
  { id: 'bipolar', label: 'Bipolar Disorder', description: 'Manage mood episodes and track patterns', icon: '🔄' },
  { id: 'adhd', label: 'ADHD', description: 'Focus and organization support', icon: '⚡' },
  { id: 'depression', label: 'Depression', description: 'Mood tracking and coping strategies', icon: '🌧️' },
  { id: 'ocd', label: 'OCD (Obsessive-Compulsive Disorder)', description: 'Manage intrusive thoughts and compulsive behaviors', icon: '🔁' },
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();
  
  // Personal Info
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || '');
  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  
  // Mental Health Conditions
  const [conditions, setConditions] = useState(user?.conditions || []);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'conditions', or 'notifications'
  
  // Notification State
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  const checkPushStatus = useCallback(async () => {
    const supported = isPushSupported();
    setPushSupported(supported);
    
    if (supported) {
      setPushPermission(getNotificationPermission());
      const subscribed = await isSubscribedToPush();
      setPushSubscribed(subscribed);
    }
  }, []);

  useEffect(() => {
    checkPushStatus();
  }, [checkPushStatus]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAge(user.age || '');
      setWeight(user.weight || '');
      setHeight(user.height || '');
      setConditions(user.conditions || []);
    }
  }, [user]);

  const toggleCondition = (conditionId) => {
    setConditions(prev => 
      prev.includes(conditionId)
        ? prev.filter(c => c !== conditionId)
        : [...prev, conditionId]
    );
  };

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const updateData = {
        name,
        conditions,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
      };

      const response = await api.put('/auth/profile', updateData);
      
      updateUser(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  const handleEnablePushNotifications = async () => {
    setNotificationLoading(true);
    setError('');
    
    try {
      // Request permission
      const permission = await requestNotificationPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        const token = localStorage.getItem('token');
        await initializePushNotifications(token);
        await subscribeToPush(token);
        setPushSubscribed(true);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else if (permission === 'denied') {
        setError('Notification permission denied. Please enable notifications in your browser settings.');
      }
    } catch (err) {
      console.error('Push notification error:', err);
      setError('Failed to enable push notifications');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setNotificationLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await unsubscribeFromPush(token);
      setPushSubscribed(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Push notification error:', err);
      setError('Failed to disable push notifications');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showLocalNotification('Test Notification', {
        body: 'Push notifications are working! 🎉',
        tag: 'test-notification'
      });
    } catch (err) {
      setError('Failed to show test notification');
    }
  };

  // Tutorial overlay
  if (showTutorial) {
    return (
      <OnboardingTutorial 
        onComplete={() => setShowTutorial(false)} 
        isDark={isDark} 
      />
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto" data-testid="settings-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile & Settings</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your personal information and preferences</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className={`px-4 py-3 rounded-lg mb-6 animate-fade-in ${isDark ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`} data-testid="success-message">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Profile updated successfully!
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${isDark ? 'bg-red-900/30 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`} data-testid="error-message">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`flex space-x-2 mb-6 border-b overflow-x-auto ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
              activeTab === 'personal'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="personal-info-tab"
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('conditions')}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
              activeTab === 'conditions'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="conditions-tab"
          >
            Mental Health
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
              activeTab === 'notifications'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="notifications-tab"
          >
            <Bell className="h-4 w-4 inline mr-1" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
              activeTab === 'help'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="help-tab"
          >
            <HelpCircle className="h-4 w-4 inline mr-1" />
            Help
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Basic Info Card */}
              <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full mr-4">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Basic Information</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your personal details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                      placeholder="John Doe"
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
                      value={user?.email}
                      disabled
                      className={`w-full px-4 py-3 border rounded-lg cursor-not-allowed ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                      data-testid="email-display"
                    />
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Email cannot be changed</p>
                  </div>

                  <div>
                    <label htmlFor="age" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Age
                    </label>
                    <div className="relative">
                      <input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min="1"
                        max="120"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                        placeholder="25"
                        data-testid="age-input"
                      />
                      <Heart className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Health Card */}
              <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-full mr-4">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Physical Health</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Track your physical wellness</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="weight" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Weight (kg)
                    </label>
                    <div className="relative">
                      <input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        min="0"
                        max="500"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                        placeholder="70.5"
                        data-testid="weight-input"
                      />
                      <Scale className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="height" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Height (cm)
                    </label>
                    <div className="relative">
                      <input
                        id="height"
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        min="0"
                        max="300"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                        placeholder="175"
                        data-testid="height-input"
                      />
                      <Ruler className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </div>

                {/* BMI Display */}
                {bmi && (
                  <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Body Mass Index (BMI)</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Calculated from your weight and height</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-500">{bmi}</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{bmiCategory}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mental Health Conditions Tab */}
          {activeTab === 'conditions' && (
            <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mental Health Conditions</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Select the conditions you want to focus on. This helps personalize your experience and activity suggestions.
              </p>

              <div className="space-y-3" data-testid="conditions-section">
                {CONDITION_OPTIONS.map((condition) => (
                  <button
                    key={condition.id}
                    type="button"
                    onClick={() => toggleCondition(condition.id)}
                    className={`w-full p-5 border-2 rounded-xl text-left transition flex items-start justify-between group hover:shadow-md ${ 
                      conditions.includes(condition.id)
                        ? isDark ? 'border-purple-500 bg-purple-900/20 shadow-sm' : 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm'
                        : isDark ? 'border-gray-700 hover:border-purple-500 bg-gray-800' : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                    data-testid={`condition-${condition.id}`}
                  >
                    <div className="flex items-start flex-1">
                      <span className="text-3xl mr-4">{condition.icon}</span>
                      <div className="flex-1">
                        <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{condition.label}</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{condition.description}</p>
                        {conditions.includes(condition.id) && (
                          <p className="text-xs text-purple-500 font-medium mt-2">
                            ✓ Selected - You&apos;ll receive tailored support for this condition
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`ml-4 rounded-full p-1 flex-shrink-0 transition ${
                      conditions.includes(condition.id)
                        ? 'bg-purple-500'
                        : isDark ? 'bg-gray-700 group-hover:bg-purple-800' : 'bg-gray-200 group-hover:bg-purple-200'
                    }`}>
                      <Check className={`h-6 w-6 ${
                        conditions.includes(condition.id)
                          ? 'text-white'
                          : isDark ? 'text-gray-500 group-hover:text-purple-400' : 'text-gray-400 group-hover:text-purple-500'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>

              {conditions.length === 0 && (
                <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
                    💡 Tip: Selecting at least one condition will help us provide more personalized activity suggestions and support.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-full mr-4">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Push Notifications</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage how you receive alerts and reminders</p>
                </div>
              </div>

              {!pushSupported ? (
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
                        Push notifications not supported
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-yellow-500' : 'text-yellow-700'}`}>
                        Your browser doesn&apos;t support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Permission Status */}
                  <div className={`p-4 rounded-lg border ${
                    pushPermission === 'granted' 
                      ? isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                      : pushPermission === 'denied'
                      ? isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                      : isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        {pushPermission === 'granted' ? (
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        ) : pushPermission === 'denied' ? (
                          <BellOff className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        ) : (
                          <Bell className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium ${
                            pushPermission === 'granted' 
                              ? isDark ? 'text-green-400' : 'text-green-800'
                              : pushPermission === 'denied'
                              ? isDark ? 'text-red-400' : 'text-red-800'
                              : isDark ? 'text-blue-400' : 'text-blue-800'
                          }`}>
                            {pushPermission === 'granted' 
                              ? 'Notifications enabled'
                              : pushPermission === 'denied'
                              ? 'Notifications blocked'
                              : 'Notifications not enabled'}
                          </p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {pushPermission === 'granted' 
                              ? pushSubscribed 
                                ? 'You will receive push notifications for alerts and reminders.'
                                : 'Permission granted but not subscribed to notifications.'
                              : pushPermission === 'denied'
                              ? 'You have blocked notifications. Enable them in your browser settings.'
                              : 'Enable notifications to receive important alerts and reminders.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {pushPermission !== 'denied' && !pushSubscribed && (
                      <button
                        type="button"
                        onClick={handleEnablePushNotifications}
                        disabled={notificationLoading}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-50 flex items-center justify-center"
                        data-testid="enable-notifications-btn"
                      >
                        {notificationLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Bell className="h-5 w-5 mr-2" />
                        )}
                        Enable Notifications
                      </button>
                    )}

                    {pushSubscribed && (
                      <>
                        <button
                          type="button"
                          onClick={handleTestNotification}
                          className={`flex-1 border-2 py-3 rounded-lg font-semibold transition flex items-center justify-center ${
                            isDark ? 'border-blue-600 text-blue-400 hover:bg-blue-900/20' : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                          }`}
                          data-testid="test-notification-btn"
                        >
                          <Bell className="h-5 w-5 mr-2" />
                          Test Notification
                        </button>
                        <button
                          type="button"
                          onClick={handleDisablePushNotifications}
                          disabled={notificationLoading}
                          className={`flex-1 border-2 py-3 rounded-lg font-semibold transition flex items-center justify-center ${
                            isDark ? 'border-red-600 text-red-400 hover:bg-red-900/20' : 'border-red-500 text-red-600 hover:bg-red-50'
                          }`}
                          data-testid="disable-notifications-btn"
                        >
                          {notificationLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500 mr-2"></div>
                          ) : (
                            <BellOff className="h-5 w-5 mr-2" />
                          )}
                          Disable Notifications
                        </button>
                      </>
                    )}
                  </div>

                  {/* Notification Types Info */}
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>What you&apos;ll receive:</h3>
                    <ul className="space-y-2">
                      <li className={`flex items-start text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Crisis Alerts:</strong> Notifications when a caregiver is alerted about your well-being</span>
                      </li>
                      <li className={`flex items-start text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Caregiver Updates:</strong> When someone accepts your caregiver invitation</span>
                      </li>
                      <li className={`flex items-start text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Mood Reminders:</strong> Gentle reminders to log your mood (coming soon)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Tab */}
          {activeTab === 'help' && (
            <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-full mr-4">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Help & Resources</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Learn how to get the most out of Mentl</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* View Tutorial Button */}
                <button
                  type="button"
                  onClick={() => setShowTutorial(true)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center justify-between hover:scale-[1.01] ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700 hover:border-purple-500' 
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-400'
                  }`}
                  data-testid="view-tutorial-btn"
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-purple-800' : 'bg-purple-100'}`}>
                      <BookOpen className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>View App Tutorial</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Revisit the walkthrough of Mentl&apos;s features</p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    isDark ? 'bg-purple-800 text-purple-300' : 'bg-purple-100 text-purple-700'
                  }`}>
                    4 slides
                  </div>
                </button>

                {/* Quick Tips */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Tips</h3>
                  <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li className="flex items-start">
                      <span className="mr-2">💡</span>
                      <span>Log your mood daily for the best insights and pattern detection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">💡</span>
                      <span>The AI chat is available 24/7 and can help with coping strategies</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">💡</span>
                      <span>Invite trusted family members as caregivers to build your support network</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">💡</span>
                      <span>Check the Insights page weekly to see your progress and patterns</span>
                    </li>
                  </ul>
                </div>

                {/* Crisis Resources */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>Crisis Resources</h3>
                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                    If you&apos;re in crisis or need immediate support:
                  </p>
                  <ul className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li className="flex items-center">
                      <span className="font-semibold mr-2">988 Suicide & Crisis Lifeline:</span>
                      <a href="tel:988" className="text-blue-500 hover:underline">Call or text 988</a>
                    </li>
                    <li className="flex items-center">
                      <span className="font-semibold mr-2">Crisis Text Line:</span>
                      <span>Text HOME to <strong>741741</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Info Section */}
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'}`}>
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Privacy & Security</h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Your information is encrypted and secure. We never share your personal data.
            </p>
            
            <div className={`space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>All personal and health data is encrypted end-to-end</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Your information is never sold to third parties</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>You can export or delete your data at any time</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>HIPAA-compliant security standards</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4 z-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              data-testid="save-settings-button"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Settings;
