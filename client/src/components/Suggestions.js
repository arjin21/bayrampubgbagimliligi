import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus } from 'react-icons/fa';

const Suggestions = () => {
  // Mock suggestions data - in real app this would come from API
  const suggestions = [
    {
      id: 1,
      username: 'suggested_user1',
      fullName: 'Suggested User 1',
      profilePicture: 'https://via.placeholder.com/32',
      isVerified: false,
      mutualFollowers: 3
    },
    {
      id: 2,
      username: 'suggested_user2',
      fullName: 'Suggested User 2',
      profilePicture: 'https://via.placeholder.com/32',
      isVerified: true,
      mutualFollowers: 5
    },
    {
      id: 3,
      username: 'suggested_user3',
      fullName: 'Suggested User 3',
      profilePicture: 'https://via.placeholder.com/32',
      isVerified: false,
      mutualFollowers: 2
    },
    {
      id: 4,
      username: 'suggested_user4',
      fullName: 'Suggested User 4',
      profilePicture: 'https://via.placeholder.com/32',
      isVerified: false,
      mutualFollowers: 1
    },
    {
      id: 5,
      username: 'suggested_user5',
      fullName: 'Suggested User 5',
      profilePicture: 'https://via.placeholder.com/32',
      isVerified: true,
      mutualFollowers: 8
    }
  ];

  const handleFollow = (userId) => {
    // Handle follow logic
    console.log('Follow user:', userId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Senin için öneriler</h3>
        <Link to="/explore" className="text-sm text-gray-600 hover:text-gray-900">
          Tümünü gör
        </Link>
      </div>

      <div className="space-y-3">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to={`/profile/${user.username}`}>
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
              </Link>
              <div className="ml-3 flex-1">
                <Link 
                  to={`/profile/${user.username}`}
                  className="font-semibold text-gray-900 hover:underline text-sm"
                >
                  {user.username}
                  {user.isVerified && (
                    <span className="ml-1 text-blue-500">✓</span>
                  )}
                </Link>
                <div className="text-gray-500 text-xs">
                  {user.mutualFollowers} ortak arkadaş
                </div>
              </div>
            </div>
            <button
              onClick={() => handleFollow(user.id)}
              className="text-blue-500 hover:text-blue-600 text-sm font-semibold"
            >
              Takip Et
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex flex-wrap gap-2">
            <Link to="/about" className="hover:underline">Hakkında</Link>
            <span>•</span>
            <Link to="/help" className="hover:underline">Yardım</Link>
            <span>•</span>
            <Link to="/press" className="hover:underline">Basın</Link>
            <span>•</span>
            <Link to="/api" className="hover:underline">API</Link>
            <span>•</span>
            <Link to="/jobs" className="hover:underline">İşler</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Gizlilik</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Şartlar</Link>
            <span>•</span>
            <Link to="/locations" className="hover:underline">Konumlar</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/language" className="hover:underline">Dil</Link>
            <span>•</span>
            <Link to="/meta" className="hover:underline">Meta Verified</Link>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-4">
          © 2024 INSTAGRAM FROM META
        </div>
      </div>
    </div>
  );
};

export default Suggestions;