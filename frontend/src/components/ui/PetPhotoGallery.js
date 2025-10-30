import React, { useState, useRef } from 'react';
import axios from 'axios';

const PetPhotoGallery = ({ petId, photos = [], mainPhoto, onPhotosUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', 'pet_photo');

        const uploadResponse = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const photoUrl = uploadResponse.data.file_url;
        await axios.post(`/api/pets/${petId}/photos`, { photoUrl });
      }

      if (onPhotosUpdate) {
        onPhotosUpdate();
      }
      alert('Photos uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetMainPhoto = async (photoUrl) => {
    try {
      await axios.put(`/api/pets/${petId}/main-photo`, { photoUrl });
      if (onPhotosUpdate) {
        onPhotosUpdate();
      }
      alert('Main photo updated successfully!');
    } catch (error) {
      console.error('Error setting main photo:', error);
      alert('Failed to update main photo');
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      await axios.delete(`/api/pets/${petId}/photos`, {
        data: { photoUrl }
      });
      
      if (onPhotosUpdate) {
        onPhotosUpdate();
      }
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Photo Gallery</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Add Photos'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Photo */}
      {mainPhoto && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-2">Main Photo</h4>
          <div className="relative inline-block">
            <img
              src={mainPhoto}
              alt="Main pet photo"
              className="w-48 h-48 object-cover rounded-lg cursor-pointer"
              onClick={() => openPhotoModal(mainPhoto)}
            />
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Main
            </span>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo}
              alt={`Pet photo ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => openPhotoModal(photo)}
            />
            
            {/* Photo Actions Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetMainPhoto(photo);
                }}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                disabled={mainPhoto === photo}
              >
                {mainPhoto === photo ? 'Main' : 'Set Main'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo);
                }}
                className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {/* Add Photo Placeholder */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <div className="text-center">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Add Photo</p>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closePhotoModal}
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <img
              src={selectedPhoto}
              alt="Pet photo enlarged"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {photos.length === 0 && !mainPhoto && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No photos yet</h3>
          <p className="mt-2 text-gray-500">Get started by uploading your pet's photos</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Upload First Photo
          </button>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Photo Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Upload multiple photos to create a comprehensive gallery</li>
          <li>• Set one photo as the main photo to represent your pet</li>
          <li>• Supported formats: JPG, PNG, GIF (max 10MB per photo)</li>
          <li>• Click on any photo to view it in full size</li>
        </ul>
      </div>
    </div>
  );
};

export default PetPhotoGallery; 