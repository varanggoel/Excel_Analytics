import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { filesAPI } from '../../services/api';
import {
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';

interface FileListProps {
  showActions?: boolean;
}

export default function FileList({ showActions = true }: FileListProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchFiles();
  }, [currentPage, statusFilter]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      };

      const response = await filesAPI.getFiles(params);
      setFiles(response.data.files);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchFiles();
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await filesAPI.deleteFile(fileId);
      setFiles(files.filter(file => file._id !== fileId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Files</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your uploaded Excel files
          </p>
        </div>
        <Link
          to="/files/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <CloudArrowDownIcon className="h-4 w-4 mr-2" />
          Upload File
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block pl-10 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                title="Filter by status"
                aria-label="Filter files by status"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Files List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {files.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file._id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentIcon className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName}
                        </p>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            file.status
                          )}`}
                        >
                          {file.status}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        {file.sheetCount && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{file.sheetCount} sheets</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {showActions && (
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/files/${file._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View file details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete file"
                        disabled={file.status === 'processing'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'No files match your search criteria.'
                : 'Get started by uploading your first Excel file.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <Link
                  to="/files/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                  Upload File
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
