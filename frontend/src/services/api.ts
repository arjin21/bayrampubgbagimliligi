import axios, { AxiosResponse } from 'axios';
import {
  User,
  Post,
  Comment,
  Message,
  Conversation,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  CreatePostData,
  ProfileUpdateData,
  ChangePasswordData,
  SearchResult
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
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

// Response interceptor to handle errors
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

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', credentials),
  
  register: (credentials: RegisterCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', credentials),
  
  logout: (): Promise<AxiosResponse<any>> =>
    api.post('/auth/logout'),
  
  verifyToken: (): Promise<AxiosResponse<{ user: User }>> =>
    api.post('/auth/verify-token'),
  
  getMe: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/me'),
  
  changePassword: (data: ChangePasswordData): Promise<AxiosResponse<any>> =>
    api.put('/auth/change-password', data),
};

// User API
export const userAPI = {
  getProfile: (username: string): Promise<AxiosResponse<User>> =>
    api.get(`/users/profile/${username}`),
  
  updateProfile: (data: ProfileUpdateData): Promise<AxiosResponse<{ user: User }>> =>
    api.put('/users/profile', data),
  
  uploadProfilePicture: (file: File): Promise<AxiosResponse<{ profilePicture: string }>> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/upload-profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  followUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.post(`/users/follow/${userId}`),
  
  unfollowUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.post(`/users/unfollow/${userId}`),
  
  getFollowers: (userId: string): Promise<AxiosResponse<User[]>> =>
    api.get(`/users/${userId}/followers`),
  
  getFollowing: (userId: string): Promise<AxiosResponse<User[]>> =>
    api.get(`/users/${userId}/following`),
  
  blockUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.post(`/users/block/${userId}`),
  
  unblockUser: (userId: string): Promise<AxiosResponse<any>> =>
    api.post(`/users/unblock/${userId}`),
  
  updatePrivacy: (isPrivate: boolean): Promise<AxiosResponse<any>> =>
    api.put('/users/privacy', { isPrivate }),
  
  updateSettings: (settings: any): Promise<AxiosResponse<any>> =>
    api.put('/users/settings', { settings }),
};

// Post API
export const postAPI = {
  getFeed: (page: number = 1, limit: number = 10): Promise<AxiosResponse<Post[]>> =>
    api.get(`/posts/feed?page=${page}&limit=${limit}`),
  
  getExplore: (page: number = 1, limit: number = 20): Promise<AxiosResponse<Post[]>> =>
    api.get(`/posts/explore?page=${page}&limit=${limit}`),
  
  getPost: (postId: string): Promise<AxiosResponse<Post>> =>
    api.get(`/posts/${postId}`),
  
  createPost: (data: CreatePostData): Promise<AxiosResponse<{ post: Post }>> => {
    const formData = new FormData();
    formData.append('caption', data.caption);
    
    Array.from(data.images).forEach((image) => {
      formData.append('postImages', image);
    });
    
    if (data.location) {
      formData.append('location', JSON.stringify(data.location));
    }
    
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deletePost: (postId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/posts/${postId}`),
  
  likePost: (postId: string): Promise<AxiosResponse<any>> =>
    api.post(`/posts/${postId}/like`),
  
  unlikePost: (postId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/posts/${postId}/like`),
  
  savePost: (postId: string): Promise<AxiosResponse<any>> =>
    api.post(`/posts/${postId}/save`),
  
  unsavePost: (postId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/posts/${postId}/save`),
  
  getUserPosts: (username: string): Promise<AxiosResponse<Post[]>> =>
    api.get(`/posts/user/${username}`),
  
  getSavedPosts: (): Promise<AxiosResponse<Post[]>> =>
    api.get('/posts/saved'),
  
  addComment: (postId: string, text: string): Promise<AxiosResponse<{ comment: Comment }>> =>
    api.post(`/posts/${postId}/comments`, { text }),
  
  deleteComment: (postId: string, commentId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/posts/${postId}/comments/${commentId}`),
};

// Message API
export const messageAPI = {
  getConversations: (): Promise<AxiosResponse<Conversation[]>> =>
    api.get('/messages/conversations'),
  
  getConversation: (conversationId: string, page: number = 1, limit: number = 20): Promise<AxiosResponse<{
    conversation: Conversation;
    messages: Message[];
  }>> =>
    api.get(`/messages/conversation/${conversationId}?page=${page}&limit=${limit}`),
  
  createConversation: (userId: string): Promise<AxiosResponse<Conversation>> =>
    api.post('/messages/conversation', { userId }),
  
  sendMessage: (data: {
    conversationId: string;
    text?: string;
    messageType?: 'text' | 'image' | 'post';
    sharedPostId?: string;
    image?: File;
  }): Promise<AxiosResponse<{ data: Message }>> => {
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    
    if (data.text) formData.append('text', data.text);
    if (data.messageType) formData.append('messageType', data.messageType);
    if (data.sharedPostId) formData.append('sharedPostId', data.sharedPostId);
    if (data.image) formData.append('messageImage', data.image);
    
    return api.post('/messages/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  deleteMessage: (messageId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/messages/${messageId}`),
  
  markAsRead: (messageId: string): Promise<AxiosResponse<any>> =>
    api.put(`/messages/${messageId}/read`),
  
  addReaction: (messageId: string, emoji: string): Promise<AxiosResponse<any>> =>
    api.post(`/messages/${messageId}/reaction`, { emoji }),
  
  removeReaction: (messageId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/messages/${messageId}/reaction`),
  
  muteConversation: (conversationId: string): Promise<AxiosResponse<any>> =>
    api.put(`/messages/conversation/${conversationId}/mute`),
  
  unmuteConversation: (conversationId: string): Promise<AxiosResponse<any>> =>
    api.put(`/messages/conversation/${conversationId}/unmute`),
  
  deleteConversation: (conversationId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/messages/conversation/${conversationId}`),
};

// Search API
export const searchAPI = {
  searchUsers: (query: string, page: number = 1, limit: number = 10): Promise<AxiosResponse<User[]>> =>
    api.get(`/search/users?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  
  searchPosts: (query: string, page: number = 1, limit: number = 20): Promise<AxiosResponse<Post[]>> =>
    api.get(`/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  
  searchHashtags: (query: string, page: number = 1, limit: number = 20): Promise<AxiosResponse<Post[]>> =>
    api.get(`/search/hashtags?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  
  getSuggested: (limit: number = 10): Promise<AxiosResponse<User[]>> =>
    api.get(`/search/suggested?limit=${limit}`),
  
  getTrending: (limit: number = 10): Promise<AxiosResponse<{ hashtag: string; count: number }[]>> =>
    api.get(`/search/trending?limit=${limit}`),
  
  getRecent: (): Promise<AxiosResponse<any[]>> =>
    api.get('/search/recent'),
};

export default api;