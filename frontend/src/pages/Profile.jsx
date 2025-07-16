import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedApiCall } from '../utils/api';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: ''
  });

  const [pets, setPets] = useState([]);
  const [bookingHistory, setBookingHistory] = useState([]);

  const fetchUserData = useCallback(async () => {
    try {
      if (currentUser) {
        // Fetch user profile
        setProfileData({
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: currentUser.phoneNumber || '',
          address: '',
          dateOfBirth: ''
        });

        // Fetch pets and booking history
        
        // Fetch pets
        const petsResponse = await authenticatedApiCall(currentUser, '/api/pet-owners/pets');
        
        if (petsResponse.ok) {
          const petsData = await petsResponse.json();
          setPets(petsData.data || []);
        }

        // Fetch booking history
        const bookingsResponse = await authenticatedApiCall(currentUser, '/api/pet-owners/bookings');
        
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookingHistory(bookingsData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Add profile update logic here
      console.log('Profile update:', profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const tabs = [
    { id: 'profile', name: 'My Profile', icon: '👤' },
    { id: 'pets', name: 'My Pets', icon: '🐾' },
    { id: 'history', name: 'Booking History', icon: '📅' }
  ];

  const renderMyProfile = () => (
    <div className="profile-section">
      <h2>My Profile</h2>
      <form onSubmit={handleProfileUpdate} className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">First Name</label>
            <input
              type="text"
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              placeholder="Enter your first name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="surname">Last Name</label>
            <input
              type="text"
              id="surname"
              value={profileData.surname}
              onChange={(e) => setProfileData({...profileData, surname: e.target.value})}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={profileData.gender}
              onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              value={profileData.age}
              onChange={(e) => setProfileData({...profileData, age: e.target.value})}
              placeholder="Enter your age"
              min="13"
              max="120"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={currentUser?.email || ''}
            disabled
            className="disabled"
          />
          <small>Email cannot be changed. Contact support if needed.</small>
        </div>

        <div className="form-group">
          <label htmlFor="photo">Profile Photo URL</label>
          <input
            type="url"
            id="photo"
            value={profileData.photo}
            onChange={(e) => setProfileData({...profileData, photo: e.target.value})}
            placeholder="Enter photo URL"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Update Profile
        </button>
      </form>
    </div>
  );

  const renderMyPets = () => (
    <div className="profile-section">
      <div className="section-header">
        <h2>My Pets</h2>
        <button className="btn btn-primary">Add New Pet</button>
      </div>
      
      {pets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🐾</div>
          <h3>No pets added yet</h3>
          <p>Add your first pet to start booking services</p>
        </div>
      ) : (
        <div className="pets-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-photo">
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} />
                ) : (
                  <div className="pet-placeholder">🐾</div>
                )}
              </div>
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <p>{pet.breed} • {pet.age} years old</p>
                <span className="pet-type">{pet.type}</span>
              </div>
              <div className="pet-actions">
                <button className="btn btn-small">Edit</button>
                <button className="btn btn-small btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookingHistory = () => (
    <div className="profile-section">
      <h2>Booking History</h2>
      
      {bookingHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No bookings yet</h3>
          <p>Your booking history will appear here</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookingHistory.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h4>{booking.serviceName}</h4>
                <span className={`status ${booking.status}`}>{booking.status}</span>
              </div>
              <div className="booking-details">
                <p><strong>Company:</strong> {booking.companyName}</p>
                <p><strong>Pet:</strong> {booking.petName}</p>
                <p><strong>Date:</strong> {booking.date} at {booking.time}</p>
                <p><strong>Price:</strong> ${booking.price}</p>
              </div>
              {booking.status === 'completed' && (
                <div className="booking-actions">
                  <button className="btn btn-small">Rate Service</button>
                  <button className="btn btn-small">Book Again</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profileData.photo ? (
              <img src={profileData.photo} alt="Profile" />
            ) : (
              currentUser?.email?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <h1>{profileData.name} {profileData.surname}</h1>
            <p>{currentUser?.email}</p>
            <span className="profile-role">Pet Owner</span>
          </div>
        </div>

        <div className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && renderMyProfile()}
          {activeTab === 'pets' && renderMyPets()}
          {activeTab === 'history' && renderBookingHistory()}
        </div>
      </div>
    </div>
  );
};

export default Profile; 