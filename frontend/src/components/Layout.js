import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Home, PenLine, BarChart3, MessageCircle, BookOpen, Settings, LogOut, User, Users } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Log Mood', path: '/log-mood', icon: PenLine },
    { name: 'Insights', path: '/insights', icon: BarChart3 },
    { name: 'AI Chat', path: '/chat', icon: MessageCircle },
    { name: 'Library', path: '/library', icon: BookOpen },
    { name: 'Caregivers', path: '/caregivers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">MindCare</span>
          </div>

          {/* User Info */}
          <div className="px-4 mb-5" data-testid="user-info">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1" data-testid="navigation-menu">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Profile & Logout Buttons */}
          <div className="px-2 pt-4 border-t border-gray-200 space-y-1">
            <Link
              to="/caregivers"
              className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                location.pathname === '/caregivers'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
              }`}
              data-testid="caregivers-quick-link"
            >
              <Users className={`mr-3 h-5 w-5 ${location.pathname === '/caregivers' ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'}`} />
              Caregivers
            </Link>
            <Link
              to="/settings"
              className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                location.pathname === '/settings'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
              }`}
              data-testid="profile-button"
            >
              <User className={`mr-3 h-5 w-5 ${location.pathname === '/settings' ? 'text-white' : 'text-gray-500 group-hover:text-purple-600'}`} />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
              data-testid="logout-button"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-500 group-hover:text-red-600" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-lg font-bold text-gray-900">MindCare</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/settings"
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
              data-testid="mobile-profile-button"
            >
              <User className="h-5 w-5" />
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 pt-20 lg:pt-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg transition ${
                  isActive ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;