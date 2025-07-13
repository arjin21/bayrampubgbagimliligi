import React, { useEffect, useState } from 'react';
import { usePost } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import Stories from '../components/Stories';
import Suggestions from '../components/Suggestions';
import InfiniteScroll from 'react-infinite-scroll-component';
import { FaSpinner } from 'react-icons/fa';

const Home = () => {
  const { feed, loading, hasMore, currentPage, getFeed } = usePost();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  useEffect(() => {
    getFeed(1);
    setPage(1);
  }, [getFeed]);

  const loadMore = () => {
    const nextPage = page + 1;
    getFeed(nextPage);
    setPage(nextPage);
  };

  if (loading && feed.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Stories */}
          <div className="mb-6">
            <Stories />
          </div>

          {/* Posts */}
          {feed.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz gönderi yok</h3>
              <p className="text-gray-500 mb-6">
                Takip ettiğiniz kişilerin gönderilerini görmek için önce bazı kişileri takip edin.
              </p>
              <button className="btn btn-primary">
                Keşfet sayfasına git
              </button>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={feed.length}
              next={loadMore}
              hasMore={hasMore}
              loader={
                <div className="flex justify-center py-4">
                  <FaSpinner className="animate-spin h-6 w-6 text-gray-500" />
                </div>
              }
              endMessage={
                <div className="text-center py-4 text-gray-500">
                  Tüm gönderileri gördünüz!
                </div>
              }
            >
              <div className="space-y-6">
                {feed.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            {/* User Info */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center">
                <img
                  src={user?.profilePicture || 'https://via.placeholder.com/56'}
                  alt={user?.username}
                  className="w-14 h-14 rounded-full"
                />
                <div className="ml-3 flex-1">
                  <p className="font-semibold text-gray-900">{user?.username}</p>
                  <p className="text-gray-500 text-sm">{user?.fullName}</p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <Suggestions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;