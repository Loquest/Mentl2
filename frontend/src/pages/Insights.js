import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Download } from 'lucide-react';

const Insights = () => {
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      const formattedStartDate = startDate.toISOString().split('T')[0];

      const [logsResponse, analyticsResponse] = await Promise.all([
        api.get(`/mood-logs?start_date=${formattedStartDate}&limit=1000`),
        api.get(`/mood-logs/analytics/summary?days=${timeRange}`)
      ]);

      setLogs(logsResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
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
    // Simple CSV export
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
            <p className="mt-4 text-gray-600">Loading insights...</p>
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
              <p className="mt-2 text-gray-600">Understand your mood patterns and trends</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <p className="mt-2 text-sm text-gray-500">
              in the last {timeRange} days
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6" data-testid="consistency-card">
            <p className="text-sm font-medium text-gray-600 mb-2">Consistency</p>
            <p className="text-4xl font-bold text-gray-900">
              {Math.round((analytics.total_logs / timeRange) * 100)}%
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {Math.round((analytics.total_logs / timeRange) * timeRange)} of {timeRange} days
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mood Trend Chart */}
          <div className="bg-white rounded-xl shadow-md p-6" data-testid="mood-trend-chart">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mood Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep vs Mood */}
          {chartData.some(d => d.sleep > 0) && (
            <div className="bg-white rounded-xl shadow-md p-6" data-testid="sleep-mood-chart">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sleep & Mood Correlation</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.filter(d => d.sleep > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="mood" fill="#8b5cf6" name="Mood" />
                  <Bar dataKey="sleep" fill="#ec4899" name="Sleep (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Insights */}
        {analytics.insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8" data-testid="insights-list">
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

        {/* Common Symptoms */}
        {analytics.most_common_symptoms.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6" data-testid="common-symptoms">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Common Symptoms</h2>
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
