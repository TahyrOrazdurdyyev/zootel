import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface GalleryImage {
  id: string;
  url: string;
  original_name: string;
  file_size: number;
  description?: string;
  tags?: string[];
}

interface GalleryManagerProps {
  images: GalleryImage[];
  onImagesUpdate?: (images: GalleryImage[]) => void;
  entityType?: string;
  entityId?: string;
  maxImages?: number;
  editable?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GalleryManager: React.FC<GalleryManagerProps> = ({
  images = [],
  onImagesUpdate,
  entityType = 'company',
  entityId,
  maxImages = 20,
  editable = true
}) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const imageSize = (screenWidth - 48) / 3;

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true
    });

    if (!result.canceled && result.assets) {
      uploadImages(result.assets);
    }
  };

  const uploadImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (images.length + assets.length > maxImages) {
      Alert.alert('Limit exceeded', `You can only upload ${maxImages} images total.`);
      return;
    }

    setUploading(true);
    
    try {
      const uploadPromises = assets.map(async (asset) => {
        const formData = new FormData();
        
        // @ts-ignore
        formData.append('file', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || `gallery_${Date.now()}.jpg`
        });
        
        formData.append('purpose', 'gallery');
        if (entityType) formData.append('entity_type', entityType);
        if (entityId) formData.append('entity_id', entityId);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        return {
          id: result.file.id,
          url: result.file.url,
          original_name: result.file.original_name,
          file_size: result.file.file_size,
          description: '',
          tags: []
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      
      if (onImagesUpdate) {
        onImagesUpdate(newImages);
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (imageId: string) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/files/${imageId}`, {
                method: 'DELETE'
              });

              if (response.ok) {
                const newImages = images.filter(img => img.id !== imageId);
                if (onImagesUpdate) {
                  onImagesUpdate(newImages);
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove image');
            }
          }
        }
      ]
    );
  };

  const editImage = (image: GalleryImage) => {
    setEditingImage(image);
    setDescription(image.description || '');
    setTags(image.tags?.join(', ') || '');
    setEditModalVisible(true);
  };

  const saveImageEdits = async () => {
    if (!editingImage) return;

    try {
      const response = await fetch(`/api/files/${editingImage.id}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });

      if (response.ok) {
        const updatedImages = images.map(img => 
          img.id === editingImage.id 
            ? { 
                ...img, 
                description, 
                tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
              } 
            : img
        );
        
        if (onImagesUpdate) {
          onImagesUpdate(updatedImages);
        }
        setEditModalVisible(false);
        setEditingImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update image details');
    }
  };

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image);
    setLightboxVisible(true);
  };

  const closeLightbox = () => {
    setLightboxVisible(false);
    setSelectedImage(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
            Portfolio Gallery
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            {images.length} of {maxImages} images
          </Text>
        </View>
        
        {editable && images.length < maxImages && (
          <TouchableOpacity
            onPress={pickImages}
            disabled={uploading}
            style={{
              backgroundColor: '#3b82f6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="white" />
                <Text style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}>Add Images</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Gallery Grid */}
      {images.length > 0 ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {images.map((image) => (
              <View
                key={image.id}
                style={{
                  width: imageSize,
                  height: imageSize,
                  marginBottom: 8,
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <TouchableOpacity onPress={() => openLightbox(image)} style={{ flex: 1 }}>
                  <Image
                    source={{ uri: image.url }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                
                {editable && (
                  <View style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    flexDirection: 'row'
                  }}>
                    <TouchableOpacity
                      onPress={() => editImage(image)}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: 4,
                        borderRadius: 4,
                        marginRight: 4
                      }}
                    >
                      <Ionicons name="pencil" size={16} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeImage(image.id)}
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.9)',
                        padding: 4,
                        borderRadius: 4
                      }}
                    >
                      <Ionicons name="trash" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {image.description && (
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: 8
                  }}>
                    <Text style={{ color: 'white', fontSize: 12 }} numberOfLines={2}>
                      {image.description}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{
          alignItems: 'center',
          paddingVertical: 48,
          paddingHorizontal: 24,
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          borderWidth: 2,
          borderColor: '#e5e7eb',
          borderStyle: 'dashed'
        }}>
          <Ionicons name="images-outline" size={64} color="#9ca3af" />
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#1f2937',
            marginTop: 16,
            marginBottom: 8
          }}>
            No images yet
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 24
          }}>
            Start building your portfolio by adding images of your work
          </Text>
          {editable && (
            <TouchableOpacity
              onPress={pickImages}
              disabled={uploading}
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                    Add First Image
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={closeLightbox}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            onPress={closeLightbox} 
          />
          
          {selectedImage && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Image
                source={{ uri: selectedImage.url }}
                style={{ width: '100%', height: '70%' }}
                resizeMode="contain"
              />
              
              <TouchableOpacity 
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 20,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: 20,
                  padding: 10
                }}
                onPress={closeLightbox}
              >
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb'
            }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Edit Image Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              {editingImage && (
                <View style={{ marginBottom: 20 }}>
                  <Image
                    source={{ uri: editingImage.url }}
                    style={{ width: '100%', height: 200, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe this image..."
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    padding: 12,
                    textAlignVertical: 'top'
                  }}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Tags (comma-separated)</Text>
                <TextInput
                  value={tags}
                  onChangeText={setTags}
                  placeholder="e.g. grooming, before-after, dog"
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 8,
                    padding: 12
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={saveImageEdits}
                style={{
                  backgroundColor: '#3b82f6',
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default GalleryManager; 