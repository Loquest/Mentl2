import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import DietarySuggestions from '../components/DietarySuggestions';
import api from '../utils/api';
import { 
  Utensils, Settings, Check, X, AlertCircle, Leaf, 
  ChevronDown, ChevronUp 
} from 'lucide-react';

const Nutrition = () => {
  const { isDark } = useTheme();
  const [preferences, setPreferences] = useState({
    diet_type: '',
    allergies: [],
    intolerances: [],
    cultural_preferences: '',
    avoid_foods: [],
    preferred_cuisines: [],
    meal_prep_time: 'moderate',
    budget_preference: 'moderate'
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [showPrefsForm, setShowPrefsForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [customAvoid, setCustomAvoid] = useState('');

  const dietTypes = [
    { value: 'omnivore', label: 'No Restrictions' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'gluten_free', label: 'Gluten-Free' }
  ];

  const commonAllergies = [
    'Nuts', 'Peanuts', 'Dairy', 'Gluten', 'Shellfish', 
    'Eggs', 'Soy', 'Fish', 'Wheat', 'Sesame'
  ];

  const commonIntolerances = [
    'Lactose', 'Gluten', 'Fructose', 'Histamine', 'Caffeine'
  ];

  const cuisineOptions = [
    'Mediterranean', 'Asian', 'Indian', 'Mexican', 'Middle Eastern',
    'Italian', 'Japanese', 'Thai', 'American', 'African'
  ];

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await api.get('/users/me/dietary-preferences');
      if (response.data.dietary_preferences) {
        setPreferences(prev => ({ ...prev, ...response.data.dietary_preferences }));
      }
      setIsConfigured(response.data.is_configured);
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSavePreferences = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await api.put('/users/me/dietary-preferences', preferences);
      setSuccess('Dietary preferences saved!');
      setIsConfigured(true);
      setShowPrefsForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (field, item) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const addCustomAvoid = () => {
    if (customAvoid.trim() && !preferences.avoid_foods.includes(customAvoid.trim())) {
      setPreferences(prev => ({
        ...prev,
        avoid_foods: [...prev.avoid_foods, customAvoid.trim()]
      }));
      setCustomAvoid('');
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" data-testid="nutrition-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mood-Based Nutrition</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Personalized food suggestions to support your mental well-being
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className={`px-4 py-3 rounded-lg mb-6 flex items-center ${isDark ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}
        
        {error && (
          <div className={`px-4 py-3 rounded-lg mb-6 flex items-center ${isDark ? 'bg-red-900/30 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Preferences Setup Banner */}
        {!isConfigured && !showPrefsForm && (
          <div className={`rounded-xl p-6 mb-6 border ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Leaf className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Set Up Your Dietary Preferences</h3>
                  <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tell us about your diet, allergies, and food preferences to get personalized suggestions 
                    that are safe and enjoyable for you.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrefsForm(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center"
                data-testid="setup-prefs-btn"
              >
                <Settings className="h-4 w-4 mr-2" />
                Set Up Now
              </button>
            </div>
          </div>
        )}

        {/* Preferences Form */}
        {showPrefsForm && (
          <div className={`rounded-xl shadow-md p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`} data-testid="prefs-form">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dietary Preferences</h2>
              <button
                onClick={() => setShowPrefsForm(false)}
                className={isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Diet Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Diet Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {dietTypes.map(diet => (
                    <button
                      key={diet.value}
                      type="button"
                      onClick={() => setPreferences(prev => ({ ...prev, diet_type: diet.value }))}
                      className={`p-3 rounded-lg text-sm font-medium transition ${
                        preferences.diet_type === diet.value
                          ? 'bg-green-500 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {diet.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Allergies (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonAllergies.map(allergy => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleArrayItem('allergies', allergy)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        preferences.allergies.includes(allergy)
                          ? 'bg-red-500 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intolerances */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Intolerances
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonIntolerances.map(intolerance => (
                    <button
                      key={intolerance}
                      type="button"
                      onClick={() => toggleArrayItem('intolerances', intolerance)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        preferences.intolerances.includes(intolerance)
                          ? 'bg-orange-500 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {intolerance}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foods to Avoid */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Specific Foods to Avoid
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customAvoid}
                    onChange={(e) => setCustomAvoid(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomAvoid()}
                    placeholder="Add food to avoid..."
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  />
                  <button
                    type="button"
                    onClick={addCustomAvoid}
                    className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Add
                  </button>
                </div>
                {preferences.avoid_foods.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.avoid_foods.map(food => (
                      <span
                        key={food}
                        className={`px-3 py-1 rounded-full text-sm flex items-center ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {food}
                        <button
                          onClick={() => toggleArrayItem('avoid_foods', food)}
                          className={`ml-2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferred Cuisines */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preferred Cuisines
                </label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map(cuisine => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleArrayItem('preferred_cuisines', cuisine)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        preferences.preferred_cuisines.includes(cuisine)
                          ? 'bg-blue-500 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prep Time & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prep Time Preference
                  </label>
                  <select
                    value={preferences.meal_prep_time}
                    onChange={(e) => setPreferences(prev => ({ ...prev, meal_prep_time: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  >
                    <option value="quick">Quick (&lt;15 min)</option>
                    <option value="moderate">Moderate (15-30 min)</option>
                    <option value="elaborate">Elaborate (30+ min)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Budget Preference
                  </label>
                  <select
                    value={preferences.budget_preference}
                    onChange={(e) => setPreferences(prev => ({ ...prev, budget_preference: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  >
                    <option value="budget">Budget-Friendly</option>
                    <option value="moderate">Moderate</option>
                    <option value="premium">Premium Ingredients</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-gray-700' : ''}`}>
                <button
                  type="button"
                  onClick={() => setShowPrefsForm(false)}
                  className={`px-6 py-2 border rounded-lg ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
                  data-testid="save-prefs-btn"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Preferences Button */}
        {isConfigured && !showPrefsForm && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowPrefsForm(true)}
              className={`flex items-center text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit Dietary Preferences
            </button>
          </div>
        )}

        {/* Main Suggestions Component */}
        <DietarySuggestions compact={false} />
      </div>
    </Layout>
  );
};

export default Nutrition;
