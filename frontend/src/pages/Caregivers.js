import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Layout from '../components/Layout';
import api from '../utils/api';
import { 
  Users, UserPlus, Mail, Check, X, Clock, Shield, 
  Eye, Bell, Trash2, ChevronRight, AlertCircle, Heart,
  Activity, Calendar, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

const Caregivers = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('my-caregivers');
  
  // My Caregivers (as patient)
  const [caregivers, setCaregivers] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  
  // My Patients (as caregiver)
  const [patients, setPatients] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  
  // Selected patient for viewing
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  
  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState({
    view_mood_logs: true,
    view_analytics: true,
    receive_alerts: true
  });
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCaregiverData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all caregiver-related data in parallel
      const [
        caregiversRes,
        sentInvRes,
        patientsRes,
        receivedInvRes
      ] = await Promise.all([
        api.get('/caregivers'),
        api.get('/caregivers/invitations/sent'),
        api.get('/caregivers/patients'),
        api.get('/caregivers/invitations/received')
      ]);
      
      setCaregivers(caregiversRes.data.caregivers || []);
      setSentInvitations(sentInvRes.data.invitations || []);
      setPatients(patientsRes.data.patients || []);
      setReceivedInvitations(receivedInvRes.data.invitations || []);
    } catch (err) {
      console.error('Error fetching caregiver data:', err);
      setError('Failed to load caregiver data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaregiverData();
  }, [fetchCaregiverData]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);
    
    try {
      await api.post('/caregivers/invite', {
        caregiver_email: inviteEmail,
        permissions: invitePermissions
      });
      
      setSuccess('Invitation sent successfully!');
      setInviteEmail('');
      setShowInviteForm(false);
      fetchCaregiverData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    setActionLoading(true);
    try {
      await api.post(`/caregivers/invitations/${invitationId}/accept`);
      setSuccess('Invitation accepted! You can now view their mood data.');
      fetchCaregiverData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    setActionLoading(true);
    try {
      await api.post(`/caregivers/invitations/${invitationId}/reject`);
      setSuccess('Invitation rejected.');
      fetchCaregiverData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    setActionLoading(true);
    try {
      await api.delete(`/caregivers/invitations/${invitationId}`);
      setSuccess('Invitation cancelled.');
      fetchCaregiverData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCaregiver = async (relationshipId) => {
    if (!window.confirm('Are you sure you want to remove this caregiver?')) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/caregivers/${relationshipId}`);
      setSuccess('Caregiver removed.');
      fetchCaregiverData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove caregiver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setPatientData(null);
    setPatientLoading(true);
    try {
      const [moodLogsRes, analyticsRes] = await Promise.all([
        api.get(`/caregivers/patients/${patient.patient_id}/mood-logs?limit=14`),
        api.get(`/caregivers/patients/${patient.patient_id}/analytics?days=30`)
      ]);
      
      setPatientData({
        moodLogs: moodLogsRes.data.mood_logs || [],
        analytics: analyticsRes.data
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load patient data');
    } finally {
      setPatientLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getMoodColor = (rating) => {
    if (rating >= 7) return isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
    if (rating >= 4) return isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
    return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading caregiver data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" data-testid="caregivers-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Caregiver Network</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Connect with trusted caregivers and family members</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className={`px-4 py-3 rounded-lg mb-6 flex items-center ${isDark ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`} data-testid="success-message">
            <Check className="h-5 w-5 mr-2" />
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {error && (
          <div className={`px-4 py-3 rounded-lg mb-6 flex items-center ${isDark ? 'bg-red-900/30 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`} data-testid="error-message">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`flex space-x-2 mb-6 border-b overflow-x-auto ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => { setActiveTab('my-caregivers'); setSelectedPatient(null); }}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
              activeTab === 'my-caregivers'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="my-caregivers-tab"
          >
            <Users className="h-4 w-4 inline mr-2" />
            My Caregivers
          </button>
          <button
            onClick={() => { setActiveTab('my-patients'); setSelectedPatient(null); }}
            className={`px-6 py-3 font-semibold whitespace-nowrap transition ${
              activeTab === 'my-patients'
                ? 'border-b-2 border-purple-500 text-purple-500'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="my-patients-tab"
          >
            <Heart className="h-4 w-4 inline mr-2" />
            People I Care For
            {receivedInvitations.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {receivedInvitations.length}
              </span>
            )}
          </button>
        </div>

        {/* My Caregivers Tab */}
        {activeTab === 'my-caregivers' && (
          <div className="space-y-6">
            {/* Invite Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center"
                data-testid="invite-caregiver-btn"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Invite Caregiver
              </button>
            </div>

            {/* Invite Form */}
            {showInviteForm && (
              <div className={`rounded-xl shadow-md p-6 border-2 ${isDark ? 'bg-gray-800 border-purple-700' : 'bg-white border-purple-200'}`} data-testid="invite-form">
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Invite a Caregiver</h3>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Caregiver&apos;s Email Address
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                        placeholder="caregiver@example.com"
                        data-testid="invite-email-input"
                      />
                    </div>
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      They will receive an invitation to view your mood data
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Permissions
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'view_mood_logs', label: 'View Mood Logs', icon: Eye, desc: 'See your daily mood entries' },
                        { key: 'view_analytics', label: 'View Analytics', icon: Activity, desc: 'Access your mood trends and insights' },
                        { key: 'receive_alerts', label: 'Receive Alerts', icon: Bell, desc: 'Get notified about concerning patterns' }
                      ].map((perm) => (
                        <label
                          key={perm.key}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                            invitePermissions[perm.key]
                              ? isDark ? 'border-purple-500 bg-purple-900/20' : 'border-purple-300 bg-purple-50'
                              : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={invitePermissions[perm.key]}
                            onChange={(e) => setInvitePermissions(prev => ({
                              ...prev,
                              [perm.key]: e.target.checked
                            }))}
                            className="sr-only"
                          />
                          <perm.icon className={`h-5 w-5 mr-3 ${
                            invitePermissions[perm.key] ? 'text-purple-600' : isDark ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{perm.label}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{perm.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            invitePermissions[perm.key]
                              ? 'bg-purple-500 border-purple-500'
                              : isDark ? 'border-gray-600' : 'border-gray-300'
                          }`}>
                            {invitePermissions[perm.key] && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className={`flex-1 px-4 py-2 border rounded-lg transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !inviteEmail}
                      className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition disabled:opacity-50"
                      data-testid="send-invite-btn"
                    >
                      {actionLoading ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Pending Invitations (Sent) */}
            {sentInvitations.filter(inv => inv.status === 'pending').length > 0 && (
              <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                  Pending Invitations
                </h3>
                <div className="space-y-3">
                  {sentInvitations.filter(inv => inv.status === 'pending').map((inv) => (
                    <div key={inv.id} className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{inv.caregiver_email}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Invitation sent • Waiting for response</p>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        disabled={actionLoading}
                        className={`p-2 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        title="Cancel invitation"
                        data-testid={`cancel-invite-${inv.id}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Caregivers */}
            <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Shield className="h-5 w-5 mr-2 text-purple-500" />
                My Caregivers
              </h3>
              
              {caregivers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No caregivers yet</p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Invite a trusted family member or friend to help support your mental health journey
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {caregivers.map((caregiver) => (
                    <div key={caregiver.id} className={`flex items-center justify-between p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`} data-testid={`caregiver-${caregiver.id}`}>
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg">
                            {caregiver.caregiver_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{caregiver.caregiver_name}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{caregiver.caregiver_email}</p>
                          <div className="flex gap-2 mt-1">
                            {caregiver.permissions?.view_mood_logs && (
                              <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>Logs</span>
                            )}
                            {caregiver.permissions?.view_analytics && (
                              <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>Analytics</span>
                            )}
                            {caregiver.permissions?.receive_alerts && (
                              <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>Alerts</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCaregiver(caregiver.id)}
                        disabled={actionLoading}
                        className={`p-2 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        title="Remove caregiver"
                        data-testid={`remove-caregiver-${caregiver.id}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Patients Tab */}
        {activeTab === 'my-patients' && !selectedPatient && (
          <div className="space-y-6">
            {/* Received Invitations */}
            {receivedInvitations.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-blue-500" />
                  New Invitations
                </h3>
                <div className="space-y-3">
                  {receivedInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid={`invitation-${inv.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{inv.patient_name}</p>
                          <p className="text-sm text-gray-500">{inv.patient_email}</p>
                          <p className="text-sm text-blue-600 mt-1">Wants you to be their caregiver</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptInvitation(inv.id)}
                            disabled={actionLoading}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition flex items-center"
                            data-testid={`accept-invite-${inv.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(inv.id)}
                            disabled={actionLoading}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition flex items-center"
                            data-testid={`reject-invite-${inv.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* People I Care For */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-pink-500" />
                People I Care For
              </h3>
              
              {patients.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">You&apos;re not caring for anyone yet</p>
                  <p className="text-sm text-gray-500">
                    When someone invites you as their caregiver, you&apos;ll see their invitation here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleViewPatient(patient)}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-left hover:border-purple-300 hover:shadow-md transition group"
                      data-testid={`patient-card-${patient.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-pink-500 to-red-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                            <span className="text-white font-bold text-lg">
                              {patient.patient_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{patient.patient_name}</p>
                            <p className="text-sm text-gray-500">{patient.patient_email}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patient Detail View */}
        {activeTab === 'my-patients' && selectedPatient && (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => { setSelectedPatient(null); setPatientData(null); }}
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
              data-testid="back-to-patients"
            >
              <ChevronRight className="h-5 w-5 rotate-180 mr-1" />
              Back to all patients
            </button>

            {/* Patient Header */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-pink-500 to-red-500 w-16 h-16 rounded-full flex items-center justify-center mr-6">
                  <span className="text-white font-bold text-2xl">
                    {selectedPatient.patient_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.patient_name}</h2>
                  <p className="text-gray-500">{selectedPatient.patient_email}</p>
                </div>
              </div>
            </div>

            {patientData ? (
              <>
                {/* Analytics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-sm text-gray-500 mb-1">Average Mood (30 days)</p>
                    <p className="text-3xl font-bold text-gray-900">{patientData.analytics.average_mood}/10</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-sm text-gray-500 mb-1">Mood Trend</p>
                    <div className="flex items-center">
                      {getTrendIcon(patientData.analytics.mood_trend)}
                      <span className="text-xl font-bold text-gray-900 ml-2 capitalize">
                        {patientData.analytics.mood_trend}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Logs</p>
                    <p className="text-3xl font-bold text-gray-900">{patientData.analytics.total_logs}</p>
                  </div>
                </div>

                {/* Concerns */}
                {patientData.analytics.recent_concerns?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Recent Concerns
                    </h3>
                    <div className="space-y-2">
                      {patientData.analytics.recent_concerns.map((concern, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${
                          concern.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <p className={`font-medium ${
                            concern.severity === 'high' ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {concern.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Mood Logs */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                    Recent Mood Logs
                  </h3>
                  
                  {patientData.moodLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No mood logs available</p>
                  ) : (
                    <div className="space-y-2">
                      {patientData.moodLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getMoodColor(log.mood_rating)}`}>
                              {log.mood_rating}/10
                            </span>
                            <span className="ml-3 text-gray-600">{log.date}</span>
                            {log.mood_tag && (
                              <span className="ml-2 text-sm text-gray-500 capitalize">• {log.mood_tag}</span>
                            )}
                          </div>
                          {log.medication_taken !== undefined && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              log.medication_taken ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {log.medication_taken ? 'Meds taken' : 'Meds missed'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Common Symptoms */}
                {patientData.analytics.most_common_symptoms?.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Symptoms</h3>
                    <div className="flex flex-wrap gap-2">
                      {patientData.analytics.most_common_symptoms.map((symptom, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {symptom.symptom.replace(/_/g, ' ')} ({symptom.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : patientLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-800">Unable to load patient data. Please try again.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Caregivers;
