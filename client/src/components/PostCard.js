import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePost } from '../contexts/PostContext';
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaPaperPlane, 
  FaBookmark, 
  FaRegBookmark,
  FaEllipsisH,
  FaMapMarkerAlt
} from 'react-icons/fa';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';

dayjs.extend(relativeTime);
dayjs.locale('tr');

const PostCard = ({ post }) => {
  const { user } = useAuth();
  const { likePost, unlikePost, savePost, unsavePost } = usePost();
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(like => like._id === user?._id || like === user?._id)
  );
  const [isSaved, setIsSaved] = useState(
    user?.savedPosts?.includes(post._id)
  );

  const handleLike = async () => {
    if (isLiked) {
      await unlikePost(post._id);
      setIsLiked(false);
    } else {
      await likePost(post._id);
      setIsLiked(true);
    }
  };

  const handleSave = async () => {
    if (isSaved) {
      await unsavePost(post._id);
      setIsSaved(false);
    } else {
      await savePost(post._id);
      setIsSaved(true);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addComment(post._id, commentText);
      setCommentText('');
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  const displayedComments = showAllComments 
    ? post.comments 
    : post.comments?.slice(-2);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to={`/profile/${post.author.username}`}>
            <img
              src={post.author.profilePicture || 'https://via.placeholder.com/32'}
              alt={post.author.username}
              className="w-8 h-8 rounded-full"
            />
          </Link>
          <div className="ml-3">
            <Link 
              to={`/profile/${post.author.username}`}
              className="font-semibold text-gray-900 hover:underline"
            >
              {post.author.username}
            </Link>
            {post.location && (
              <div className="flex items-center text-gray-500 text-sm">
                <FaMapMarkerAlt className="mr-1" />
                {post.location}
              </div>
            )}
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <FaEllipsisH />
        </button>
      </div>

      {/* Post Image */}
      <div className="relative">
        {post.images && post.images.length > 0 && (
          <img
            src={post.images[0]}
            alt="Post"
            className="w-full h-auto"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`text-2xl transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-500'
              }`}
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
            </button>
            <Link to={`/post/${post._id}`}>
              <FaComment className="text-2xl text-gray-700 hover:text-gray-500 cursor-pointer" />
            </Link>
            <FaPaperPlane className="text-2xl text-gray-700 hover:text-gray-500 cursor-pointer" />
          </div>
          <button
            onClick={handleSave}
            className={`text-2xl transition-colors ${
              isSaved ? 'text-gray-900' : 'text-gray-700 hover:text-gray-500'
            }`}
          >
            {isSaved ? <FaBookmark /> : <FaRegBookmark />}
          </button>
        </div>

        {/* Likes Count */}
        {post.likes && post.likes.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold text-gray-900">
              {formatNumber(post.likes.length)} beğenme
            </span>
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <span className="font-semibold text-gray-900 mr-2">
              {post.author.username}
            </span>
            <span className="text-gray-900">{post.caption}</span>
          </div>
        )}

        {/* Comments */}
        {post.comments && post.comments.length > 0 && (
          <div className="mb-2">
            {post.comments.length > 2 && !showAllComments && (
              <button
                onClick={() => setShowAllComments(true)}
                className="text-gray-500 text-sm mb-1 hover:text-gray-700"
              >
                {post.comments.length - 2} yorum daha görüntüle
              </button>
            )}
            {displayedComments.map((comment) => (
              <div key={comment._id} className="mb-1">
                <span className="font-semibold text-gray-900 mr-2">
                  {comment.author.username}
                </span>
                <span className="text-gray-900">{comment.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-2">
            {post.tags.map((tag, index) => (
              <Link
                key={index}
                to={`/search?q=${tag}`}
                className="text-blue-600 hover:text-blue-500 mr-2"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-gray-500 text-xs">
          {dayjs(post.createdAt).fromNow()}
        </div>
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleComment} className="flex items-center">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Yorum ekle..."
            className="flex-1 border-none outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className={`text-blue-500 font-semibold text-sm ml-2 ${
              commentText.trim() ? 'opacity-100' : 'opacity-50'
            }`}
          >
            Paylaş
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostCard;