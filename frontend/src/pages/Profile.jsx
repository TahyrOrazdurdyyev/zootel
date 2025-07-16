import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { currentUser, userRole, getIdToken } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    gender: '',
    age: '',
    photo: ''
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.displayName?.split(' ')[0] || '',
        surname: currentUser.displayName?.split(' ')[1] || '',
        gender: '',
        age: '',
        photo: currentUser.photoURL || ''
      });
      fetchUserData();
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch pets and bookings for pet owners
      if (userRole === 'pet_owner') {
        const [petsResponse, bookingsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pet-owners/pets`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pet-owners/bookings`, { headers })
        ]);

        if (petsResponse.ok) {
          const petsResult = await petsResponse.json();
          setPets(petsResult.data || []);
        }

        if (bookingsResponse.ok) {
          const bookingsResult = await bookingsResponse.json();
          setBookings(bookingsResult.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    // Profile update logic will be implemented later
    console.log('Profile update:', profileData);
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
      
      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No bookings yet</h3>
          <p>Your booking history will appear here</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
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
            <span className="profile-role">{userRole?.replace('_', ' ')}</span>
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
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && renderMyProfile()}
              {activeTab === 'pets' && renderMyPets()}
              {activeTab === 'history' && renderBookingHistory()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 