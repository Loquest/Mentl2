import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Send, Bot, User, AlertCircle, Trash2, AlertTriangle, Phone } from 'lucide-react';

const Chat = () => {
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
            <h1 className="text-3xl font-bold text-gray-900">AI Chat Assistant</h1>
            <p className="mt-1 text-gray-600">I&apos;m here to support you 24/7</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
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
              ? 'bg-red-100 border-red-500' 
              : crisisAlert === 'high'
              ? 'bg-orange-100 border-orange-500'
              : 'bg-yellow-100 border-yellow-500'
          }`} data-testid="active-crisis-alert">
            <div className="flex items-center">
              <AlertTriangle className={`h-6 w-6 mr-3 ${
                crisisAlert === 'critical' ? 'text-red-600' : 
                crisisAlert === 'high' ? 'text-orange-600' : 'text-yellow-600'
              }`} />
              <div className="flex-1">
                <p className={`font-bold ${
                  crisisAlert === 'critical' ? 'text-red-800' : 
                  crisisAlert === 'high' ? 'text-orange-800' : 'text-yellow-800'
                }`}>
                  {crisisAlert === 'critical' ? 'Crisis Support Activated' : 
                   crisisAlert === 'high' ? 'We&apos;re Here For You' : 'Support Available'}
                </p>
                <p className="text-sm text-gray-700">Your caregivers have been notified and will reach out soon.</p>
              </div>
              <a 
                href="tel:988" 
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow transition"
              >
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-semibold text-gray-900">Call 988</span>
              </a>
            </div>
          </div>
        )}

        {/* Crisis Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" data-testid="crisis-warning">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Crisis Resources Available 24/7</p>
              <p>If you&apos;re in crisis: <strong>Call 988</strong> (Suicide & Crisis Lifeline) or text <strong>HOME to 741741</strong></p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="messages-container">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-full mb-4">
                  <Bot className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Start a Conversation</h2>
                <p className="text-gray-600 max-w-md">
                  I&apos;m here to provide support, answer questions about mental health, and help you with coping strategies.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    onClick={() => setInput("I'm feeling anxious today")}
                    className="text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-gray-700 transition"
                  >
                    I&apos;m feeling anxious today
                  </button>
                  <button
                    onClick={() => setInput("What are some coping strategies for depression?")}
                    className="text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-gray-700 transition"
                  >
                    What are coping strategies?
                  </button>
                  <button
                    onClick={() => setInput("How can I improve my sleep?")}
                    className="text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-gray-700 transition"
                  >
                    How can I improve sleep?
                  </button>
                  <button
                    onClick={() => setInput("Tell me about mindfulness")}
                    className="text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-gray-700 transition"
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
                            ? 'bg-red-50 text-red-900 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-1">
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
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSend} className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <p className="text-xs text-gray-500 mt-2 text-center">
              This AI assistant is not a replacement for professional care. In crisis, call 988.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;