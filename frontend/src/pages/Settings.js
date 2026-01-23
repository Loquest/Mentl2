import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Layout from '../components/Layout';
import api from '../utils/api';
import { User, Check, AlertCircle, Heart, Activity, Scale, Ruler, Bell, BellOff } from 'lucide-react';
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
        <div className={`flex space-x-2 mb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 font-semibold transition ${
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
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'conditions'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="conditions-tab"
          >
            Mental Health Conditions
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
                            ✓ Selected - You'll receive tailored support for this condition
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
