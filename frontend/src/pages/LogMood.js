import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ActivitySuggestions from '../components/ActivitySuggestions';
import api from '../utils/api';
import { Smile, Meh, Frown, Check } from 'lucide-react';

const MOOD_TAGS = [
  'Happy', 'Sad', 'Anxious', 'Calm', 'Energetic', 'Tired', 'Frustrated', 'Content', 'Overwhelmed', 'Focused'
];

const SYMPTOMS_BIPOLAR = [
  { id: 'elevated_mood', label: 'Elevated mood' },
  { id: 'irritability', label: 'Irritability' },
  { id: 'impulsivity', label: 'Impulsivity' },
  { id: 'racing_thoughts', label: 'Racing thoughts' },
  { id: 'decreased_need_sleep', label: 'Decreased need for sleep' },
  { id: 'increased_energy', label: 'Increased energy' },
  { id: 'grandiosity', label: 'Grandiose thinking' },
  { id: 'rapid_speech', label: 'Rapid or pressured speech' },
  { id: 'risky_behavior', label: 'Engaging in risky behaviors' },
  { id: 'difficulty_concentrating', label: 'Difficulty concentrating' },
  { id: 'mood_swings', label: 'Extreme mood swings' },
  { id: 'withdrawal', label: 'Social withdrawal' },
  { id: 'paranoia', label: 'Paranoid thoughts' },
  { id: 'excessive_spending', label: 'Excessive spending or shopping' },
];

const SYMPTOMS_ADHD = [
  { id: 'difficulty_focusing', label: 'Difficulty focusing' },
  { id: 'restlessness', label: 'Restlessness' },
  { id: 'forgetfulness', label: 'Forgetfulness' },
  { id: 'task_completion', label: 'Struggled with tasks' },
  { id: 'impulsive_decisions', label: 'Impulsive decisions' },
  { id: 'time_blindness', label: 'Lost track of time' },
  { id: 'disorganization', label: 'Disorganization' },
  { id: 'hyperfocus', label: 'Hyperfocus episodes' },
  { id: 'interrupting', label: 'Interrupting others' },
  { id: 'fidgeting', label: 'Fidgeting or squirming' },
  { id: 'procrastination', label: 'Procrastination' },
  { id: 'emotional_dysregulation', label: 'Emotional outbursts' },
  { id: 'sensory_overload', label: 'Sensory overload' },
  { id: 'rejection_sensitivity', label: 'Rejection sensitivity' },
];

const SYMPTOMS_DEPRESSION = [
  { id: 'low_energy', label: 'Low energy' },
  { id: 'hopelessness', label: 'Feeling hopeless' },
  { id: 'loss_of_interest', label: 'Loss of interest' },
  { id: 'difficulty_concentrating', label: 'Difficulty concentrating' },
  { id: 'changes_appetite', label: 'Changes in appetite' },
  { id: 'sleep_problems', label: 'Sleep problems' },
  { id: 'worthlessness', label: 'Feelings of worthlessness' },
  { id: 'guilt', label: 'Excessive guilt' },
  { id: 'fatigue', label: 'Persistent fatigue' },
  { id: 'physical_aches', label: 'Physical aches and pains' },
  { id: 'suicidal_thoughts', label: 'Thoughts of death or suicide' },
  { id: 'crying_spells', label: 'Crying spells' },
  { id: 'irritability', label: 'Irritability or frustration' },
  { id: 'social_isolation', label: 'Social isolation' },
];

const SYMPTOMS_OCD = [
  { id: 'intrusive_thoughts', label: 'Intrusive thoughts' },
  { id: 'compulsive_behaviors', label: 'Compulsive behaviors' },
  { id: 'excessive_checking', label: 'Excessive checking' },
  { id: 'need_for_symmetry', label: 'Need for symmetry/order' },
  { id: 'contamination_fears', label: 'Contamination fears' },
  { id: 'excessive_cleaning', label: 'Excessive cleaning/washing' },
  { id: 'mental_rituals', label: 'Mental rituals or counting' },
  { id: 'hoarding_urges', label: 'Hoarding urges' },
  { id: 'reassurance_seeking', label: 'Seeking reassurance' },
  { id: 'avoidance_behaviors', label: 'Avoidance of triggers' },
  { id: 'doubt_uncertainty', label: 'Persistent doubt or uncertainty' },
  { id: 'aggressive_thoughts', label: 'Unwanted aggressive thoughts' },
  { id: 'religious_obsessions', label: 'Religious or moral obsessions' },
  { id: 'perfectionism', label: 'Extreme perfectionism' },
];

const LogMood = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(today);
  const [moodRating, setMoodRating] = useState(5);
  const [moodTag, setMoodTag] = useState('');
  const [symptoms, setSymptoms] = useState({});
  const [notes, setNotes] = useState('');
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userConditions, setUserConditions] = useState([]);

  useEffect(() => {
    // Get user conditions
    api.get('/auth/me').then(response => {
      setUserConditions(response.data.conditions || []);
    });

    // Check if today's log exists
    api.get(`/mood-logs?start_date=${today}&end_date=${today}`)
      .then(response => {
        if (response.data.length > 0) {
          const log = response.data[0];
          setMoodRating(log.mood_rating);
          setMoodTag(log.mood_tag || '');
          setSymptoms(log.symptoms || {});
          setNotes(log.notes || '');
          setMedicationTaken(log.medication_taken || false);
          setSleepHours(log.sleep_hours || '');
        }
      })
      .catch(err => console.error('Error loading mood log:', err));
  }, [today]);

  const getAvailableSymptoms = () => {
    let allSymptoms = [];
    if (userConditions.includes('bipolar')) allSymptoms = [...allSymptoms, ...SYMPTOMS_BIPOLAR];
    if (userConditions.includes('adhd')) allSymptoms = [...allSymptoms, ...SYMPTOMS_ADHD];
    if (userConditions.includes('depression')) allSymptoms = [...allSymptoms, ...SYMPTOMS_DEPRESSION];
    if (userConditions.includes('ocd')) allSymptoms = [...allSymptoms, ...SYMPTOMS_OCD];
    return allSymptoms;
  };

  const toggleSymptom = (symptomId) => {
    setSymptoms(prev => ({
      ...prev,
      [symptomId]: !prev[symptomId]
    }));
  };

  const getMoodEmoji = () => {
    if (moodRating >= 7) return <Smile className="h-16 w-16 text-green-500" />;
    if (moodRating >= 4) return <Meh className="h-16 w-16 text-yellow-500" />;
    return <Frown className="h-16 w-16 text-red-500" />;
  };

  const getMoodColor = () => {
    if (moodRating >= 7) return 'from-green-400 to-green-600';
    if (moodRating >= 4) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const logData = {
        date,
        mood_rating: moodRating,
        mood_tag: moodTag || null,
        symptoms,
        notes: notes || null,
        medication_taken: medicationTaken,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      };

      await api.post('/mood-logs', logData);
      setSuccess(true);
      setShowSuggestions(true);
      
      // Scroll to suggestions after a brief delay
      setTimeout(() => {
        document.getElementById('suggestions-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('already exists')) {
        setError('You already logged your mood for this date. Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(err.response?.data?.detail || 'Failed to save mood log');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto" data-testid="log-mood-page">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Log Your Mood</h1>
          <p className="mt-2 text-gray-600">Take a moment to check in with yourself</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6" data-testid="success-message">
            ✓ Mood logged successfully! Check out your personalized activity suggestions below.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" data-testid="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-8">
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              data-testid="date-input"
            />
          </div>

          {/* Mood Rating */}
          <div data-testid="mood-rating-section">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              How are you feeling? (1-10)
            </label>
            <div className="flex flex-col items-center space-y-4">
              <div className={`bg-gradient-to-br ${getMoodColor()} p-6 rounded-full`}>
                {getMoodEmoji()}
              </div>
              <div className="text-4xl font-bold text-gray-900" data-testid="mood-rating-display">{moodRating}</div>
              <input
                type="range"
                min="1"
                max="10"
                value={moodRating}
                onChange={(e) => setMoodRating(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                data-testid="mood-rating-slider"
              />
              <div className="flex justify-between w-full text-sm text-gray-500">
                <span>1 (Very Low)</span>
                <span>10 (Excellent)</span>
              </div>
            </div>
          </div>

          {/* Mood Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose a mood tag (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMoodTag(tag === moodTag ? '' : tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    moodTag === tag
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`mood-tag-${tag.toLowerCase()}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          {getAvailableSymptoms().length > 0 && (
            <div data-testid="symptoms-section">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Any symptoms today? (optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getAvailableSymptoms().map(symptom => (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`flex items-center justify-between p-3 border-2 rounded-lg text-left transition ${
                      symptoms[symptom.id]
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`symptom-${symptom.id}`}
                  >
                    <span className="text-sm font-medium text-gray-700">{symptom.label}</span>
                    {symptoms[symptom.id] && (
                      <Check className="h-5 w-5 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="What's on your mind? Any triggers or positive moments?"
              data-testid="notes-input"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sleep" className="block text-sm font-medium text-gray-700 mb-2">
                Sleep Hours (optional)
              </label>
              <input
                id="sleep"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 7.5"
                data-testid="sleep-input"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medicationTaken}
                  onChange={(e) => setMedicationTaken(e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  data-testid="medication-checkbox"
                />
                <span className="text-sm font-medium text-gray-700">Took medication today</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-mood-log-button"
          >
            {loading ? 'Saving...' : 'Save Mood Log'}
          </button>
        </form>

        {/* Activity Suggestions - Show after successful log */}
        {showSuggestions && (
          <div id="suggestions-section" className="mt-8">
            <ActivitySuggestions showTitle={true} compact={false} />
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LogMood;