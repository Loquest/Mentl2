import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { Sparkles, Activity, Heart, Users, Palette, Loader2, RefreshCw } from 'lucide-react';

const CATEGORY_ICONS = {
  physical: Activity,
  mindfulness: Heart,
  social: Users,
  creative: Palette,
  'self-care': Heart,
};

const getCategoryColors = (isDark) => ({
  physical: isDark ? 'bg-green-900/40 text-green-400 border-green-700' : 'bg-green-100 text-green-700 border-green-300',
  mindfulness: isDark ? 'bg-purple-900/40 text-purple-400 border-purple-700' : 'bg-purple-100 text-purple-700 border-purple-300',
  social: isDark ? 'bg-blue-900/40 text-blue-400 border-blue-700' : 'bg-blue-100 text-blue-700 border-blue-300',
  creative: isDark ? 'bg-pink-900/40 text-pink-400 border-pink-700' : 'bg-pink-100 text-pink-700 border-pink-300',
  'self-care': isDark ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700' : 'bg-yellow-100 text-yellow-700 border-yellow-300',
});

const ActivitySuggestions = ({ showTitle = true, compact = false }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [basedOnMood, setBasedOnMood] = useState(null);

  const CATEGORY_COLORS = getCategoryColors(isDark);

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
      <div className={`rounded-xl shadow-md p-6 ${compact ? '' : 'mb-6'} ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="suggestions-loading">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <span className={`ml-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Generating personalized suggestions...</span>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-xl shadow-md p-6 border-2 ${compact ? '' : 'mb-6'} ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`} data-testid="activity-suggestions">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {showTitle && (
            <div>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Suggested Activities</h2>
              {basedOnMood && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Based on your mood: {basedOnMood}/10</p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-lg transition ${isDark ? 'text-purple-400 hover:bg-purple-900/30' : 'text-purple-600 hover:bg-purple-100'}`}
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
          const colorClass = CATEGORY_COLORS[suggestion.category] || (isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300');
          
          return (
            <div
              key={index}
              onClick={() => handleActivityClick(suggestion)}
              className={`rounded-lg p-4 border-2 hover:border-purple-500 hover:shadow-md transition group cursor-pointer ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
              data-testid={`suggestion-${index}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${colorClass} border`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 group-hover:text-purple-500 transition ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {suggestion.activity}
                  </h3>
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      ⏱️ {suggestion.duration}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${colorClass} capitalize`}>
                      {suggestion.category}
                    </span>
                  </div>
                  {suggestion.benefit && (
                    <p className={`text-xs mt-2 italic ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      💡 {suggestion.benefit}
                    </p>
                  )}
                  <p className={`text-xs font-medium mt-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    👉 Click for detailed instructions
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-purple-800' : 'border-purple-200'}`}>
        <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          ✨ AI-powered suggestions personalized for your mental health needs
        </p>
      </div>
    </div>
  );
};

export default ActivitySuggestions;
