import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { SearchPage } from './pages/SearchPage';

import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <HomePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExplorePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SearchPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePostPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MessagesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/p/:postId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PostDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/:username"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;