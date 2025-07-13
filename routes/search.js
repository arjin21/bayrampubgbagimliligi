const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search/users
// @desc    Kullanıcı ara
// @access  Public
router.get('/users', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Arama terimi en az 2 karakter olmalıdır' });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { fullName: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    // If user is authenticated, exclude blocked users
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        query._id = { $nin: user.blockedUsers };
      }
    }

    const users = await User.find(query)
      .select('username fullName profilePicture isPrivate isVerified followerCount')
      .sort({ followerCount: -1, username: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      totalResults: totalUsers,
      hasMore: skip + users.length < totalUsers
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/posts
// @desc    Gönderi ara
// @access  Public
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Arama terimi en az 2 karakter olmalıdır' });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      $or: [
        { caption: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } },
        { location: { $regex: searchQuery, $options: 'i' } }
      ],
      isArchived: false,
      isHidden: false
    };

    // If user is authenticated, exclude posts from blocked users
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        query.author = { $nin: user.blockedUsers };
      }
    }

    const posts = await Post.find(query)
      .populate('author', 'username fullName profilePicture isPrivate')
      .populate('likes', 'username')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalPosts / parseInt(limit)),
      totalResults: totalPosts,
      hasMore: skip + posts.length < totalPosts
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/tags
// @desc    Etiket ara
// @access  Public
router.get('/tags', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: 'Arama terimi gereklidir' });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {
      tags: { $regex: searchQuery, $options: 'i' },
      isArchived: false,
      isHidden: false
    };

    // If user is authenticated, exclude posts from blocked users
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        query.author = { $nin: user.blockedUsers };
      }
    }

    // Get unique tags with post counts
    const tagStats = await Post.aggregate([
      { $match: query },
      { $unwind: '$tags' },
      {
        $match: {
          tags: { $regex: searchQuery, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$tags',
          postCount: { $sum: 1 }
        }
      },
      { $sort: { postCount: -1, _id: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const totalTags = await Post.aggregate([
      { $match: query },
      { $unwind: '$tags' },
      {
        $match: {
          tags: { $regex: searchQuery, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$tags'
        }
      },
      { $count: 'total' }
    ]);

    const totalCount = totalTags.length > 0 ? totalTags[0].total : 0;

    res.json({
      tags: tagStats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalResults: totalCount,
      hasMore: skip + tagStats.length < totalCount
    });
  } catch (error) {
    console.error('Search tags error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/suggestions
// @desc    Arama önerileri getir
// @access  Public
router.get('/suggestions', optionalAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = q.trim();

    let userQuery = {
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { fullName: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    let postQuery = {
      $or: [
        { caption: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ],
      isArchived: false,
      isHidden: false
    };

    // If user is authenticated, exclude blocked users
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        userQuery._id = { $nin: user.blockedUsers };
        postQuery.author = { $nin: user.blockedUsers };
      }
    }

    // Get top users
    const topUsers = await User.find(userQuery)
      .select('username fullName profilePicture isPrivate isVerified')
      .sort({ followerCount: -1 })
      .limit(5);

    // Get top posts
    const topPosts = await Post.find(postQuery)
      .populate('author', 'username fullName profilePicture')
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(5);

    // Get top tags
    const topTags = await Post.aggregate([
      { $match: postQuery },
      { $unwind: '$tags' },
      {
        $match: {
          tags: { $regex: searchQuery, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$tags',
          postCount: { $sum: 1 }
        }
      },
      { $sort: { postCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      suggestions: {
        users: topUsers,
        posts: topPosts,
        tags: topTags
      }
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/trending
// @desc    Trend konuları getir
// @access  Public
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { period = 'week' } = req.query; // day, week, month

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'day':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        break;
      case 'week':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
    }

    let query = {
      ...dateFilter,
      isArchived: false,
      isHidden: false
    };

    // If user is authenticated, exclude posts from blocked users
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        query.author = { $nin: user.blockedUsers };
      }
    }

    // Get trending tags
    const trendingTags = await Post.aggregate([
      { $match: query },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          postCount: { $sum: 1 },
          likeCount: { $sum: { $size: '$likes' } },
          commentCount: { $sum: { $size: '$comments' } }
        }
      },
      {
        $addFields: {
          score: { $add: ['$postCount', '$likeCount', '$commentCount'] }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);

    // Get trending posts
    const trendingPosts = await Post.find(query)
      .populate('author', 'username fullName profilePicture')
      .populate('likes', 'username')
      .populate('comments')
      .sort({ likeCount: -1, commentCount: -1, createdAt: -1 })
      .limit(10);

    res.json({
      trending: {
        tags: trendingTags,
        posts: trendingPosts
      }
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;