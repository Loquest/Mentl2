import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../utils/api';
import { User, Check, AlertCircle } from 'lucide-react';

const CONDITION_OPTIONS = [
  { id: 'bipolar', label: 'Bipolar Disorder', description: 'Manage mood episodes and track patterns' },
  { id: 'adhd', label: 'ADHD', description: 'Focus and organization support' },
  { id: 'depression', label: 'Depression', description: 'Mood tracking and coping strategies' },
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [conditions, setConditions] = useState(user?.conditions || []);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.put('/auth/profile', {
        name,
        conditions
      });
      
      updateUser(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto" data-testid="settings-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6" data-testid="success-message">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              Profile updated successfully!
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full mr-4">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                <p className="text-sm text-gray-600">Update your personal details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  data-testid="name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  data-testid="email-display"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>
          </div>

          {/* Condition Management */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Conditions</h2>
            <p className="text-sm text-gray-600 mb-6">
              Select the conditions you want to focus on. This helps personalize your experience.
            </p>

            <div className="space-y-3" data-testid="conditions-section">
              {CONDITION_OPTIONS.map((condition) => (
                <button
                  key={condition.id}
                  type="button"
                  onClick={() => toggleCondition(condition.id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition flex items-start justify-between group ${
                    conditions.includes(condition.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  data-testid={`condition-${condition.id}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{condition.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{condition.description}</p>
                  </div>
                  {conditions.includes(condition.id) && (
                    <div className="ml-4 bg-purple-500 rounded-full p-1 flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Privacy & Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your data is encrypted and secure. We never share your personal information.
            </p>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>All mood logs and chat history are private and encrypted</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Your data is never sold to third parties</span>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>You can export or delete your data at any time</span>
              </div>
            </div>
          </div>

          {/* App Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About MindCare</h2>
            <p className="text-sm text-gray-700">
              MindCare is a mental health companion app designed to support individuals with Bipolar Disorder, ADHD, and Depression. 
              This app is not a replacement for professional mental health care.
            </p>
            <p className="text-sm text-gray-700 mt-3">
              <strong>Crisis Support:</strong> If you're in crisis, please call <strong>988</strong> (Suicide & Crisis Lifeline) or text <strong>HOME to 741741</strong>.
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="save-settings-button"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Settings;