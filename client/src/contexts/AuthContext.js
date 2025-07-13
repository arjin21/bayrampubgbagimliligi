import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await axios.get('/api/auth/me');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.data, token: state.token }
          });
        } catch (error) {
          dispatch({ type: 'AUTH_FAIL', payload: 'Token geçersiz' });
          localStorage.removeItem('token');
        }
      } else {
        dispatch({ type: 'AUTH_FAIL', payload: null });
      }
    };

    checkAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await axios.post('/api/auth/register', userData);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response.data
      });
      
      toast.success('Hesap başarıyla oluşturuldu!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Kayıt sırasında bir hata oluştu';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await axios.post('/api/auth/login', credentials);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response.data
      });
      
      toast.success('Giriş başarılı!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Giriş sırasında bir hata oluştu';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (state.token) {
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      toast.success('Çıkış yapıldı');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/users/profile', profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Profil başarıyla güncellendi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profil güncellenirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update profile picture
  const updateProfilePicture = async (profilePicture) => {
    try {
      const response = await axios.put('/api/users/profile-picture', { profilePicture });
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Profil fotoğrafı güncellendi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profil fotoğrafı güncellenirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await axios.post('/api/auth/change-password', passwordData);
      toast.success('Şifre başarıyla değiştirildi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Şifre değiştirilirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update privacy settings
  const updatePrivacy = async (isPrivate) => {
    try {
      const response = await axios.put('/api/users/privacy', { isPrivate });
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Gizlilik ayarları güncellendi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gizlilik ayarları güncellenirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update notification settings
  const updateNotifications = async (notifications) => {
    try {
      const response = await axios.put('/api/users/notifications', { notifications });
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Bildirim ayarları güncellendi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Bildirim ayarları güncellenirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
    updateProfile,
    updateProfilePicture,
    changePassword,
    updatePrivacy,
    updateNotifications,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};