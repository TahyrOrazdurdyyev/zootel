import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  PhotoIcon,
  CameraIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FileUpload = ({
  onFilesSelected,
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
  },
  showCrop = true,
  showGallery = true,
  multiple = true,
  className = ''
}) => {
  const [files, setFiles] = useState([]);
  const [cropFile, setCropFile] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        if (error.code === 'file-too-large') {
          toast.error(`Файл ${file.name} слишком большой (максимум ${maxFileSize / 1024 / 1024}MB)`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`Неподдерживаемый тип файла: ${file.name}`);
        }
      });
    });

    // Process accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.slice(0, maxFiles - files.length).map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        cropped: false
      }));

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      
      if (onFilesSelected) {
        onFilesSelected(updatedFiles.map(f => f.file));
      }

      if (showCrop && newFiles.length === 1 && newFiles[0].file.type.startsWith('image/')) {
        setCropFile(newFiles[0]);
        setIsCropping(true);
      }
    }
  }, [files, maxFiles, maxFileSize, onFilesSelected, showCrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: maxFileSize,
    multiple,
    disabled: files.length >= maxFiles
  });

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    
    if (onFilesSelected) {
      onFilesSelected(updatedFiles.map(f => f.file));
    }
  };

  const startCrop = (file) => {
    setCropFile(file);
    setIsCropping(true);
    setCrop({ unit: '%', width: 90, aspect: 1 });
    setCompletedCrop(null);
  };

  const applyCrop = useCallback(async () => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && canvasRef.current) {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Ошибка при обрезке изображения');
            return;
          }

          const croppedFile = new File([blob], `cropped_${cropFile.name}`, {
            type: cropFile.file.type,
            lastModified: Date.now(),
          });

          // Update the file in the list
          const updatedFiles = files.map(f => 
            f.id === cropFile.id 
              ? {
                  ...f,
                  file: croppedFile,
                  preview: URL.createObjectURL(croppedFile),
                  cropped: true
                }
              : f
          );

          setFiles(updatedFiles);
          
          if (onFilesSelected) {
            onFilesSelected(updatedFiles.map(f => f.file));
          }

          setIsCropping(false);
          setCropFile(null);
          toast.success('Изображение обрезано');
          resolve();
        }, cropFile.file.type);
      });
    }
  }, [completedCrop, cropFile, files, onFilesSelected]);

  const cancelCrop = () => {
    setIsCropping(false);
    setCropFile(null);
    setCrop({ unit: '%', width: 90, aspect: 1 });
    setCompletedCrop(null);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create a video element to capture from camera
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // This is a simplified camera implementation
      // In a real app, you'd want a proper camera modal
      toast.success('Камера открыта (упрощенная реализация)');
      
      // Stop the stream
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 3000);
      
    } catch (error) {
      toast.error('Не удалось получить доступ к камере');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Crop Modal */}
      {isCropping && cropFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-screen overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Обрезать изображение</h3>
              <button
                onClick={cancelCrop}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-w-full overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={cropFile.preview}
                  alt="Crop preview"
                  className="max-w-full max-h-96 object-contain"
                />
              </ReactCrop>
            </div>

            <canvas
              ref={canvasRef}
              className="hidden"
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={cancelCrop}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={applyCrop}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center space-x-2"
              >
                <CheckIcon className="w-4 h-4" />
                <span>Применить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <ArrowUpTrayIcon className="w-12 h-12 text-gray-400" />
          </div>
          
          {isDragActive ? (
            <p className="text-primary-600 font-medium">
              Отпустите файлы здесь...
            </p>
          ) : (
            <div>
              <p className="text-gray-600">
                Перетащите файлы сюда или{' '}
                <span className="text-primary-500 font-medium">выберите файлы</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Максимум {maxFiles} файлов, до {formatFileSize(maxFileSize)} каждый
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            {showGallery && (
              <button
                type="button"
                onClick={openFileDialog}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <PhotoIcon className="w-5 h-5" />
                <span>Галерея</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={openCamera}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <CameraIcon className="w-5 h-5" />
              <span>Камера</span>
            </button>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Загруженные файлы ({files.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div key={file.id} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                {file.file.type.startsWith('image/') ? (
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    {file.cropped && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Обрезано
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Action buttons overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  {showCrop && file.file.type.startsWith('image/') && (
                    <button
                      onClick={() => startCrop(file)}
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100"
                      title="Обрезать"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Удалить"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 