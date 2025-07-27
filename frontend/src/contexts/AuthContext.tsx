import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'AUTH_FAILURE':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'UPDATE_USER':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        
        // Validate token by making a request to get current user
        authAPI.getMe()
          .then(response => {
            dispatch({ type: 'UPDATE_USER', payload: response.data.user });
          })
          .catch(() => {
            dispatch({ type: 'AUTH_FAILURE' });
          });
      } catch (error) {
        dispatch({ type: 'AUTH_FAILURE' });
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login({ email, password });
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register({ name, email, password, role });
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
