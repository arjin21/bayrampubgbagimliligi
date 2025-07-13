import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessage } from '../contexts/MessageContext';
import { 
  FaHome, 
  FaSearch, 
  FaCompass, 
  FaPaperPlane, 
  FaHeart, 
  FaPlus,
  FaUser,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import CreatePostModal from './CreatePostModal';
import SearchModal from './SearchModal';

const Layout = () => {
  const { user, logout } = useAuth();
  const { conversations, getConversations } = useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread messages
  React.useEffect(() => {
    if (conversations.length > 0) {
      const total = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(total);
    }
  }, [conversations]);

  // Load conversations on mount
  React.useEffect(() => {
    getConversations();
  }, [getConversations]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    { icon: FaHome, label: 'Ana Sayfa', path: '/', active: location.pathname === '/' },
    { icon: FaSearch, label: 'Ara', path: '/search', active: location.pathname === '/search' },
    { icon: FaCompass, label: 'Keşfet', path: '/explore', active: location.pathname === '/explore' },
    { icon: FaPaperPlane, label: 'Mesajlar', path: '/messages', active: location.pathname.startsWith('/messages') },
    { icon: FaHeart, label: 'Bildirimler', path: '/notifications', active: location.pathname === '/notifications' },
    { icon: FaPlus, label: 'Oluştur', path: null, action: () => setShowCreatePost(true) },
    { icon: FaUser, label: 'Profil', path: `/profile/${user?.username}`, active: location.pathname.startsWith('/profile') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Instagram</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <FaSearch size={20} />
            </button>
            <button
              onClick={() => setShowCreatePost(true)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <FaPlus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-2xl font-bold text-gray-900">Instagram</h1>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors ${
                        item.active
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          item.active ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.label}
                      {item.label === 'Mesajlar' && unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            
            {/* User section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.profilePicture || 'https://via.placeholder.com/32'}
                  alt={user?.username}
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.fullName}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <FaCog size={16} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <FaSignOutAlt size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={`flex flex-col items-center p-2 ${
                    item.active ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  <div className="relative">
                    <Icon size={24} />
                    {item.label === 'Mesajlar' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => navigate(`/profile/${user?.username}`)}
              className={`flex flex-col items-center p-2 ${
                location.pathname.startsWith('/profile') ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              <img
                className="w-6 h-6 rounded-full"
                src={user?.profilePicture || 'https://via.placeholder.com/24'}
                alt={user?.username}
              />
              <span className="text-xs mt-1">Profil</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      {showCreatePost && (
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
        />
      )}

      {showSearch && (
        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
};

export default Layout;