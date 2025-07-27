import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  filesUploaded: number;
  storageUsed: number;
  lastLogin?: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface FileRecord {
  _id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  status: 'processing' | 'completed' | 'error';
  processingError?: string;
  worksheets: {
    name: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
  }[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    worksheetCount: number;
    createdDate: string;
    modifiedDate: string;
  };
  tags: string[];
  description: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  _id: string;
  fileId: FileRecord;
  userId: string;
  chartType: string;
  chartConfig: {
    xAxis: {
      column: string;
      label: string;
      dataType: string;
    };
    yAxis: {
      column: string;
      label: string;
      dataType: string;
    };
    zAxis?: {
      column: string;
      label: string;
      dataType: string;
    };
    title: string;
    colors: string[];
  };
  chartData: any;
  insights: {
    summary: string;
    trends: string[];
    correlations: string[];
    outliers: string[];
    aiGenerated: boolean;
  };
  isBookmarked: boolean;
  shareSettings: {
    isPublic: boolean;
    sharedWith: any[];
  };
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  getMe: () => api.get<{ user: User }>('/auth/me'),

  updateProfile: (data: { name: string; email: string }) =>
    api.put<{ message: string; user: User }>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/auth/change-password', data),
};

// Files API
export const filesAPI = {
  upload: (formData: FormData) =>
    api.post<{ message: string; file: FileRecord }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getFiles: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<{
      files: FileRecord[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>('/files', { params }),

  getFile: (id: string) => api.get<FileRecord>(`/files/${id}`),

  getWorksheetData: (fileId: string, worksheet: string) =>
    api.get<{
      worksheetName: string;
      data: any[];
      rowCount: number;
      columns: string[];
    }>(`/files/${fileId}/data/${worksheet}`),

  deleteFile: (id: string) => api.delete<{ message: string }>(`/files/${id}`),
};

// Analytics API
export const analyticsAPI = {
  create: (data: {
    fileId: string;
    chartType: string;
    xAxis: { column: string; label: string };
    yAxis: { column: string; label: string };
    zAxis?: { column: string; label: string };
    title?: string;
    colors?: string[];
    worksheetName?: string;
  }) => api.post<{ message: string; analytics: Analytics }>('/analytics/create', data),

  getAnalytics: (params?: { page?: number; limit?: number; fileId?: string; chartType?: string }) =>
    api.get<{
      analytics: Analytics[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>('/analytics', { params }),

  getAnalytic: (id: string) => api.get<Analytics>(`/analytics/${id}`),

  updateAnalytic: (id: string, data: {
    title?: string;
    colors?: string[];
    isBookmarked?: boolean;
    shareSettings?: any;
  }) => api.put<{ message: string; analytics: Analytics }>(`/analytics/${id}`, data),

  deleteAnalytic: (id: string) => api.delete<{ message: string }>(`/analytics/${id}`),

  getPublicAnalytics: (params?: { page?: number; limit?: number }) =>
    api.get<{
      analytics: Analytics[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>('/analytics/public/shared', { params }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get<User & { stats: any }>('/users/profile'),

  getDashboard: () =>
    api.get<{
      stats: {
        totalFiles: number;
        totalAnalytics: number;
        totalViews: number;
        storageUsed: number;
      };
      recentFiles: FileRecord[];
      recentAnalytics: Analytics[];
      chartTypeStats: { _id: string; count: number }[];
    }>('/users/dashboard'),
};

// Admin API
export const adminAPI = {
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) =>
    api.get<{
      users: (User & { stats: any })[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>('/users/admin/all', { params }),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.put<{ message: string; user: User }>(`/users/admin/${id}/status`, { isActive }),

  updateUserRole: (id: string, role: string) =>
    api.put<{ message: string; user: User }>(`/users/admin/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete<{ message: string }>(`/users/admin/${id}`),

  getStats: () =>
    api.get<{
      overview: {
        totalUsers: number;
        activeUsers: number;
        totalFiles: number;
        totalAnalytics: number;
      };
      charts: {
        userRegistrations: { _id: string; count: number }[];
        fileUploads: { _id: string; count: number }[];
      };
      storage: {
        totalStorage: number;
        avgStorage: number;
      };
    }>('/users/admin/stats'),

  getAllFiles: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<{
      files: FileRecord[];
      totalPages: number;
      currentPage: number;
      total: number;
    }>('/files/admin/all', { params }),
};

export default api;
