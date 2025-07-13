import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PostContext = createContext();

const initialState = {
  posts: [],
  feed: [],
  explore: [],
  savedPosts: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1
};

const postReducer = (state, action) => {
  switch (action.type) {
    case 'POSTS_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'POSTS_SUCCESS':
      return {
        ...state,
        posts: action.payload.posts,
        loading: false,
        error: null,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'POSTS_FAIL':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'FEED_SUCCESS':
      return {
        ...state,
        feed: action.payload.posts,
        loading: false,
        error: null,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'EXPLORE_SUCCESS':
      return {
        ...state,
        explore: action.payload.posts,
        loading: false,
        error: null,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'LOAD_MORE_POSTS':
      return {
        ...state,
        posts: [...state.posts, ...action.payload.posts],
        loading: false,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'LOAD_MORE_FEED':
      return {
        ...state,
        feed: [...state.feed, ...action.payload.posts],
        loading: false,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        feed: [action.payload, ...state.feed]
      };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post._id === action.payload._id ? action.payload : post
        ),
        feed: state.feed.map(post => 
          post._id === action.payload._id ? action.payload : post
        ),
        explore: state.explore.map(post => 
          post._id === action.payload._id ? action.payload : post
        )
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post._id !== action.payload),
        feed: state.feed.filter(post => post._id !== action.payload),
        explore: state.explore.filter(post => post._id !== action.payload)
      };
    case 'LIKE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post._id === action.payload.postId 
            ? { ...post, likes: [...post.likes, action.payload.userId] }
            : post
        ),
        feed: state.feed.map(post => 
          post._id === action.payload.postId 
            ? { ...post, likes: [...post.likes, action.payload.userId] }
            : post
        ),
        explore: state.explore.map(post => 
          post._id === action.payload.postId 
            ? { ...post, likes: [...post.likes, action.payload.userId] }
            : post
        )
      };
    case 'UNLIKE_POST':
      return {
        ...state,
        posts: state.posts.map(post => 
          post._id === action.payload.postId 
            ? { ...post, likes: post.likes.filter(id => id !== action.payload.userId) }
            : post
        ),
        feed: state.feed.map(post => 
          post._id === action.payload.postId 
            ? { ...post, likes: post.likes.filter(id => id !== action.payload.userId) }
            : post
        ),
        explore: state.explore.map(post => 
          post._id === action.payload.postId 
            ? { ...post, likes: post.likes.filter(id => id !== action.payload.userId) }
            : post
        )
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        posts: state.posts.map(post => 
          post._id === action.payload.postId 
            ? { ...post, comments: [...post.comments, action.payload.comment] }
            : post
        ),
        feed: state.feed.map(post => 
          post._id === action.payload.postId 
            ? { ...post, comments: [...post.comments, action.payload.comment] }
            : post
        ),
        explore: state.explore.map(post => 
          post._id === action.payload.postId 
            ? { ...post, comments: [...post.comments, action.payload.comment] }
            : post
        )
      };
    case 'SAVE_POST':
      return {
        ...state,
        savedPosts: [...state.savedPosts, action.payload]
      };
    case 'UNSAVE_POST':
      return {
        ...state,
        savedPosts: state.savedPosts.filter(post => post._id !== action.payload)
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

export const PostProvider = ({ children }) => {
  const [state, dispatch] = useReducer(postReducer, initialState);

  // Get feed posts
  const getFeed = async (page = 1) => {
    try {
      dispatch({ type: 'POSTS_LOADING' });
      const response = await axios.get(`/api/posts/feed?page=${page}`);
      
      if (page === 1) {
        dispatch({
          type: 'FEED_SUCCESS',
          payload: response.data
        });
      } else {
        dispatch({
          type: 'LOAD_MORE_FEED',
          payload: response.data
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderiler yüklenirken hata oluştu';
      dispatch({ type: 'POSTS_FAIL', payload: message });
      toast.error(message);
    }
  };

  // Get explore posts
  const getExplore = async (page = 1) => {
    try {
      dispatch({ type: 'POSTS_LOADING' });
      const response = await axios.get(`/api/posts/explore?page=${page}`);
      
      if (page === 1) {
        dispatch({
          type: 'EXPLORE_SUCCESS',
          payload: response.data
        });
      } else {
        dispatch({
          type: 'LOAD_MORE_POSTS',
          payload: response.data
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderiler yüklenirken hata oluştu';
      dispatch({ type: 'POSTS_FAIL', payload: message });
      toast.error(message);
    }
  };

  // Create new post
  const createPost = async (postData) => {
    try {
      const response = await axios.post('/api/posts', postData);
      dispatch({ type: 'ADD_POST', payload: response.data.post });
      toast.success('Gönderi başarıyla paylaşıldı!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderi paylaşılırken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update post
  const updatePost = async (postId, postData) => {
    try {
      const response = await axios.put(`/api/posts/${postId}`, postData);
      dispatch({ type: 'UPDATE_POST', payload: response.data.post });
      toast.success('Gönderi başarıyla güncellendi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderi güncellenirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    try {
      await axios.delete(`/api/posts/${postId}`);
      dispatch({ type: 'DELETE_POST', payload: postId });
      toast.success('Gönderi başarıyla silindi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderi silinirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Like post
  const likePost = async (postId) => {
    try {
      await axios.post(`/api/likes/post/${postId}`);
      dispatch({ type: 'LIKE_POST', payload: { postId, userId: 'current' } });
    } catch (error) {
      const message = error.response?.data?.message || 'Beğeni işlemi başarısız';
      toast.error(message);
    }
  };

  // Unlike post
  const unlikePost = async (postId) => {
    try {
      await axios.delete(`/api/likes/post/${postId}`);
      dispatch({ type: 'UNLIKE_POST', payload: { postId, userId: 'current' } });
    } catch (error) {
      const message = error.response?.data?.message || 'Beğeni kaldırma işlemi başarısız';
      toast.error(message);
    }
  };

  // Add comment
  const addComment = async (postId, content, parentCommentId = null) => {
    try {
      const response = await axios.post('/api/comments', {
        postId,
        content,
        parentCommentId
      });
      dispatch({ 
        type: 'ADD_COMMENT', 
        payload: { 
          postId, 
          comment: response.data.comment 
        } 
      });
      toast.success('Yorum eklendi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Yorum eklenirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Save post
  const savePost = async (postId) => {
    try {
      await axios.post(`/api/posts/${postId}/save`);
      dispatch({ type: 'SAVE_POST', payload: { _id: postId } });
      toast.success('Gönderi kaydedildi!');
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderi kaydedilirken hata oluştu';
      toast.error(message);
    }
  };

  // Unsave post
  const unsavePost = async (postId) => {
    try {
      await axios.delete(`/api/posts/${postId}/save`);
      dispatch({ type: 'UNSAVE_POST', payload: postId });
      toast.success('Gönderi kaydı kaldırıldı!');
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderi kaydı kaldırılırken hata oluştu';
      toast.error(message);
    }
  };

  // Get posts by tag
  const getPostsByTag = async (tag, page = 1) => {
    try {
      dispatch({ type: 'POSTS_LOADING' });
      const response = await axios.get(`/api/posts/tag/${tag}?page=${page}`);
      
      if (page === 1) {
        dispatch({
          type: 'POSTS_SUCCESS',
          payload: response.data
        });
      } else {
        dispatch({
          type: 'LOAD_MORE_POSTS',
          payload: response.data
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Gönderiler yüklenirken hata oluştu';
      dispatch({ type: 'POSTS_FAIL', payload: message });
      toast.error(message);
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    posts: state.posts,
    feed: state.feed,
    explore: state.explore,
    savedPosts: state.savedPosts,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    currentPage: state.currentPage,
    getFeed,
    getExplore,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    savePost,
    unsavePost,
    getPostsByTag,
    clearError
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};