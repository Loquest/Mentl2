import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ActivitySuggestions from '../components/ActivitySuggestions';
import api from '../utils/api';
import { PenLine, MessageCircle, TrendingUp, BookOpen, Smile, Meh, Frown, Calendar, Users, UserPlus, Heart, Bell, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [caregiverData, setCaregiverData] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchDashboardData = useCallback(async () => {
    try {
      // Get recent logs
      const logsResponse = await api.get('/mood-logs?limit=7');
      setRecentLogs(logsResponse.data);
      
      // Check if today's log exists
      const todayLogEntry = logsResponse.data.find(log => log.date === today);
      setTodayLog(todayLogEntry);

      // Get analytics
      const analyticsResponse = await api.get('/mood-logs/analytics/summary?days=30');
      setAnalytics(analyticsResponse.data);

      // Get caregiver data
      try {
        const [caregiversRes, patientsRes, invitationsRes] = await Promise.all([
          api.get('/caregivers'),
          api.get('/caregivers/patients'),
          api.get('/caregivers/invitations/received')
        ]);
        setCaregiverData({
          caregivers: caregiversRes.data.caregivers || [],
          patients: patientsRes.data.patients || [],
          pendingInvitations: invitationsRes.data.invitations || []
        });
      } catch (err) {
        console.error('Error fetching caregiver data:', err);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getMoodEmoji = (rating) => {
    if (rating >= 7) return <Smile className="h-8 w-8 text-green-500" />;
    if (rating >= 4) return <Meh className="h-8 w-8 text-yellow-500" />;
    return <Frown className="h-8 w-8 text-red-500" />;
  };

  const getMoodColor = (rating) => {
    if (rating >= 7) return 'bg-green-100 border-green-300';
    if (rating >= 4) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-testid="dashboard">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-gray-600">How are you feeling today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/log-mood"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-purple-300"
            data-testid="quick-action-log-mood"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Log Mood</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">Today</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <PenLine className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            {todayLog ? (
              <div className="mt-4 text-sm text-green-600 font-medium">✓ Logged</div>
            ) : (
              <div className="mt-4 text-sm text-gray-500">Not logged yet</div>
            )}
          </Link>

          <Link
            to="/chat"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-pink-300"
            data-testid="quick-action-chat"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Chat</p>
                <p className="text-2xl font-bold text-pink-600 mt-1">Talk</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <MessageCircle className="h-6 w-6 text-pink-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">Get support anytime</div>
          </Link>

          <Link
            to="/insights"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-300"
            data-testid="quick-action-insights"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insights</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{analytics?.total_logs || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">Logs tracked</div>
          </Link>

          <Link
            to="/library"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-2 border-transparent hover:border-green-300"
            data-testid="quick-action-library"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Library</p>
                <p className="text-2xl font-bold text-green-600 mt-1">Learn</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">Resources & guides</div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Mood */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6" data-testid="todays-mood-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Mood</h2>
              {todayLog ? (
                <div className={`border-2 rounded-lg p-4 ${getMoodColor(todayLog.mood_rating)}`}>
                  <div className="flex items-center justify-between mb-3">
                    {getMoodEmoji(todayLog.mood_rating)}
                    <span className="text-3xl font-bold text-gray-900">{todayLog.mood_rating}/10</span>
                  </div>
                  {todayLog.mood_tag && (
                    <p className="text-sm text-gray-700 font-medium capitalize">{todayLog.mood_tag}</p>
                  )}
                  {todayLog.notes && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{todayLog.notes}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">You haven&apos;t logged your mood today</p>
                  <Link
                    to="/log-mood"
                    className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
                  >
                    Log Now
                  </Link>
                </div>
              )}
            </div>

            {/* Activity Suggestions - Right after Today's Mood */}
            <div className="mt-6">
              <ActivitySuggestions />
            </div>

            {/* Mood Trend */}
            {analytics && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6" data-testid="mood-trend-card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">30-Day Overview</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Mood</span>
                    <span className="text-lg font-bold text-gray-900">{analytics.average_mood}/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trend</span>
                    <span className={`text-lg font-bold capitalize ${getTrendColor(analytics.mood_trend)}`}>
                      {analytics.mood_trend}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Logs</span>
                    <span className="text-lg font-bold text-gray-900">{analytics.total_logs}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Logs & Insights */}
          <div className="lg:col-span-2 space-y-6">

            {/* Insights */}
            {analytics && analytics.insights.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6" data-testid="insights-card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Insights & Suggestions</h2>
                <div className="space-y-3">
                  {analytics.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex-shrink-0">
                        <div className="bg-blue-100 rounded-full p-1">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md p-6" data-testid="recent-activity-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <Link to="/insights" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </Link>
              </div>
              {recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        {getMoodEmoji(log.mood_rating)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.date}</p>
                          {log.mood_tag && (
                            <p className="text-xs text-gray-500 capitalize">{log.mood_tag}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{log.mood_rating}/10</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No mood logs yet. Start tracking your mood to see insights!</p>
                </div>
              )}
            </div>

            {/* Caregiver Network Section */}
            <div className="bg-white rounded-xl shadow-md p-6" data-testid="caregiver-network-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-pink-500" />
                  Caregiver Network
                </h2>
                <Link to="/caregivers" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center">
                  Manage
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {caregiverData ? (
                <div className="space-y-4">
                  {/* Pending Invitations Alert */}
                  {caregiverData.pendingInvitations.length > 0 && (
                    <Link
                      to="/caregivers"
                      className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-blue-800">
                            {caregiverData.pendingInvitations.length} Pending Invitation{caregiverData.pendingInvitations.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-sm text-blue-600">Someone wants you to be their caregiver</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <div className="flex items-center mb-2">
                        <Users className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm text-gray-600">My Caregivers</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{caregiverData.caregivers.length}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-100">
                      <div className="flex items-center mb-2">
                        <Heart className="h-4 w-4 text-pink-600 mr-2" />
                        <span className="text-sm text-gray-600">People I Care For</span>
                      </div>
                      <p className="text-2xl font-bold text-pink-600">{caregiverData.patients.length}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {caregiverData.caregivers.length === 0 && caregiverData.patients.length === 0 && caregiverData.pendingInvitations.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-3">Connect with trusted caregivers or family members</p>
                      <Link
                        to="/caregivers"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Caregiver
                      </Link>
                    </div>
                  )}

                  {/* Recent Caregivers/Patients List */}
                  {(caregiverData.caregivers.length > 0 || caregiverData.patients.length > 0) && (
                    <div className="space-y-2">
                      {caregiverData.caregivers.slice(0, 2).map((caregiver) => (
                        <div key={caregiver.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                          <div className="bg-purple-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">
                              {caregiver.caregiver_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{caregiver.caregiver_name}</p>
                            <p className="text-xs text-gray-500">Caregiver</p>
                          </div>
                        </div>
                      ))}
                      {caregiverData.patients.slice(0, 2).map((patient) => (
                        <div key={patient.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                          <div className="bg-pink-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-bold">
                              {patient.patient_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{patient.patient_name}</p>
                            <p className="text-xs text-gray-500">You care for them</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;