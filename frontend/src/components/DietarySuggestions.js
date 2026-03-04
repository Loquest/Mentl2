import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { 
  Utensils, Clock, Leaf, Brain, ChefHat, Apple, Coffee, Moon,
  Sun, Sunset, RefreshCw, ChevronRight, Sparkles, AlertCircle, Heart
} from 'lucide-react';

const DietarySuggestions = ({ compact = false }) => {
  const { isDark } = useTheme();
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prefsConfigured, setPrefsConfigured] = useState(false);
  const [suggestionType, setSuggestionType] = useState('quick_snack');

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'midday';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const getTimeIcon = () => {
    const time = getTimeOfDay();
    if (time === 'morning') return <Sun className="h-4 w-4 text-yellow-500" />;
    if (time === 'evening' || time === 'night') return <Moon className="h-4 w-4 text-indigo-500" />;
    return <Sunset className="h-4 w-4 text-orange-500" />;
  };

  const fetchSuggestion = useCallback(async (type = suggestionType) => {
    setLoading(true);
    setError('');
    
    try {
      // Check if preferences are configured
      const prefsRes = await api.get('/users/me/dietary-preferences');
      setPrefsConfigured(prefsRes.data.is_configured);
      
      // Get suggestion
      const response = await api.post('/dietary/suggestions', {
        suggestion_type: type,
        time_of_day: getTimeOfDay()
      });
      
      setSuggestion(response.data.suggestion);
    } catch (err) {
      console.error('Error fetching dietary suggestion:', err);
      setError('Unable to load suggestion');
    } finally {
      setLoading(false);
    }
  }, [suggestionType]);

  useEffect(() => {
    fetchSuggestion();
  }, [fetchSuggestion]);

  const handleRefresh = () => {
    fetchSuggestion(suggestionType);
  };

  const handleTypeChange = (type) => {
    setSuggestionType(type);
    fetchSuggestion(type);
  };

  if (loading) {
    return (
      <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="dietary-suggestions-loading">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Utensils className="h-5 w-5 mr-2 text-green-500" />
            Mood-Based Nutrition
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error && !suggestion) {
    return (
      <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="dietary-suggestions-error">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Utensils className="h-5 w-5 mr-2 text-green-500" />
            Mood-Based Nutrition
          </h2>
        </div>
        <div className="text-center py-6">
          <AlertCircle className={`h-10 w-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-sm text-green-500 hover:text-green-400 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Compact version for dashboard
  if (compact && suggestion) {
    return (
      <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="dietary-suggestions-compact">
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Utensils className="h-5 w-5 mr-2 text-green-500" />
            Nutrition Suggestion
          </h2>
          <Link 
            to="/nutrition" 
            className="text-sm text-green-500 hover:text-green-400 font-medium flex items-center"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {!prefsConfigured && (
          <Link
            to="/settings"
            className={`block mb-4 p-3 rounded-lg transition ${isDark ? 'bg-amber-900/30 border border-amber-700 hover:bg-amber-900/50' : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'}`}
          >
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Set up dietary preferences</p>
                <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Get personalized suggestions</p>
              </div>
            </div>
          </Link>
        )}

        <div className={`rounded-lg p-4 ${isDark ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-800' : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                {getTimeIcon()}
                <span className={`text-xs ml-2 capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getTimeOfDay()} suggestion</span>
              </div>
              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{suggestion.title}</h3>
              <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{suggestion.description}</p>
              
              {suggestion.mood_benefits?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestion.mood_benefits.slice(0, 2).map((benefit, idx) => (
                    <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                      {benefit}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-green-600 transition"
              title="Get new suggestion"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick type selector */}
        <div className="flex gap-2 mt-4">
          {[
            { type: 'quick_snack', icon: Apple, label: 'Snack' },
            { type: 'recipe', icon: ChefHat, label: 'Recipe' },
            { type: 'meal_plan', icon: Coffee, label: 'Meal Plan' }
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition ${
                suggestionType === type
                  ? 'bg-green-500 text-white'
                  : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="dietary-suggestions-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Utensils className="h-5 w-5 mr-2 text-green-500" />
          Mood-Based Nutrition
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center text-sm text-green-500 hover:text-green-400 font-medium"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          New Suggestion
        </button>
      </div>

      {/* Type Selector */}
      <div className="flex gap-2 mb-6">
        {[
          { type: 'quick_snack', icon: Apple, label: 'Quick Snack', desc: 'Ready in minutes' },
          { type: 'recipe', icon: ChefHat, label: 'Recipe', desc: 'Full dish with instructions' },
          { type: 'meal_plan', icon: Coffee, label: 'Meal Plan', desc: 'Structured daily meals' }
        ].map(({ type, icon: Icon, label, desc }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex-1 p-3 rounded-lg text-left transition ${
              suggestionType === type
                ? isDark ? 'bg-green-900/40 border-2 border-green-600' : 'bg-green-100 border-2 border-green-500'
                : isDark ? 'bg-gray-700 border-2 border-transparent hover:border-green-800' : 'bg-gray-50 border-2 border-transparent hover:border-green-200'
            }`}
          >
            <Icon className={`h-5 w-5 mb-1 ${suggestionType === type ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`font-medium text-sm ${suggestionType === type ? (isDark ? 'text-green-400' : 'text-green-800') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>{label}</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{desc}</p>
          </button>
        ))}
      </div>

      {suggestion && (
        <div className="space-y-4">
          {/* Main Suggestion Card */}
          <div className={`rounded-xl p-6 border ${isDark ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-800' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'}`}>
            <div className="flex items-center mb-3">
              {getTimeIcon()}
              <span className={`text-sm ml-2 capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getTimeOfDay()} • Personalized for you</span>
            </div>
            
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{suggestion.title}</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{suggestion.description}</p>

            {/* Reasoning */}
            {suggestion.reasoning && (
              <div className={`rounded-lg p-3 mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
                <div className="flex items-start">
                  <Brain className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Why this helps you</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{suggestion.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nutritional Highlights & Mood Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {suggestion.nutritional_highlights?.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 flex items-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <Leaf className="h-3 w-3 mr-1" />
                    NUTRITIONAL HIGHLIGHTS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.nutritional_highlights.map((item, idx) => (
                      <span key={idx} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {suggestion.mood_benefits?.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 flex items-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <Heart className="h-3 w-3 mr-1" />
                    MOOD BENEFITS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.mood_benefits.map((item, idx) => (
                      <span key={idx} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-pink-900/50 text-pink-400' : 'bg-pink-100 text-pink-700'}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prep Time */}
            {suggestion.prep_time && (
              <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="h-4 w-4 mr-1" />
                {suggestion.prep_time}
              </div>
            )}
          </div>

          {/* Ingredients */}
          {suggestion.ingredients?.length > 0 && (
            <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Ingredients</h4>
              <ul className="grid grid-cols-2 gap-2">
                {suggestion.ingredients.map((ingredient, idx) => (
                  <li key={idx} className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preparation Steps */}
          {suggestion.preparation_steps?.length > 0 && (
            <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>How to Prepare</h4>
              <ol className="space-y-2">
                {suggestion.preparation_steps.map((step, idx) => (
                  <li key={idx} className={`flex text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs mr-3">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Alternatives */}
          {suggestion.alternatives?.length > 0 && (
            <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Not feeling this? Try:</p>
              <div className="flex flex-wrap gap-2">
                {suggestion.alternatives.map((alt, idx) => (
                  <span key={idx} className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DietarySuggestions;
