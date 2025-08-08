import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { Service, Employee } from '../../types';

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  duration: string;
  isActive: boolean;
  availableDays: string[];
  startTime: string;
  endTime: string;
  assignedEmployees: string[];
  maxBookingsPerSlot: string;
  bufferTimeBefore: string;
  bufferTimeAfter: string;
  advanceBookingDays: string;
  cancellationPolicy: string;
  // Image fields
  imageUri?: string;
  imageId?: string;
}

const ServiceFormScreen = ({ route, navigation }: any) => {
  const { mode, service } = route.params;
  const { employee } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ServiceFormData>({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || 'Pet Grooming',
    price: service?.price?.toString() || '',
    duration: service?.duration?.toString() || '60',
    isActive: service?.isActive ?? true,
    availableDays: service?.availableDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: service?.startTime || '09:00',
    endTime: service?.endTime || '17:00',
    assignedEmployees: service?.assignedEmployees || [],
    maxBookingsPerSlot: service?.maxBookingsPerSlot?.toString() || '1',
    bufferTimeBefore: service?.bufferTimeBefore?.toString() || '0',
    bufferTimeAfter: service?.bufferTimeAfter?.toString() || '15',
    advanceBookingDays: service?.advanceBookingDays?.toString() || '30',
    cancellationPolicy: service?.cancellationPolicy || '24h before',
    imageUri: service?.imageUrl || undefined,
    imageId: service?.imageId || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Image picker functions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setFormData(prev => ({ ...prev, imageUri: undefined, imageId: undefined }))
        }
      ]
    );
  };

  const categories = [
    'Pet Grooming',
    'Veterinary Care',
    'Pet Training',
    'Pet Boarding',
    'Pet Sitting',
    'Dog Walking',
    'Pet Products',
    'Emergency Care',
    'Pet Photography',
    'Pet Transportation'
  ];

  const cancellationPolicies = [
    '24h before',
    '48h before',
    '72h before',
    '1 week before',
    'No cancellation',
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  // Fetch company employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['company-employees', employee?.companyId],
    queryFn: () => apiService.getCompanyEmployees(employee!.companyId),
    enabled: !!employee?.companyId,
  });

  // Create/Update service mutation
  const saveServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      if (mode === 'create') {
        return apiService.createService(employee!.companyId, serviceData);
      } else {
        return apiService.updateService(service.id, serviceData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services'] });
      Alert.alert(
        'Success', 
        `Service ${mode === 'create' ? 'created' : 'updated'} successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', `Failed to ${mode} service: ${error.message}`);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Valid duration is required';
    }
    if (formData.availableDays.length === 0) {
      newErrors.availableDays = 'At least one available day is required';
    }
    if (!formData.startTime || !formData.endTime) {
      newErrors.schedule = 'Start and end times are required';
    }
    if (formData.startTime >= formData.endTime) {
      newErrors.schedule = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let imageId = formData.imageId;

      // Upload image if new image is selected
      if (formData.imageUri && !formData.imageId) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await apiService.uploadServiceImage(formData.imageUri, employee!.companyId);
          imageId = uploadResult.fileId;
        } catch (error) {
          setIsUploadingImage(false);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          return;
        }
        setIsUploadingImage(false);
      }

      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        is_active: formData.isActive,
        available_days: formData.availableDays,
        start_time: formData.startTime,
        end_time: formData.endTime,
        assigned_employees: formData.assignedEmployees,
        max_bookings_per_slot: parseInt(formData.maxBookingsPerSlot),
        buffer_time_before: parseInt(formData.bufferTimeBefore),
        buffer_time_after: parseInt(formData.bufferTimeAfter),
        advance_booking_days: parseInt(formData.advanceBookingDays),
        cancellation_policy: formData.cancellationPolicy,
        image_id: imageId,
      };

      saveServiceMutation.mutate(serviceData);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter(id => id !== employeeId)
        : [...prev.assignedEmployees, employeeId]
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === 'create' ? 'Create Service' : 'Edit Service'}
          </Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saveServiceMutation.isPending}
          >
            <Text style={styles.saveButtonText}>
              {saveServiceMutation.isPending ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="e.g., Dog Grooming - Full Service"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder="Describe your service in detail..."
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setShowCategoryModal(true);
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.category || 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                keyboardType="decimal-pad"
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Duration (min) *</Text>
              <TextInput
                style={[styles.input, errors.duration && styles.inputError]}
                placeholder="60"
                value={formData.duration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                keyboardType="number-pad"
              />
              {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Service Active</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
              trackColor={{ false: '#F3F4F6', true: '#DBEAFE' }}
              thumbColor={formData.isActive ? '#3B82F6' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Service Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Image</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.helpText}>Add an image to showcase your service in the marketplace</Text>
            
            {formData.imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: formData.imageUri }} style={styles.serviceImage} />
                <View style={styles.imageOverlay}>
                  <TouchableOpacity 
                    style={styles.imageButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={styles.imageButtonText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageButton, styles.removeButton]}
                    onPress={removeImage}
                  >
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.imageButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imageUploadArea}
                onPress={pickImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="large" color="#3B82F6" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.uploadText}>Tap to add service image</Text>
                    <Text style={styles.uploadSubtext}>Recommended: 16:9 aspect ratio</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Schedule & Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule & Availability</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Available Days *</Text>
            <View style={styles.daysContainer}>
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayChip,
                    formData.availableDays.includes(day.key) && styles.dayChipActive
                  ]}
                  onPress={() => toggleDay(day.key)}
                >
                  <Text style={[
                    styles.dayChipText,
                    formData.availableDays.includes(day.key) && styles.dayChipTextActive
                  ]}>
                    {day.label.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.availableDays && <Text style={styles.errorText}>{errors.availableDays}</Text>}
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={[styles.input, errors.schedule && styles.inputError]}
                placeholder="09:00"
                value={formData.startTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, startTime: text }))}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={[styles.input, errors.schedule && styles.inputError]}
                placeholder="17:00"
                value={formData.endTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, endTime: text }))}
              />
            </View>
          </View>
          {errors.schedule && <Text style={styles.errorText}>{errors.schedule}</Text>}
        </View>

        {/* Staff Assignment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Assignment</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Assigned Employees</Text>
            <Text style={styles.helpText}>Select employees who can perform this service</Text>
            
            {employees?.map(emp => (
              <TouchableOpacity
                key={emp.id}
                style={styles.employeeRow}
                onPress={() => toggleEmployee(emp.id)}
              >
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>
                    {emp.firstName} {emp.lastName}
                  </Text>
                  <Text style={styles.employeeRole}>{emp.role}</Text>
                </View>
                <View style={[
                  styles.checkbox,
                  formData.assignedEmployees.includes(emp.id) && styles.checkboxActive
                ]}>
                  {formData.assignedEmployees.includes(emp.id) && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Settings</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Max Bookings/Slot</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={formData.maxBookingsPerSlot}
                onChangeText={(text) => setFormData(prev => ({ ...prev, maxBookingsPerSlot: text }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Advance Booking (days)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                value={formData.advanceBookingDays}
                onChangeText={(text) => setFormData(prev => ({ ...prev, advanceBookingDays: text }))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Buffer Before (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.bufferTimeBefore}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bufferTimeBefore: text }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Buffer After (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                value={formData.bufferTimeAfter}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bufferTimeAfter: text }))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cancellation Policy</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setShowPolicyModal(true);
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.cancellationPolicy || 'Select Cancellation Policy'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, category: item }));
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>

      {/* Cancellation Policy Modal */}
      <Modal
        visible={showPolicyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Cancellation Policy</Text>
            <FlatList
              data={cancellationPolicies}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, cancellationPolicy: item }));
                    setShowPolicyModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  dayChipActive: {
    backgroundColor: '#3B82F6',
  },
  dayChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  employeeRole: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  // Image Upload Styles
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  imageUploadArea: {
    height: 200,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
});

export default ServiceFormScreen; 