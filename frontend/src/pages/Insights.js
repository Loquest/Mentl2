import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, Download, AlertTriangle, 
  Zap, Moon, Pill, Target, Activity, Brain, ChevronDown, ChevronUp 
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#f97316', '#14b8a6'];

const Insights = () => {
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    patterns: true,
    triggers: true,
    correlations: true
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      const formattedStartDate = startDate.toISOString().split('T')[0];

      const [logsResponse, analyticsResponse, advancedResponse] = await Promise.all([
        api.get(`/mood-logs?start_date=${formattedStartDate}&limit=1000`),
        api.get(`/mood-logs/analytics/summary?days=${timeRange}`),
        api.get(`/mood-logs/analytics/advanced?days=${timeRange}`)
      ]);

      setLogs(logsResponse.data);
      setAnalytics(analyticsResponse.data);
      setAdvancedAnalytics(advancedResponse.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getChartData = () => {
    return logs
      .slice()
      .reverse()
      .map(log => ({
        date: log.date,
        mood: log.mood_rating,
        sleep: log.sleep_hours || 0
      }));
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'bg-green-50 border-green-200 text-green-700';
    if (trend === 'declining') return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Mood Rating', 'Mood Tag', 'Sleep Hours', 'Medication', 'Notes'],
      ...logs.map(log => [
        log.date,
        log.mood_rating,
        log.mood_tag || '',
        log.sleep_hours || '',
        log.medication_taken ? 'Yes' : 'No',
        log.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing your data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!analytics || logs.length === 0) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Yet</h2>
            <p className="text-gray-600 mb-6">Start logging your mood to see insights and patterns</p>
            <a
              href="/log-mood"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >
              Log Your First Mood
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  const chartData = getChartData();

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-testid="insights-page">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insights & Analytics</h1>
              <p className="mt-2 text-gray-600">Advanced pattern recognition and trigger identification</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                data-testid="export-button"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeRange === days
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                data-testid={`time-range-${days}`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'patterns', label: 'Patterns', icon: Brain },
            { id: 'triggers', label: 'Triggers', icon: Target },
            { id: 'correlations', label: 'Correlations', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6" data-testid="average-mood-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Average Mood</p>
                  {getTrendIcon(analytics.mood_trend)}
                </div>
                <p className="text-4xl font-bold text-gray-900">{analytics.average_mood}<span className="text-2xl text-gray-500">/10</span></p>
                <p className={`mt-2 text-sm font-medium capitalize ${getTrendColor(analytics.mood_trend)} px-3 py-1 rounded-full inline-block`}>
                  {analytics.mood_trend}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6" data-testid="total-logs-card">
                <p className="text-sm font-medium text-gray-600 mb-2">Total Logs</p>
                <p className="text-4xl font-bold text-gray-900">{analytics.total_logs}</p>
                <p className="mt-2 text-sm text-gray-500">in {timeRange} days</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6" data-testid="consistency-card">
                <p className="text-sm font-medium text-gray-600 mb-2">Consistency</p>
                <p className="text-4xl font-bold text-gray-900">
                  {Math.round((analytics.total_logs / timeRange) * 100)}%
                </p>
                <p className="mt-2 text-sm text-gray-500">logging rate</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Patterns Found</p>
                <p className="text-4xl font-bold text-purple-600">
                  {advancedAnalytics?.patterns?.length || 0}
                </p>
                <p className="mt-2 text-sm text-gray-500">identified</p>
              </div>
            </div>

            {/* Mood Trend Chart */}
            <div className="bg-white rounded-xl shadow-md p-6" data-testid="mood-trend-chart">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mood Trend Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [value, name === 'mood' ? 'Mood' : 'Sleep (hrs)']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fill="url(#moodGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mood Distribution */}
            {advancedAnalytics?.mood_distribution && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={advancedAnalytics.mood_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => [`${value} logs`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {advancedAnalytics.mood_distribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.rating >= 7 ? '#10b981' : entry.rating >= 4 ? '#f59e0b' : '#ef4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Day of Week Analysis */}
                {advancedAnalytics?.day_of_week_analysis?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Mood by Day of Week</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <RadarChart data={advancedAnalytics.day_of_week_analysis}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar 
                          name="Average Mood" 
                          dataKey="average_mood" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.5} 
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Key Insights */}
            {analytics.insights.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
                <div className="space-y-3">
                  {analytics.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-100 rounded-full p-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Identified Patterns */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <button 
                onClick={() => toggleSection('patterns')}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-500" />
                  Identified Patterns
                </h2>
                {expandedSections.patterns ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {expandedSections.patterns && (
                <div className="mt-4 space-y-4">
                  {advancedAnalytics?.patterns?.length > 0 ? (
                    advancedAnalytics.patterns.map((pattern, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                        pattern.pattern === 'low_mood_streak' ? 'bg-red-50 border-red-500' :
                        pattern.pattern === 'high_variability' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-purple-50 border-purple-500'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{pattern.description}</p>
                            <p className="text-sm text-gray-600 mt-1">{pattern.details}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            pattern.type === 'streak' ? 'bg-red-100 text-red-700' :
                            pattern.type === 'variability' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {pattern.type}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Not enough data to identify patterns yet.</p>
                      <p className="text-sm mt-1">Keep logging to unlock pattern recognition!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Day of Week Analysis Detail */}
            {advancedAnalytics?.day_of_week_analysis?.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Pattern Analysis</h2>
                <div className="grid grid-cols-7 gap-2">
                  {advancedAnalytics.day_of_week_analysis
                    .sort((a, b) => a.day_index - b.day_index)
                    .map((day) => {
                      const moodLevel = day.average_mood >= 7 ? 'high' : day.average_mood >= 4 ? 'medium' : 'low';
                      return (
                        <div key={day.day} className={`p-3 rounded-lg text-center ${
                          moodLevel === 'high' ? 'bg-green-100' :
                          moodLevel === 'medium' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          <p className="text-xs font-medium text-gray-600">{day.day.slice(0, 3)}</p>
                          <p className={`text-2xl font-bold mt-1 ${
                            moodLevel === 'high' ? 'text-green-700' :
                            moodLevel === 'medium' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {day.average_mood}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{day.log_count} logs</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Triggers Tab */}
        {activeTab === 'triggers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Identified Triggers
              </h2>
              
              {advancedAnalytics?.triggers?.length > 0 ? (
                <div className="space-y-4">
                  {advancedAnalytics.triggers.map((trigger, idx) => (
                    <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium mr-2 ${
                              trigger.type === 'symptom' ? 'bg-purple-100 text-purple-700' :
                              trigger.type === 'sleep' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {trigger.type}
                            </span>
                            <h3 className="font-semibold text-gray-900">{trigger.trigger}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{trigger.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-2xl font-bold ${trigger.impact < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {trigger.impact > 0 ? '+' : ''}{trigger.impact}
                          </p>
                          <p className="text-xs text-gray-500">mood impact</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-xs text-gray-500">Observed {trigger.frequency} times</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No significant triggers identified yet.</p>
                  <p className="text-sm mt-1">Continue logging to help identify patterns that affect your mood.</p>
                </div>
              )}
            </div>

            {/* Common Symptoms Impact */}
            {advancedAnalytics?.symptom_mood_correlation?.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptom Impact on Mood</h2>
                <div className="space-y-3">
                  {advancedAnalytics.symptom_mood_correlation.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          item.impact && item.impact < -1 ? 'bg-red-500' :
                          item.impact && item.impact < 0 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">{item.symptom}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{item.occurrence_count}x</span>
                        {item.impact !== null && (
                          <span className={`text-sm font-bold ${
                            item.impact < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.impact > 0 ? '+' : ''}{item.impact}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Correlations Tab */}
        {activeTab === 'correlations' && (
          <div className="space-y-6">
            {/* Sleep-Mood Correlation */}
            {advancedAnalytics?.sleep_mood_correlation && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Moon className="h-5 w-5 mr-2 text-blue-500" />
                  Sleep & Mood Correlation
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={advancedAnalytics.sleep_mood_correlation.data.filter(d => d.avg_mood !== null)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(value) => [value, 'Avg Mood']}
                        />
                        <Bar dataKey="avg_mood" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center">
                    {advancedAnalytics.sleep_mood_correlation.optimal_sleep && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Optimal Sleep Range:</span>{' '}
                          {advancedAnalytics.sleep_mood_correlation.optimal_sleep}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Your mood tends to be best with this amount of sleep
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {advancedAnalytics.sleep_mood_correlation.data
                        .filter(d => d.count > 0)
                        .map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.range}</span>
                            <span className="font-medium">
                              {item.avg_mood !== null ? `${item.avg_mood}/10` : 'N/A'} 
                              <span className="text-gray-400 ml-1">({item.count})</span>
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medication Impact */}
            {advancedAnalytics?.medication_impact && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-green-500" />
                  Medication Impact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-700 mb-1">With Medication</p>
                    <p className="text-3xl font-bold text-green-800">
                      {advancedAnalytics.medication_impact.with_medication.average_mood}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {advancedAnalytics.medication_impact.with_medication.count} days
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-700 mb-1">Without Medication</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {advancedAnalytics.medication_impact.without_medication.average_mood}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {advancedAnalytics.medication_impact.without_medication.count} days
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${
                    advancedAnalytics.medication_impact.difference > 0 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <p className="text-sm text-gray-700 mb-1">Difference</p>
                    <p className={`text-3xl font-bold ${
                      advancedAnalytics.medication_impact.difference > 0 ? 'text-blue-800' : 'text-orange-800'
                    }`}>
                      {advancedAnalytics.medication_impact.difference > 0 ? '+' : ''}
                      {advancedAnalytics.medication_impact.difference}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {advancedAnalytics.medication_impact.difference > 0 
                        ? 'Medication helps!' 
                        : 'Review with doctor'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sleep vs Mood Scatter Visualization */}
            {chartData.some(d => d.sleep > 0) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sleep & Mood Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.filter(d => d.sleep > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 12]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="mood" stroke="#8b5cf6" strokeWidth={2} name="Mood" dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} name="Sleep (hrs)" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Common Symptoms - Always visible at bottom */}
        {analytics.most_common_symptoms.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Frequent Symptoms</h2>
            <div className="space-y-3">
              {analytics.most_common_symptoms.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.symptom.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(item.count / analytics.total_logs) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {item.count}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Insights;
