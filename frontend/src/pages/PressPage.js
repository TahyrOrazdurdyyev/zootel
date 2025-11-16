import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import {
  NewspaperIcon,
  CalendarDaysIcon,
  TagIcon,
  ArrowRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const PressPage = () => {
  const [pressReleases, setPressReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadPressReleases();
  }, []);

  const loadPressReleases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/public/press');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPressReleases(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load press releases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique tags for filters
  const allTags = [...new Set(pressReleases.flatMap(release => release.tags || []))];

  // Filter press releases based on selected tag
  const filteredReleases = pressReleases.filter(release => {
    if (!selectedTag) return true;
    return release.tags && release.tags.includes(selectedTag);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Press Center
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Latest news, announcements, and updates from Zootel. 
              Stay informed about our journey to revolutionize pet care.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Media Kit & Contact */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Kit</h2>
              <p className="text-gray-600 mb-4">
                Download our media kit for logos, company information, and press materials.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Download Media Kit
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Press Contact</h2>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> press@zootel.shop</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Topic
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Press Releases */}
        {filteredReleases.length > 0 ? (
          <div className="space-y-8">
            {filteredReleases.map((release, index) => (
              <article key={release.id} className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                index === 0 ? 'md:flex' : ''
              }`}>
                {index === 0 && release.image_url && (
                  <div className="md:w-1/3">
                    <img
                      src={release.image_url}
                      alt={release.title}
                      className="h-48 md:h-full w-full object-cover"
                    />
                  </div>
                )}
                
                <div className={`p-6 ${index === 0 && release.image_url ? 'md:w-2/3' : ''}`}>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    {new Date(release.published_at || release.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {release.tags && release.tags.length > 0 && (
                      <>
                        <TagIcon className="h-4 w-4 ml-4 mr-1" />
                        <span>{release.tags.slice(0, 2).join(', ')}</span>
                      </>
                    )}
                  </div>

                  <h2 className={`font-bold text-gray-900 mb-2 ${
                    index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'
                  }`}>
                    {release.title}
                  </h2>

                  {release.subtitle && (
                    <h3 className="text-lg text-gray-600 mb-3">
                      {release.subtitle}
                    </h3>
                  )}

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {release.summary || release.content.substring(0, 200) + '...'}
                  </p>

                  <Link
                    to={`/press/${release.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read Full Release
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>

                {index !== 0 && release.image_url && (
                  <div className="p-6 pt-0">
                    <img
                      src={release.image_url}
                      alt={release.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <NewspaperIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No press releases</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedTag 
                ? 'No press releases match your current filter. Try selecting a different topic.'
                : 'No press releases available at the moment. Check back soon for updates!'
              }
            </p>
          </div>
        )}

        {/* Company Stats */}
        <div className="mt-16 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Zootel by the Numbers</h2>
            <p className="text-orange-100">
              Key statistics about our growth and impact in the pet care industry
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-orange-100">Pet Owners</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-orange-100">Service Providers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">25,000+</div>
              <div className="text-orange-100">Services Booked</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-orange-100">Cities Served</div>
            </div>
          </div>
        </div>

        {/* Awards & Recognition */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Awards & Recognition
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Best Pet Tech Startup 2024</h3>
              <p className="text-gray-600 text-sm">Pet Industry Awards</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Top 10 Startups to Watch</h3>
              <p className="text-gray-600 text-sm">Tech Crunch 2024</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Innovation in Pet Care</h3>
              <p className="text-gray-600 text-sm">Pet Business Magazine</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PressPage;
