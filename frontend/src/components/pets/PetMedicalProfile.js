import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PetMedicalProfile = ({ petId }) => {
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [vaccinations, setVaccinations] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  // Form states
  const [vaccinationForm, setVaccinationForm] = useState({
    vaccineName: '',
    dateAdministered: '',
    expiryDate: '',
    vetName: '',
    vetClinic: '',
    batchNumber: '',
    notes: '',
    nextDueDate: ''
  });

  const [medicationForm, setMedicationForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    prescribedBy: '',
    instructions: '',
    sideEffects: '',
    isActive: true
  });

  useEffect(() => {
    if (petId) {
      loadMedicalData();
    }
  }, [petId]);

  const loadMedicalData = async () => {
    setLoading(true);
    try {
      const [vaccinationsRes, medicationsRes, historyRes] = await Promise.all([
        axios.get(`/api/pets/${petId}/vaccinations`),
        axios.get(`/api/pets/${petId}/medications`),
        axios.get(`/api/pets/${petId}/medical-history`)
      ]);

      setVaccinations(vaccinationsRes.data.vaccinations || []);
      setMedications(medicationsRes.data.medications || []);
      setMedicalHistory(historyRes.data.history || null);
    } catch (error) {
      console.error('Error loading medical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVaccinationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/pets/${petId}/vaccinations`, vaccinationForm);
      setShowVaccinationForm(false);
      setVaccinationForm({
        vaccineName: '',
        dateAdministered: '',
        expiryDate: '',
        vetName: '',
        vetClinic: '',
        batchNumber: '',
        notes: '',
        nextDueDate: ''
      });
      loadMedicalData();
      alert('Vaccination record added successfully!');
    } catch (error) {
      console.error('Error adding vaccination:', error);
      alert('Failed to add vaccination record');
    }
  };

  const handleMedicationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/pets/${petId}/medications`, medicationForm);
      setShowMedicationForm(false);
      setMedicationForm({
        medicationName: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
        prescribedBy: '',
        instructions: '',
        sideEffects: '',
        isActive: true
      });
      loadMedicalData();
      alert('Medication record added successfully!');
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Failed to add medication record');
    }
  };

  const deleteVaccination = async (vaccinationId) => {
    if (window.confirm('Are you sure you want to delete this vaccination record?')) {
      try {
        await axios.delete(`/api/pets/${petId}/vaccinations/${vaccinationId}`);
        loadMedicalData();
        alert('Vaccination record deleted successfully!');
      } catch (error) {
        console.error('Error deleting vaccination:', error);
        alert('Failed to delete vaccination record');
      }
    }
  };

  const deleteMedication = async (medicationId) => {
    if (window.confirm('Are you sure you want to delete this medication record?')) {
      try {
        await axios.delete(`/api/pets/${petId}/medications/${medicationId}`);
        loadMedicalData();
        alert('Medication record deleted successfully!');
      } catch (error) {
        console.error('Error deleting medication:', error);
        alert('Failed to delete medication record');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Medical Profile</h2>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('vaccinations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vaccinations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Vaccinations
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'medications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Medications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Medical History
          </button>
        </nav>
      </div>

      {/* Vaccinations Tab */}
      {activeTab === 'vaccinations' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vaccinations</h3>
            <button
              onClick={() => setShowVaccinationForm(!showVaccinationForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Vaccination
            </button>
          </div>

          {showVaccinationForm && (
            <form onSubmit={handleVaccinationSubmit} className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccine Name *
                  </label>
                  <input
                    type="text"
                    value={vaccinationForm.vaccineName}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, vaccineName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Administered *
                  </label>
                  <input
                    type="date"
                    value={vaccinationForm.dateAdministered}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, dateAdministered: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={vaccinationForm.expiryDate}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={vaccinationForm.nextDueDate}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, nextDueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinarian Name
                  </label>
                  <input
                    type="text"
                    value={vaccinationForm.vetName}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, vetName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Veterinary Clinic
                  </label>
                  <input
                    type="text"
                    value={vaccinationForm.vetClinic}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, vetClinic: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={vaccinationForm.batchNumber}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, batchNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={vaccinationForm.notes}
                    onChange={(e) => setVaccinationForm({...vaccinationForm, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowVaccinationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Vaccination
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {vaccinations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No vaccination records found</p>
            ) : (
              vaccinations.map((vaccination) => (
                <div key={vaccination.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{vaccination.vaccineName}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(vaccination.dateAdministered)}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span> {formatDate(vaccination.expiryDate)}
                        </div>
                        <div>
                          <span className="font-medium">Next Due:</span> {formatDate(vaccination.nextDueDate)}
                        </div>
                        <div>
                          <span className="font-medium">Vet:</span> {vaccination.vetName || 'Not specified'}
                        </div>
                      </div>
                      {vaccination.notes && (
                        <p className="mt-2 text-sm text-gray-600">{vaccination.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteVaccination(vaccination.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Medications Tab */}
      {activeTab === 'medications' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Medications</h3>
            <button
              onClick={() => setShowMedicationForm(!showMedicationForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Medication
            </button>
          </div>

          {showMedicationForm && (
            <form onSubmit={handleMedicationSubmit} className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={medicationForm.medicationName}
                    onChange={(e) => setMedicationForm({...medicationForm, medicationName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={medicationForm.dosage}
                    onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10mg, 1 tablet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={medicationForm.frequency}
                    onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Twice daily, Every 8 hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={medicationForm.startDate}
                    onChange={(e) => setMedicationForm({...medicationForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={medicationForm.endDate}
                    onChange={(e) => setMedicationForm({...medicationForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prescribed By
                  </label>
                  <input
                    type="text"
                    value={medicationForm.prescribedBy}
                    onChange={(e) => setMedicationForm({...medicationForm, prescribedBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={medicationForm.instructions}
                    onChange={(e) => setMedicationForm({...medicationForm, instructions: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Special instructions for administration"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Side Effects
                  </label>
                  <textarea
                    value={medicationForm.sideEffects}
                    onChange={(e) => setMedicationForm({...medicationForm, sideEffects: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Known or observed side effects"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={medicationForm.isActive}
                      onChange={(e) => setMedicationForm({...medicationForm, isActive: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Currently Active
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowMedicationForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Medication
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {medications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No medication records found</p>
            ) : (
              medications.map((medication) => (
                <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-semibold text-gray-900">{medication.medicationName}</h4>
                        {medication.isActive && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Dosage:</span> {medication.dosage || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span> {medication.frequency || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Start Date:</span> {formatDate(medication.startDate)}
                        </div>
                        <div>
                          <span className="font-medium">End Date:</span> {formatDate(medication.endDate)}
                        </div>
                      </div>
                      {medication.instructions && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Instructions:</span> {medication.instructions}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMedication(medication.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Medical History Tab */}
      {activeTab === 'history' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History Summary</h3>
          {medicalHistory ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Last Checkup</h4>
                  <p className="text-gray-600">
                    {formatDate(medicalHistory.lastCheckupDate)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Next Checkup</h4>
                  <p className="text-gray-600">
                    {formatDate(medicalHistory.nextCheckupDate)}
                  </p>
                </div>
              </div>
              {medicalHistory.medicalAlerts && medicalHistory.medicalAlerts.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Medical Alerts</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {medicalHistory.medicalAlerts.map((alert, index) => (
                      <li key={index} className="text-yellow-800">{alert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No medical history summary available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PetMedicalProfile; 