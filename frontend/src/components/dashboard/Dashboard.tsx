import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import {
  DocumentIcon,
  ChartBarIcon,
  EyeIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface DashboardData {
  stats: {
    totalFiles: number;
    totalAnalytics: number;
    totalViews: number;
    storageUsed: number;
  };
  recentFiles: any[];
  recentAnalytics: any[];
  chartTypeStats: { _id: string; count: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await usersAPI.getDashboard();
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      name: 'Total Files',
      value: data.stats.totalFiles,
      icon: DocumentIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Analytics Created',
      value: data.stats.totalAnalytics,
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Views',
      value: data.stats.totalViews,
      icon: EyeIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Storage Used',
      value: formatFileSize(data.stats.storageUsed),
      icon: CloudArrowUpIcon,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome to your Excel Analytics Platform dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Files */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Files
              </h3>
              <Link
                to="/files"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            {data.recentFiles.length > 0 ? (
              <div className="space-y-3">
                {data.recentFiles.map((file) => (
                  <div key={file._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : file.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No files uploaded yet</p>
            )}
          </div>
        </div>

        {/* Recent Analytics */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Analytics
              </h3>
              <Link
                to="/analytics"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            {data.recentAnalytics.length > 0 ? (
              <div className="space-y-3">
                {data.recentAnalytics.map((analytic) => (
                  <div key={analytic._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {analytic.chartConfig.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {analytic.chartType} • {analytic.viewCount} views
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(analytic.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No analytics created yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart Types Distribution */}
      {data.chartTypeStats.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Chart Types Distribution
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {data.chartTypeStats.map((stat) => (
                <div key={stat._id} className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{stat.count}</div>
                  <div className="text-sm text-gray-500 capitalize">{stat._id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/files/upload"
              className="relative block w-full border border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div>
                <CloudArrowUpIcon className="h-8 w-8 text-indigo-600" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload Excel File
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Upload and analyze your Excel data
                </span>
              </div>
            </Link>

            <Link
              to="/analytics/create"
              className="relative block w-full border border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div>
                <ChartBarIcon className="h-8 w-8 text-green-600" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Create Analytics
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Generate charts from your data
                </span>
              </div>
            </Link>

            <Link
              to="/analytics/public"
              className="relative block w-full border border-gray-300 rounded-lg p-6 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div>
                <EyeIcon className="h-8 w-8 text-purple-600" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Explore Public Analytics
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Browse community shared charts
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
