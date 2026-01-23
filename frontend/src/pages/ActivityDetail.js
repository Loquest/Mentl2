import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { ArrowLeft, CheckCircle, Lightbulb, Clock, Sparkles, Loader2 } from 'lucide-react';

const ActivityDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { activity } = location.state || {};
  
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activity) {
      navigate('/dashboard');
      return;
    }
    fetchActivityDetails();
  }, [activity]);

  const fetchActivityDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/activities/details', activity);
      setDetails(response.data);
    } catch (err) {
      setError('Unable to load activity details');
      console.error('Error fetching activity details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      physical: 'from-green-500 to-emerald-500',
      mindfulness: 'from-purple-500 to-indigo-500',
      social: 'from-blue-500 to-cyan-500',
      creative: 'from-pink-500 to-rose-500',
      'self-care': 'from-yellow-500 to-orange-500',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Generating personalized instructions...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !activity) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || 'Activity not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-purple-500 hover:text-purple-400 font-semibold"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-8" data-testid="activity-detail-page">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center mb-6 transition ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-r ${getCategoryColor(activity.category)} rounded-2xl p-8 mb-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                {activity.category}
              </span>
              <h1 className="text-3xl font-bold mt-2 mb-3">{activity.activity}</h1>
              <p className="text-lg opacity-95">{activity.description}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 ml-4">
              <Clock className="h-5 w-5 mb-1" />
              <span className="text-sm font-semibold">{activity.duration}</span>
            </div>
          </div>
        </div>

        {/* Why This Helps */}
        {details?.details?.why_this_helps && (
          <div className={`rounded-xl p-6 mb-6 border-2 ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-start">
              <div className="bg-blue-500 rounded-full p-2 mr-4">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Why This Helps</h2>
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{details.details.why_this_helps}</p>
              </div>
            </div>
          </div>
        )}

        {/* Materials Needed */}
        {details?.details?.materials_needed && details.details.materials_needed.length > 0 && (
          <div className={`rounded-xl shadow-md p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>What You'll Need</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {details.details.materials_needed.map((material, index) => (
                <li key={index} className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  {material}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        {details?.details?.steps && (
          <div className={`rounded-xl shadow-md p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Step-by-Step Instructions</h2>
            <div className="space-y-4">
              {details.details.steps.map((step, index) => (
                <div key={index} className="flex items-start" data-testid={`step-${step.number}`}>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{step.instruction}</p>
                    {step.tip && (
                      <p className={`text-sm italic ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>💡 Tip: {step.tip}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Tips */}
        {details?.details?.success_tips && details.details.success_tips.length > 0 && (
          <div className={`rounded-xl p-6 mb-6 border-2 ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tips for Success</h2>
            <ul className="space-y-2">
              {details.details.success_tips.map((tip, index) => (
                <li key={index} className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Sparkles className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variations */}
        {details?.details?.variations && details.details.variations.length > 0 && (
          <div className={`rounded-xl shadow-md p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Variations & Adaptations</h2>
            <div className="space-y-4">
              {details.details.variations.map((variation, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4">
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{variation.name}</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{variation.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Times */}
        {details?.details?.best_times && details.details.best_times.length > 0 && (
          <div className={`rounded-xl p-6 mb-6 border-2 ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>When to Do This</h2>
            <div className="flex flex-wrap gap-2">
              {details.details.best_times.map((time, index) => (
                <span
                  key={index}
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${isDark ? 'bg-gray-800 border-purple-700 text-purple-400' : 'bg-white border-purple-300 text-purple-700'}`}
                >
                  {time}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex-1 border-2 border-purple-500 py-3 rounded-lg font-semibold transition ${isDark ? 'bg-gray-800 text-purple-400 hover:bg-gray-700' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/log-mood')}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
          >
            Log Your Mood
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ActivityDetail;
