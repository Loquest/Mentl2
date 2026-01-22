import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Sparkles, Activity, Heart, Users, Palette, Loader2, RefreshCw } from 'lucide-react';

const CATEGORY_ICONS = {
  physical: Activity,
  mindfulness: Heart,
  social: Users,
  creative: Palette,
  'self-care': Heart,
};

const CATEGORY_COLORS = {
  physical: 'bg-green-100 text-green-700 border-green-300',
  mindfulness: 'bg-purple-100 text-purple-700 border-purple-300',
  social: 'bg-blue-100 text-blue-700 border-blue-300',
  creative: 'bg-pink-100 text-pink-700 border-pink-300',
  'self-care': 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

const ActivitySuggestions = ({ showTitle = true, compact = false }) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [basedOnMood, setBasedOnMood] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/mood-logs/suggestions');
      setSuggestions(response.data.suggestions || []);
      setBasedOnMood(response.data.based_on_mood);
    } catch (err) {
      setError('Unable to load suggestions');
      console.error('Error fetching suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSuggestions();
  };

  const handleActivityClick = (suggestion) => {
    navigate('/activity-detail', { state: { activity: suggestion } });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-md p-6 ${compact ? '' : 'mb-6'}`} data-testid="suggestions-loading">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <span className="ml-3 text-gray-600">Generating personalized suggestions...</span>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border-2 border-purple-200 ${compact ? '' : 'mb-6'}`} data-testid="activity-suggestions">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {showTitle && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Suggested Activities</h2>
              {basedOnMood && (
                <p className="text-sm text-gray-600">Based on your mood: {basedOnMood}/10</p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition"
          title="Refresh suggestions"
          data-testid="refresh-suggestions-button"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Suggestions Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
        {suggestions.map((suggestion, index) => {
          const Icon = CATEGORY_ICONS[suggestion.category] || Activity;
          const colorClass = CATEGORY_COLORS[suggestion.category] || 'bg-gray-100 text-gray-700 border-gray-300';
          
          return (
            <div
              key={index}
              className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-purple-300 transition group cursor-pointer"
              data-testid={`suggestion-${index}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${colorClass} border`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition">
                    {suggestion.activity}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      ⏱️ {suggestion.duration}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${colorClass} capitalize`}>
                      {suggestion.category}
                    </span>
                  </div>
                  {suggestion.benefit && (
                    <p className="text-xs text-purple-600 mt-2 italic">
                      💡 {suggestion.benefit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs text-center text-gray-600">
          ✨ AI-powered suggestions personalized for your mental health needs
        </p>
      </div>
    </div>
  );
};

export default ActivitySuggestions;
