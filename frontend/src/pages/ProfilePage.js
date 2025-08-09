import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  CameraIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  HeartIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import LocationSelect from '../components/ui/LocationSelect';
import FileUpload from '../components/ui/FileUpload';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: 'Anna',
    lastName: 'Johnson',
    gender: 'female',
    dateOfBirth: '1990-05-15',
    email: 'anna.johnson@example.com',
    phone: '+12345678901',
    address: '123 Main St, Apt 5',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    timezone: 'America/Los_Angeles',
    emergencyName: 'John Johnson',
    emergencyRelation: 'husband',
    emergencyPhone: '+12345678902',
    vetName: 'Happy Pets Veterinary Clinic',
    vetClinic: 'Pet Care Medical Center',
    vetPhone: '+12345551234',
    notificationMethods: ['email', 'push'],
    marketingOptIn: true,
    avatarUrl: null // Added avatarUrl to state
  });

  const [pets, setPets] = useState([
    {
      id: 1,
      name: 'Mursik',
      species: 'cat',
      breed: 'British Shorthair',
      gender: 'male',
      dateOfBirth: '2020-03-10',
      weight: 4.2,
      microchipId: 'ABC123456789',
      sterilized: true,
      photoUrl: null,
      vaccinations: [
        { vaccine: 'Complex vaccine', date: '2023-03-15', expiry: '2024-03-15' },
        { vaccine: 'Rabies', date: '2023-03-15', expiry: '2024-03-15' }
      ],
      allergies: ['chicken'],
      medications: 'Vitamins for coat - 1 tablet per day',
      specialNeeds: 'Dietary food',
      vetContact: 'Dr. Ivanov, +74951234567',
      notes: 'Very calm and affectionate cat'
    }
  ]);

  const tabs = [
    { id: 'personal', name: 'Personal Data', icon: UserIcon },
    { id: 'contact', name: 'Contacts', icon: UserIcon },
    { id: 'emergency', name: 'Emergency Contacts', icon: UserIcon },
    { id: 'preferences', name: 'Preferences', icon: UserIcon },
    { id: 'pets', name: 'Pets', icon: UserIcon }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (location) => {
    handleInputChange('country', location.country);
    handleInputChange('state', location.state);
    handleInputChange('city', location.city);
  };

  const handleAvatarUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);

    try {
      const response = await fetch('/api/uploads/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const result = await response.json();
      handleInputChange('avatarUrl', result.file.url);
      alert('Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading photo. Please try again.');
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const addPet = () => {
    const newPet = {
      id: Date.now(),
      name: '',
      species: '',
      breed: '',
      gender: '',
      dateOfBirth: '',
      weight: 0,
      microchipId: '',
      sterilized: false,
      photoUrl: null,
      vaccinations: [],
      allergies: [],
      medications: '',
      specialNeeds: '',
      vetContact: '',
      notes: ''
    };
    setPets([...pets, newPet]);
  };

  const updatePet = (petId, updates) => {
    setPets(pets.map(pet => 
      pet.id === petId ? { ...pet, ...updates } : pet
    ));
  };

  const deletePet = (petId) => {
    setPets(pets.filter(pet => pet.id !== petId));
  };

  const handlePetPhotoUpload = async (petId, files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file.file);

    try {
      const response = await fetch(`/api/uploads/pet/${petId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload pet photo');
      }

      const result = await response.json();
      updatePet(petId, { photoUrl: result.file.url });
      alert('Pet photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading pet photo:', error);
      alert('Error uploading pet photo. Please try again.');
    }
  };

  const renderPersonalTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={profileData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth (Age: {calculateAge(profileData.dateOfBirth)} years)
          </label>
          <input
            type="date"
            value={profileData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profileData.avatarUrl ? (
                  <img 
                    src={profileData.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-gray-400" />
                )}
              </div>
            </div>
            <FileUpload
              onFilesSelect={handleAvatarUpload}
              maxFiles={1}
              maxFileSize={5 * 1024 * 1024} // 5MB
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              allowMultiple={false}
              showPreview={false}
              className="max-w-md"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Upload profile photo
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or WebP up to 5MB
                </p>
              </div>
            </FileUpload>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profileData.avatarUrl ? (
                <img 
                  src={profileData.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={profileData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={!isEditing}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone
        </label>
        <PhoneInput
          country={'us'}
          value={profileData.phone}
          onChange={(phone) => handleInputChange('phone', phone)}
          disabled={!isEditing}
          inputClass="input-field !pl-14"
          containerClass="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address
        </label>
        <textarea
          value={profileData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          disabled={!isEditing}
          rows={3}
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={profileData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          >
            <option value="United States">United States</option>
            <option value="Ukraine">Ukraine</option>
            <option value="Belarus">Belarus</option>
            <option value="Kazakhstan">Kazakhstan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <input
            type="text"
            value={profileData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={profileData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          value={profileData.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          disabled={!isEditing}
          className="input-field"
        >
          <option value="America/Los_Angeles">Los Angeles (GMT-7)</option>
          <option value="Europe/Kiev">Kiev (GMT+2)</option>
          <option value="Asia/Yekaterinburg">Yekaterinburg (GMT+5)</option>
          <option value="Asia/Novosibirsk">Novosibirsk (GMT+7)</option>
        </select>
      </div>
    </div>
  );

  const renderEmergencyTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Emergency Contact</h3>
        <p className="text-sm text-yellow-700">
          Specify a contact person to whom you can turn in an emergency situation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name and Relation
          </label>
          <input
            type="text"
            value={profileData.emergencyName}
            onChange={(e) => handleInputChange('emergencyName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
            placeholder="John Johnson (husband)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact Phone
          </label>
          <PhoneInput
            country={'us'}
            value={profileData.emergencyPhone}
            onChange={(phone) => handleInputChange('emergencyPhone', phone)}
            disabled={!isEditing}
            inputClass="input-field !pl-14"
            containerClass="w-full"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Veterinary Contact</h3>
        <p className="text-sm text-blue-700">
          Contact details of your main veterinarian or clinic
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Veterinarian Name
          </label>
          <input
            type="text"
            value={profileData.vetName}
            onChange={(e) => handleInputChange('vetName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinic Name
          </label>
          <input
            type="text"
            value={profileData.vetClinic}
            onChange={(e) => handleInputChange('vetClinic', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Veterinary Clinic Phone
          </label>
          <PhoneInput
            country={'us'}
            value={profileData.vetPhone}
            onChange={(phone) => handleInputChange('vetPhone', phone)}
            disabled={!isEditing}
            inputClass="input-field !pl-14"
            containerClass="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { id: 'email', label: 'Email notifications' },
            { id: 'push', label: 'Push notifications' },
            { id: 'sms', label: 'SMS notifications' }
          ].map((method) => (
            <label key={method.id} className="flex items-center">
              <input
                type="checkbox"
                checked={profileData.notificationMethods.includes(method.id)}
                onChange={(e) => {
                  const methods = profileData.notificationMethods;
                  if (e.target.checked) {
                    handleInputChange('notificationMethods', [...methods, method.id]);
                  } else {
                    handleInputChange('notificationMethods', methods.filter(m => m !== method.id));
                  }
                }}
                disabled={!isEditing}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Marketing</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profileData.marketingOptIn}
            onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Receive marketing materials and special offers
          </span>
        </label>
      </div>
    </div>
  );

  const renderPetsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">My Pets</h3>
        <button
          onClick={addPet}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Pet</span>
        </button>
      </div>

      <div className="space-y-6">
        {pets.map((pet) => (
          <div key={pet.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {pet.name || 'New Pet'}
              </h4>
              <button
                onClick={() => deletePet(pet.id)}
                className="text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={pet.name}
                  onChange={(e) => updatePet(pet.id, { name: e.target.value })}
                  className="input-field"
                  placeholder="Pet name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species
                </label>
                <select
                  value={pet.species}
                  onChange={(e) => updatePet(pet.id, { species: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select species</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="fish">Fish</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed
                </label>
                <input
                  type="text"
                  value={pet.breed}
                  onChange={(e) => updatePet(pet.id, { breed: e.target.value })}
                  className="input-field"
                  placeholder="Breed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Photo
                </label>
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {pet.photoUrl ? (
                      <img 
                        src={pet.photoUrl} 
                        alt={pet.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HeartIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <FileUpload
                      onFilesSelect={(files) => handlePetPhotoUpload(pet.id, files)}
                      maxFiles={1}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                      allowMultiple={false}
                      showPreview={false}
                      className="max-w-sm"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Upload pet photo
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG or WebP up to 5MB
                        </p>
                      </div>
                    </FileUpload>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={pet.gender}
                  onChange={(e) => updatePet(pet.id, { gender: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth (Age: {pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 0} years)
                </label>
                <input
                  type="date"
                  value={pet.dateOfBirth}
                  onChange={(e) => updatePet(pet.id, { dateOfBirth: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pet.weight}
                  onChange={(e) => updatePet(pet.id, { weight: parseFloat(e.target.value) })}
                  className="input-field"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Microchip Number
                </label>
                <input
                  type="text"
                  value={pet.microchipId}
                  onChange={(e) => updatePet(pet.id, { microchipId: e.target.value })}
                  className="input-field"
                  placeholder="ABC123456789"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pet.sterilized}
                    onChange={(e) => updatePet(pet.id, { sterilized: e.target.checked })}
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Sterilized/Neutered
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <input
                  type="text"
                  value={pet.allergies.join(', ')}
                  onChange={(e) => updatePet(pet.id, { allergies: e.target.value.split(', ').filter(a => a.trim()) })}
                  className="input-field"
                  placeholder="chicken, beef"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medications and Dosages
                </label>
                <textarea
                  value={pet.medications}
                  onChange={(e) => updatePet(pet.id, { medications: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Vitamins for coat - 1 tablet per day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Needs
                </label>
                <textarea
                  value={pet.specialNeeds}
                  onChange={(e) => updatePet(pet.id, { specialNeeds: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Dietary food, specific behavior"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={pet.notes}
                  onChange={(e) => updatePet(pet.id, { notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional information about the pet"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Profile
              </h1>
              <p className="text-gray-600">
                Manage your personal information and pets
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`btn-${isEditing ? 'secondary' : 'primary'} flex items-center space-x-2`}
            >
              <PencilIcon className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'emergency' && renderEmergencyTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'pets' && renderPetsTab()}
          </div>

          {isEditing && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save profile data
                    setIsEditing(false);
                  }}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 