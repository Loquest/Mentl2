import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { BookOpen, Search, ExternalLink, Filter } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'bipolar', label: 'Bipolar' },
  { id: 'adhd', label: 'ADHD' },
  { id: 'depression', label: 'Depression' },
  { id: 'ocd', label: 'OCD' },
  { id: 'coping', label: 'Coping Strategies' },
  { id: 'general', label: 'General' },
  { id: 'caregivers', label: 'For Caregivers' },
];

const CONTENT_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'article', label: 'Articles' },
  { id: 'video', label: 'Videos' },
  { id: 'audio', label: 'Audio' },
  { id: 'exercise', label: 'Exercises' },
];

const Library = () => {
  const { isDark } = useTheme();
  const [content, setContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, searchQuery, selectedCategory, selectedType]);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content?limit=100');
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = content;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.content_type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredContent(filtered);
  };

  const getTypeIcon = (type) => {
    const icons = {
      article: '📝',
      video: '🎥',
      audio: '🎧',
      exercise: '🧘'
    };
    return icons[type] || '📚';
  };

  const getCategoryColor = (category) => {
    const colors = {
      bipolar: 'bg-blue-100 text-blue-700',
      adhd: 'bg-green-100 text-green-700',
      depression: 'bg-purple-100 text-purple-700',
      ocd: 'bg-orange-100 text-orange-700',
      coping: 'bg-pink-100 text-pink-700',
      general: 'bg-gray-100 text-gray-700',
      caregivers: 'bg-yellow-100 text-yellow-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading library...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-testid="library-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Educational Library</h1>
          <p className="mt-2 text-gray-600">Explore resources to support your mental health journey</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              data-testid="search-input"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedCategory === cat.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid={`category-${cat.id}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedType === type.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    data-testid={`type-${type.id}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredContent.length}</span> of <span className="font-semibold">{content.length}</span> resources
          </p>
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="content-grid">
            {filteredContent.map((item) => (
              <a
                key={item.id}
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border-2 border-transparent hover:border-purple-300 group"
                data-testid={`content-item-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{getTypeIcon(item.content_type)}</span>
                  <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
                  {item.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {item.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                    {item.content_type}
                  </span>
                </div>
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="text-xs text-gray-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Library;