import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { MessageProvider } from './contexts/MessageContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Search from './pages/Search';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <MessageProvider>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Home />} />
                <Route path="explore" element={<Explore />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="post/:postId" element={<PostDetail />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/:userId" element={<Messages />} />
                <Route path="settings" element={<Settings />} />
                <Route path="search" element={<Search />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </MessageProvider>
      </PostProvider>
    </AuthProvider>
  );
}

export default App;