import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PetMedicalProfile from './PetMedicalProfile';

const ExtendedPetProfile = ({ petId, onClose }) => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    petTypeId: '',
    breedId: '',
    gender: '',
    dateOfBirth: '',
    weight: '',
    microchipId: '',
    sterilized: false,
    chronicConditions: [],
    allergies: [],
    dietaryRestrictions: '',
    specialNeeds: '',
    vetName: '',
    vetClinic: '',
    vetPhone: '',
    favoriteToys: '',
    behaviorNotes: '',
    stressReactions: '',
    notes: ''
  });

  const [petTypes, setPetTypes] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    if (petId) {
      loadPetData();
      loadPetTypes();
    }
  }, [petId]);

  useEffect(() => {
    if (formData.petTypeId) {
      loadBreeds(formData.petTypeId);
    }
  }, [formData.petTypeId]);

  const loadPetData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/pets/${petId}`);
      const petData = response.data.pet;
      setPet(petData);
      
      setFormData({
        name: petData.name || '',
        petTypeId: petData.petTypeId || '',
        breedId: petData.breedId || '',
        gender: petData.gender || '',
        dateOfBirth: petData.dateOfBirth ? petData.dateOfBirth.split('T')[0] : '',
        weight: petData.weight || '',
        microchipId: petData.microchipId || '',
        sterilized: petData.sterilized || false,
        chronicConditions: petData.chronicConditions || [],
        allergies: petData.allergies || [],
        dietaryRestrictions: petData.dietaryRestrictions || '',
        specialNeeds: petData.specialNeeds || '',
        vetName: petData.vetName || '',
        vetClinic: petData.vetClinic || '',
        vetPhone: petData.vetPhone || '',
        favoriteToys: petData.favoriteToys || '',
        behaviorNotes: petData.behaviorNotes || '',
        stressReactions: petData.stressReactions || '',
        notes: petData.notes || ''
      });
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPetTypes = async () => {
    try {
      const response = await axios.get('/api/admin/pet-types');
      setPetTypes(response.data.petTypes || []);
    } catch (error) {
      console.error('Error loading pet types:', error);
    }
  };

  const loadBreeds = async (petTypeId) => {
    try {
      const response = await axios.get(`/api/admin/breeds?pet_type_id=${petTypeId}`);
      setBreeds(response.data.breeds || []);
    } catch (error) {
      console.error('Error loading breeds:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addCondition = () => {
    if (newCondition.trim() && !formData.chronicConditions.includes(newCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        chronicConditions: [...prev.chronicConditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeCondition = (condition) => {
    setFormData(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter(c => c !== condition)
    }));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`/api/pets/${petId}`, formData);
      alert('Pet profile updated successfully!');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error updating pet:', error);
      alert('Failed to update pet profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !pet) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {pet?.name || 'Pet'} - Extended Profile
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'medical'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Medical Records
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'behavior'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Behavior & Notes
          </button>
        </nav>
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pet Type *
                </label>
                <select
                  name="petTypeId"
                  value={formData.petTypeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Pet Type</option>
                  {petTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed
                </label>
                <select
                  name="breedId"
                  value={formData.breedId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.petTypeId}
                >
                  <option value="">Select Breed</option>
                  {breeds.map(breed => (
                    <option key={breed.id} value={breed.id}>{breed.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Microchip ID
                </label>
                <input
                  type="text"
                  name="microchipId"
                  value={formData.microchipId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="sterilized"
                  checked={formData.sterilized}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Sterilized/Castrated
                </label>
              </div>
            </div>
          </div>

          {/* Health Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Information</h3>
            
            {/* Chronic Conditions */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chronic Conditions
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add chronic condition"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addCondition}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.chronicConditions.map((condition, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeCondition(condition)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addAllergy}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeAllergy(allergy)}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dietary Restrictions
                </label>
                <textarea
                  name="dietaryRestrictions"
                  value={formData.dietaryRestrictions}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special dietary requirements, food restrictions, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Needs
                </label>
                <textarea
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special care requirements, mobility issues, etc."
                />
              </div>
            </div>
          </div>

          {/* Veterinarian Contact */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Veterinarian Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veterinarian Name
                </label>
                <input
                  type="text"
                  name="vetName"
                  value={formData.vetName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name
                </label>
                <input
                  type="text"
                  name="vetClinic"
                  value={formData.vetClinic}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="vetPhone"
                  value={formData.vetPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Medical Records Tab */}
      {activeTab === 'medical' && (
        <PetMedicalProfile petId={petId} />
      )}

      {/* Behavior & Notes Tab */}
      {activeTab === 'behavior' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavior & Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favorite Toys & Activities
                </label>
                <textarea
                  name="favoriteToys"
                  value={formData.favoriteToys}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe pet's favorite toys, games, and activities"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Behavior Notes
                </label>
                <textarea
                  name="behaviorNotes"
                  value={formData.behaviorNotes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="General behavior patterns, temperament, social interactions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stress Reactions & Handling Tips
                </label>
                <textarea
                  name="stressReactions"
                  value={formData.stressReactions}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How the pet reacts to stress and best practices for handling"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any other important information about your pet"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExtendedPetProfile; 