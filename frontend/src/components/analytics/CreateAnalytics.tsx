import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesAPI, analyticsAPI } from '../../services/api';
import {
  ChartBarIcon,
  Squares2X2Icon,
  PresentationChartLineIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface ChartFormData {
  fileId: string;
  worksheetName: string;
  chartType: string;
  title: string;
  xAxis: {
    column: string;
    label: string;
  };
  yAxis: {
    column: string;
    label: string;
  };
  zAxis?: {
    column: string;
    label: string;
  };
  colors: string[];
}

export default function CreateAnalytics() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [formData, setFormData] = useState<ChartFormData>({
    fileId: '',
    worksheetName: '',
    chartType: 'bar',
    title: '',
    xAxis: {
      column: '',
      label: '',
    },
    yAxis: {
      column: '',
      label: '',
    },
    colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await filesAPI.getFiles({ status: 'completed' });
      setFiles(response.data.files);
    } catch (err: any) {
      setError('Failed to load files');
    }
  };

  const handleFileSelect = async (fileId: string) => {
    try {
      const file = files.find(f => f._id === fileId);
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, fileId }));

      // Get worksheets from file metadata
      if (file?.worksheets) {
        const worksheetNames = file.worksheets.map((ws: any) => ws.name);
        setWorksheets(worksheetNames);
      }
      setColumns([]);
    } catch (err: any) {
      setError('Failed to load file worksheets');
    }
  };

  const handleWorksheetSelect = async (worksheetName: string) => {
    try {
      setFormData(prev => ({ ...prev, worksheetName }));

      // Fetch columns for selected worksheet
      const response = await filesAPI.getWorksheetData(formData.fileId, worksheetName);
      if (response.data.columns) {
        setColumns(response.data.columns);
      }
    } catch (err: any) {
      setError('Failed to load worksheet columns');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAxisChange = (axis: 'xAxis' | 'yAxis' | 'zAxis', field: 'column' | 'label', value: string) => {
    setFormData(prev => ({
      ...prev,
      [axis]: { ...prev[axis], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fileId || !formData.worksheetName || !formData.title || !formData.xAxis.column || !formData.yAxis.column) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await analyticsAPI.create(formData);
      navigate(`/analytics/${response.data.analytics._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', icon: ChartBarIcon, description: 'Compare values across categories' },
    { id: 'line', name: 'Line Chart', icon: PresentationChartLineIcon, description: 'Show trends over time' },
    { id: 'pie', name: 'Pie Chart', icon: Squares2X2Icon, description: 'Show proportions of a whole' },
    { id: 'scatter', name: 'Scatter Plot', icon: Squares2X2Icon, description: 'Show relationships between variables' },
    { id: '3d', name: '3D Chart', icon: CubeIcon, description: 'Interactive 3D visualization' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create Analytics</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create interactive charts and visualizations from your Excel data
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            1. Select Data Source
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excel File
              </label>
              <select
                value={formData.fileId}
                onChange={(e) => handleFileSelect(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                title="Select Excel file"
                aria-label="Select Excel file"
              >
                <option value="">Select a file</option>
                {files.map((file) => (
                  <option key={file._id} value={file._id}>
                    {file.originalName}
                  </option>
                ))}
              </select>
            </div>

            {worksheets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Worksheet
                </label>
                <select
                  value={formData.worksheetName}
                  onChange={(e) => handleWorksheetSelect(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  title="Select worksheet"
                  aria-label="Select worksheet"
                >
                  <option value="">Select a worksheet</option>
                  {worksheets.map((worksheet) => (
                    <option key={worksheet} value={worksheet}>
                      {worksheet}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Chart Configuration */}
        {columns.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              2. Chart Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Type
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {chartTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`relative cursor-pointer rounded-lg border p-4 focus:outline-none ${
                        formData.chartType === type.id
                          ? 'border-indigo-600 ring-2 ring-indigo-600'
                          : 'border-gray-300'
                      }`}
                      onClick={() => handleInputChange('chartType', type.id)}
                    >
                      <div className="flex items-center">
                        <type.icon className="h-6 w-6 text-indigo-600" />
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {type.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chart Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter chart title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X-Axis Column *
                  </label>
                  <select
                    value={formData.xAxis.column}
                    onChange={(e) => {
                      handleAxisChange('xAxis', 'column', e.target.value);
                      handleAxisChange('xAxis', 'label', e.target.value);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    title="Select X-axis column"
                    aria-label="Select X-axis column"
                  >
                    <option value="">Select column</option>
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X-Axis Label
                  </label>
                  <input
                    type="text"
                    value={formData.xAxis.label}
                    onChange={(e) => handleAxisChange('xAxis', 'label', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="X-axis label"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y-Axis Column *
                  </label>
                  <select
                    value={formData.yAxis.column}
                    onChange={(e) => {
                      handleAxisChange('yAxis', 'column', e.target.value);
                      handleAxisChange('yAxis', 'label', e.target.value);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    title="Select Y-axis column"
                    aria-label="Select Y-axis column"
                  >
                    <option value="">Select column</option>
                    {columns
                      .filter(col => col !== formData.xAxis.column)
                      .map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y-Axis Label
                  </label>
                  <input
                    type="text"
                    value={formData.yAxis.label}
                    onChange={(e) => handleAxisChange('yAxis', 'label', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Y-axis label"
                  />
                </div>
              </div>

              {formData.chartType === '3d' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Z-Axis Column (for 3D)
                    </label>
                    <select
                      value={formData.zAxis?.column || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData(prev => ({
                            ...prev,
                            zAxis: { column: e.target.value, label: e.target.value }
                          }));
                        } else {
                          setFormData(prev => ({ ...prev, zAxis: undefined }));
                        }
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      title="Select Z-axis column"
                      aria-label="Select Z-axis column"
                    >
                      <option value="">Select column (optional)</option>
                      {columns
                        .filter(col => col !== formData.xAxis.column && col !== formData.yAxis.column)
                        .map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Z-Axis Label
                    </label>
                    <input
                      type="text"
                      value={formData.zAxis?.label || ''}
                      onChange={(e) => {
                        if (formData.zAxis) {
                          setFormData(prev => ({
                            ...prev,
                            zAxis: { ...prev.zAxis!, label: e.target.value }
                          }));
                        }
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Z-axis label"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Analytics'}
          </button>
        </div>
      </form>
    </div>
  );
}
