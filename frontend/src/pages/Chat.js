import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import { Send, Bot, User, AlertCircle, Trash2, AlertTriangle, Phone } from 'lucide-react';

const Chat = () => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [crisisAlert, setCrisisAlert] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await api.get('/chat/history?limit=50');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setCrisisAlert(null);

    try {
      const response = await api.post('/chat', { message: input.trim() });
      
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp,
        crisis_detected: response.data.crisis_detected,
        crisis_level: response.data.crisis_level
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Show crisis alert if detected
      if (response.data.crisis_detected) {
        setCrisisAlert(response.data.crisis_level);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      try {
        await api.delete('/chat/history');
        setMessages([]);
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loadingHistory) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading chat...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 h-[calc(100vh-200px)] lg:h-[calc(100vh-100px)] max-w-4xl mx-auto flex flex-col" data-testid="chat-page">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Chat Assistant</h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>I&apos;m here to support you 24/7</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className={`flex items-center px-3 py-2 text-sm rounded-lg transition ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
              data-testid="clear-history-button"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </button>
          )}
        </div>

        {/* Active Crisis Alert */}
        {crisisAlert && (
          <div className={`mb-4 p-4 rounded-lg border-2 ${
            crisisAlert === 'critical' 
              ? isDark ? 'bg-red-900/30 border-red-600' : 'bg-red-100 border-red-500' 
              : crisisAlert === 'high'
              ? isDark ? 'bg-orange-900/30 border-orange-600' : 'bg-orange-100 border-orange-500'
              : isDark ? 'bg-yellow-900/30 border-yellow-600' : 'bg-yellow-100 border-yellow-500'
          }`} data-testid="active-crisis-alert">
            <div className="flex items-center">
              <AlertTriangle className={`h-6 w-6 mr-3 ${
                crisisAlert === 'critical' ? 'text-red-500' : 
                crisisAlert === 'high' ? 'text-orange-500' : 'text-yellow-500'
              }`} />
              <div className="flex-1">
                <p className={`font-bold ${
                  crisisAlert === 'critical' ? isDark ? 'text-red-400' : 'text-red-800' : 
                  crisisAlert === 'high' ? isDark ? 'text-orange-400' : 'text-orange-800' : isDark ? 'text-yellow-400' : 'text-yellow-800'
                }`}>
                  {crisisAlert === 'critical' ? 'Crisis Support Activated' : 
                   crisisAlert === 'high' ? 'We&apos;re Here For You' : 'Support Available'}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Your caregivers have been notified and will reach out soon.</p>
              </div>
              <a 
                href="tel:988" 
                className={`flex items-center px-4 py-2 rounded-lg shadow-sm hover:shadow transition ${isDark ? 'bg-gray-700' : 'bg-white'}`}
              >
                <Phone className="h-4 w-4 mr-2 text-green-500" />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Call 988</span>
              </a>
            </div>
          </div>
        )}

        {/* Crisis Warning */}
        <div className={`rounded-lg p-4 mb-4 border ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`} data-testid="crisis-warning">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className={`text-sm ${isDark ? 'text-red-300' : 'text-red-800'}`}>
              <p className="font-semibold mb-1">Crisis Resources Available 24/7</p>
              <p>If you&apos;re in crisis: <strong>Call 988</strong> (Suicide & Crisis Lifeline) or text <strong>HOME to 741741</strong></p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className={`flex-1 rounded-xl shadow-md overflow-hidden flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-full mb-4">
                  <Bot className="h-12 w-12 text-white" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Start a Conversation</h2>
                <p className={`max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  I&apos;m here to provide support, answer questions about mental health, and help you with coping strategies.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    onClick={() => setInput("I'm feeling anxious today")}
                    className={`text-left px-4 py-3 rounded-lg text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-purple-50 hover:bg-purple-100 text-gray-700'}`}
                  >
                    I&apos;m feeling anxious today
                  </button>
                  <button
                    onClick={() => setInput("What are some coping strategies for depression?")}
                    className={`text-left px-4 py-3 rounded-lg text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-purple-50 hover:bg-purple-100 text-gray-700'}`}
                  >
                    What are coping strategies?
                  </button>
                  <button
                    onClick={() => setInput("How can I improve my sleep?")}
                    className={`text-left px-4 py-3 rounded-lg text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-purple-50 hover:bg-purple-100 text-gray-700'}`}
                  >
                    How can I improve sleep?
                  </button>
                  <button
                    onClick={() => setInput("Tell me about mindfulness")}
                    className={`text-left px-4 py-3 rounded-lg text-sm transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-purple-50 hover:bg-purple-100 text-gray-700'}`}
                  >
                    Tell me about mindfulness
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.role}`}
                  >
                    <div className={`flex space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-purple-500' 
                          : message.isError 
                          ? 'bg-red-500'
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      } p-2 rounded-full h-10 w-10 flex items-center justify-center`}>
                        {message.role === 'user' ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className={`rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : message.isError
                            ? isDark ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-900 border border-red-200'
                            : isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className={`text-xs mt-1 px-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex space-x-3 max-w-[80%]">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className={`rounded-lg px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex space-x-2">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: '0ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: '150ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className={`border-t p-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <form onSubmit={handleSend} className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                disabled={loading}
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                data-testid="send-button"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              This AI assistant is not a replacement for professional care. In crisis, call 988.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;