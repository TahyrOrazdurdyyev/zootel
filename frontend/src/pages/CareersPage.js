import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import {
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const CareersPage = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    loadCareers();
  }, []);

  const loadCareers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/public/careers');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCareers(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load careers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments and types for filters
  const departments = [...new Set(careers.map(career => career.department))];
  const jobTypes = [...new Set(careers.map(career => career.type))];

  // Filter careers based on selected filters
  const filteredCareers = careers.filter(career => {
    const matchesDepartment = !selectedDepartment || career.department === selectedDepartment;
    const matchesType = !selectedType || career.type === selectedType;
    return matchesDepartment && matchesType;
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
      <div className="bg-gradient-to-r from-orange-600 to-orange-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Join Our Team
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-orange-100">
              Help us revolutionize pet care by connecting pet owners with trusted service providers. 
              Build the future of the pet care industry with us.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {filteredCareers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCareers.map((career) => (
              <div key={career.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {career.title}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {career.department}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {career.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {career.type}
                    </div>
                    {career.salary_range && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {career.salary_range}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {career.description}
                </p>

                {career.requirements && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Key Requirements:</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {career.requirements}
                    </p>
                  </div>
                )}

                {career.benefits && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">What We Offer:</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {career.benefits}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    Posted {new Date(career.created_at).toLocaleDateString()}
                  </span>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No open positions</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedDepartment || selectedType 
                ? 'No positions match your current filters. Try adjusting your search criteria.'
                : 'We don\'t have any open positions at the moment. Check back soon!'
              }
            </p>
          </div>
        )}

        {/* Company Culture Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Why Work at Zootel?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Join a passionate team dedicated to improving the lives of pets and their owners
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BriefcaseIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Meaningful Work</h3>
              <p className="text-gray-600">
                Make a real impact in the pet care industry and help connect pet owners with trusted services.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BuildingOfficeIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Great Benefits</h3>
              <p className="text-gray-600">
                Competitive salary, health insurance, flexible work arrangements, and professional development opportunities.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Remote-First</h3>
              <p className="text-gray-600">
                Work from anywhere with a supportive remote-first culture and flexible schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gray-900 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Don't See the Right Role?
          </h2>
          <p className="text-gray-300 mb-6">
            We're always looking for talented individuals to join our team. 
            Send us your resume and let us know how you'd like to contribute to Zootel.
          </p>
          <a
            href="mailto:careers@zootel.shop"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CareersPage;
