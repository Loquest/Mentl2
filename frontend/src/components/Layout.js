import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Heart, Home, PenLine, BarChart3, MessageCircle, BookOpen, LogOut, User, Users, Utensils, Moon, Sun } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    { name: 'Nutrition', path: '/nutrition', icon: Utensils },
    { name: 'AI Chat', path: '/chat', icon: MessageCircle },
    { name: 'Library', path: '/library', icon: BookOpen },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      {/* Sidebar - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex flex-col flex-grow border-r pt-5 pb-4 overflow-y-auto transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className={`ml-3 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mentl</span>
          </div>

          {/* User Info */}
          <div className="px-4 mb-5" data-testid="user-info">
            <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700' : 'bg-gradient-to-r from-purple-100 to-pink-100'}`}>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
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
                      : isDark 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-purple-50'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & Profile & Logout */}
          <div className={`px-2 pt-4 border-t space-y-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                isDark 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
              }`}
              data-testid="theme-toggle"
            >
              {isDark ? (
                <Sun className={`mr-3 h-5 w-5 ${isDark ? 'text-yellow-400' : 'text-gray-500'}`} />
              ) : (
                <Moon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-purple-600" />
              )}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <Link
              to="/caregivers"
              className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                location.pathname === '/caregivers'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
              }`}
              data-testid="profile-button"
            >
              <User className={`mr-3 h-5 w-5 ${location.pathname === '/settings' ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500 group-hover:text-purple-600'}`} />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                isDark 
                  ? 'text-gray-300 hover:bg-red-900/30 hover:text-red-400'
                  : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
              }`}
              data-testid="logout-button"
            >
              <LogOut className={`mr-3 h-5 w-5 ${isDark ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-500 group-hover:text-red-600'}`} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-10 border-b transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className={`ml-2 text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mentl</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition ${isDark ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'}`}
              data-testid="mobile-theme-toggle"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              to="/caregivers"
              className={`p-2 rounded-lg transition ${isDark ? 'text-gray-400 hover:text-pink-400 hover:bg-gray-700' : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'}`}
              data-testid="mobile-caregivers-button"
            >
              <Users className="h-5 w-5" />
            </Link>
            <Link
              to="/settings"
              className={`p-2 rounded-lg transition ${isDark ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'}`}
              data-testid="mobile-profile-button"
            >
              <User className="h-5 w-5" />
            </Link>
            <button 
              onClick={handleLogout} 
              className={`p-2 rounded-lg transition ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
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
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 border-t z-10 transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center px-3 py-2 text-xs font-medium rounded-lg transition ${
                  isActive ? 'text-purple-600' : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-purple-600' : isDark ? 'text-gray-500' : 'text-gray-500'}`} />
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