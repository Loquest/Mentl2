// Dark mode utility classes
export const darkMode = {
  // Cards and containers
  card: (isDark) => isDark ? 'bg-gray-800' : 'bg-white',
  cardHover: (isDark) => isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg',
  
  // Text colors
  textPrimary: (isDark) => isDark ? 'text-white' : 'text-gray-900',
  textSecondary: (isDark) => isDark ? 'text-gray-400' : 'text-gray-600',
  textMuted: (isDark) => isDark ? 'text-gray-500' : 'text-gray-500',
  
  // Borders
  border: (isDark) => isDark ? 'border-gray-700' : 'border-gray-200',
  borderLight: (isDark) => isDark ? 'border-gray-600' : 'border-gray-300',
  
  // Inputs
  input: (isDark) => isDark 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500' 
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500',
  
  // Buttons
  buttonSecondary: (isDark) => isDark 
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600' 
    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
  
  // Backgrounds
  bgSubtle: (isDark) => isDark ? 'bg-gray-700/50' : 'bg-gray-50',
  bgAccent: (isDark) => isDark ? 'bg-gray-700' : 'bg-gray-100',
  
  // Shadows
  shadow: (isDark) => isDark ? 'shadow-lg shadow-black/20' : 'shadow-md',
};

export default darkMode;
