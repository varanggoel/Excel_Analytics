import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesAPI } from '../../services/api';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUploadComplete?: (file: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError('');
    setSuccess('');

    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
      setError('Please select a valid Excel file (.xls or .xlsx)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await filesAPI.upload(formData);

      setSuccess('File uploaded successfully!');
      setSelectedFile(null);
      setUploadProgress(0);

      if (onUploadComplete) {
        onUploadComplete(response.data);
      }

      // Redirect to file details after a short delay
      setTimeout(() => {
        navigate(`/files/${response.data.file._id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Upload Excel File</h1>
        <p className="mt-2 text-sm text-gray-700">
          Upload your Excel file to start analyzing your data
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white shadow rounded-lg p-6">
        {!selectedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 ${
              dragActive
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop your Excel file here, or{' '}
                    <span className="text-indigo-600 hover:text-indigo-500">
                      browse
                    </span>
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xls,.xlsx"
                    onChange={handleFileInput}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Excel files (.xls, .xlsx) up to 10MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <DocumentIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
                title="Remove file"
                aria-label="Remove selected file"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="text-gray-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-indigo-600 h-2 rounded-full transition-all duration-300 w-[${uploadProgress}%]`}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Upload Guidelines
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Supported formats: .xls and .xlsx files</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Ensure your Excel file has proper column headers</li>
          <li>• Data should be organized in rows and columns</li>
          <li>• Avoid merged cells for better data analysis</li>
        </ul>
      </div>
    </div>
  );
}
