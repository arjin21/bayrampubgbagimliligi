import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';

const Stories = () => {
  // Mock stories data - in real app this would come from API
  const stories = [
    { id: 1, username: 'user1', image: 'https://via.placeholder.com/60', hasStory: true },
    { id: 2, username: 'user2', image: 'https://via.placeholder.com/60', hasStory: true },
    { id: 3, username: 'user3', image: 'https://via.placeholder.com/60', hasStory: false },
    { id: 4, username: 'user4', image: 'https://via.placeholder.com/60', hasStory: true },
    { id: 5, username: 'user5', image: 'https://via.placeholder.com/60', hasStory: false },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex space-x-4 overflow-x-auto">
        {/* Add Story */}
        <div className="flex flex-col items-center space-y-2 min-w-[60px]">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <FaPlus className="text-gray-600" />
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-600 truncate w-full text-center">Hikaye Ekle</span>
        </div>

        {/* Stories */}
        {stories.map((story) => (
          <Link
            key={story.id}
            to={`/stories/${story.username}`}
            className="flex flex-col items-center space-y-2 min-w-[60px]"
          >
            <div className="relative">
              <div className={`w-14 h-14 rounded-full p-0.5 ${
                story.hasStory 
                  ? 'bg-gradient-to-tr from-yellow-400 to-pink-600' 
                  : 'bg-gray-300'
              }`}>
                <img
                  src={story.image}
                  alt={story.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs text-gray-600 truncate w-full text-center">
              {story.username}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Stories;