import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MessageContext = createContext();

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1
};

const messageReducer = (state, action) => {
  switch (action.type) {
    case 'MESSAGES_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'CONVERSATIONS_SUCCESS':
      return {
        ...state,
        conversations: action.payload,
        loading: false,
        error: null
      };
    case 'MESSAGES_SUCCESS':
      return {
        ...state,
        messages: action.payload.messages,
        loading: false,
        error: null,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'LOAD_MORE_MESSAGES':
      return {
        ...state,
        messages: [...action.payload.messages, ...state.messages],
        loading: false,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.currentPage
      };
    case 'MESSAGES_FAIL':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'SET_CURRENT_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        conversations: state.conversations.map(conv => 
          conv._id === action.payload.recipient || conv._id === action.payload.sender
            ? { ...conv, lastMessage: action.payload }
            : conv
        )
      };
    case 'UPDATE_MESSAGE_READ':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg._id === action.payload ? { ...msg, isRead: true } : msg
        ),
        conversations: state.conversations.map(conv => 
          conv.unreadCount > 0 ? { ...conv, unreadCount: Math.max(0, conv.unreadCount - 1) } : conv
        )
      };
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg._id !== action.payload)
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

export const MessageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);

  // Get conversations
  const getConversations = async () => {
    try {
      dispatch({ type: 'MESSAGES_LOADING' });
      const response = await axios.get('/api/messages/conversations');
      dispatch({ type: 'CONVERSATIONS_SUCCESS', payload: response.data });
    } catch (error) {
      const message = error.response?.data?.message || 'Konuşmalar yüklenirken hata oluştu';
      dispatch({ type: 'MESSAGES_FAIL', payload: message });
      toast.error(message);
    }
  };

  // Get messages for a specific conversation
  const getMessages = async (userId, page = 1) => {
    try {
      dispatch({ type: 'MESSAGES_LOADING' });
      const response = await axios.get(`/api/messages/${userId}?page=${page}`);
      
      if (page === 1) {
        dispatch({
          type: 'MESSAGES_SUCCESS',
          payload: response.data
        });
      } else {
        dispatch({
          type: 'LOAD_MORE_MESSAGES',
          payload: response.data
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Mesajlar yüklenirken hata oluştu';
      dispatch({ type: 'MESSAGES_FAIL', payload: message });
      toast.error(message);
    }
  };

  // Send message
  const sendMessage = async (recipientId, content, messageType = 'text', mediaUrl = '') => {
    try {
      const response = await axios.post('/api/messages', {
        recipientId,
        content,
        messageType,
        mediaUrl
      });
      
      dispatch({ type: 'ADD_MESSAGE', payload: response.data.data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Mesaj gönderilirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Mark message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`/api/messages/${messageId}/read`);
      dispatch({ type: 'UPDATE_MESSAGE_READ', payload: messageId });
    } catch (error) {
      console.error('Mark message as read error:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
      dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
      toast.success('Mesaj silindi!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Mesaj silinirken hata oluştu';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Add reaction to message
  const addReaction = async (messageId, emoji) => {
    try {
      await axios.post(`/api/messages/${messageId}/reactions`, { emoji });
      // Update message in state
      const updatedMessages = state.messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, reactions: [...msg.reactions, { user: 'current', emoji }] }
          : msg
      );
      dispatch({ type: 'MESSAGES_SUCCESS', payload: { ...state, messages: updatedMessages } });
    } catch (error) {
      const message = error.response?.data?.message || 'Tepki eklenirken hata oluştu';
      toast.error(message);
    }
  };

  // Remove reaction from message
  const removeReaction = async (messageId, emoji) => {
    try {
      await axios.delete(`/api/messages/${messageId}/reactions`, { data: { emoji } });
      // Update message in state
      const updatedMessages = state.messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, reactions: msg.reactions.filter(r => !(r.user === 'current' && r.emoji === emoji)) }
          : msg
      );
      dispatch({ type: 'MESSAGES_SUCCESS', payload: { ...state, messages: updatedMessages } });
    } catch (error) {
      const message = error.response?.data?.message || 'Tepki kaldırılırken hata oluştu';
      toast.error(message);
    }
  };

  // Set current conversation
  const setCurrentConversation = (conversation) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    conversations: state.conversations,
    currentConversation: state.currentConversation,
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    currentPage: state.currentPage,
    getConversations,
    getMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    addReaction,
    removeReaction,
    setCurrentConversation,
    clearError
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};