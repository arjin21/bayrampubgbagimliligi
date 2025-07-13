const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// @route   GET /api/search/users
// @desc    Kullanıcı arama
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Arama terimi gereklidir' });
    }

    const searchQuery = q.trim();
    const skip = (page - 1) * limit;

    // Kullanıcı adı veya tam ad ile arama
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Kendi hesabını hariç tut
        { _id: { $nin: req.user.blockedUsers } }, // Engellenen kullanıcıları hariç tut
        {
          $or: [
            { username: { $regex: searchQuery, $options: 'i' } },
            { fullName: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
      .select('username fullName profilePicture isVerified isPrivate followers')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ username: 1 });

    // Her kullanıcı için takip durumunu kontrol et
    const usersWithFollowStatus = users.map(user => {
      const userObj = user.toObject();
      userObj.isFollowing = user.followers.includes(req.user._id);
      userObj.isFollowedBy = req.user.following.includes(user._id);
      return userObj;
    });

    res.json(usersWithFollowStatus);
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/posts
// @desc    Gönderi arama
// @access  Private
router.get('/posts', protect, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Arama terimi gereklidir' });
    }

    const searchQuery = q.trim();
    const skip = (page - 1) * limit;

    // Hashtag arama
    const posts = await Post.find({
      $and: [
        { user: { $nin: req.user.blockedUsers } }, // Engellenen kullanıcıların postlarını hariç tut
        { isArchived: false },
        {
          $or: [
            { caption: { $regex: searchQuery, $options: 'i' } },
            { hashtags: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
      .populate('user', 'username fullName profilePicture isVerified isPrivate followers')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Gizli hesapların postlarını filtrele
    const filteredPosts = posts.filter(post => {
      if (post.user.isPrivate) {
        return req.user.following.includes(post.user._id) || post.user._id.toString() === req.user._id.toString();
      }
      return true;
    });

    // Her post için beğenme durumunu kontrol et
    const postsWithLikeStatus = filteredPosts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      postObj.isSaved = req.user.savedPosts.includes(post._id);
      return postObj;
    });

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Gönderi arama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/hashtags
// @desc    Hashtag arama
// @access  Private
router.get('/hashtags', protect, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Arama terimi gereklidir' });
    }

    let searchQuery = q.trim();
    // Hashtag sembolünü kaldır
    if (searchQuery.startsWith('#')) {
      searchQuery = searchQuery.substring(1);
    }

    const skip = (page - 1) * limit;

    // Hashtag'e göre post arama
    const posts = await Post.find({
      $and: [
        { user: { $nin: req.user.blockedUsers } },
        { isArchived: false },
        { hashtags: { $regex: `#${searchQuery}`, $options: 'i' } }
      ]
    })
      .populate('user', 'username fullName profilePicture isVerified isPrivate followers')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Gizli hesapların postlarını filtrele
    const filteredPosts = posts.filter(post => {
      if (post.user.isPrivate) {
        return req.user.following.includes(post.user._id) || post.user._id.toString() === req.user._id.toString();
      }
      return true;
    });

    // Her post için beğenme durumunu kontrol et
    const postsWithLikeStatus = filteredPosts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      postObj.isSaved = req.user.savedPosts.includes(post._id);
      return postObj;
    });

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Hashtag arama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/suggested
// @desc    Önerilen kullanıcılar
// @access  Private
router.get('/suggested', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Takip edilen kullanıcıların takip ettikleri kişileri bul
    const followingUsers = await User.find({
      _id: { $in: req.user.following }
    }).select('following');

    // Ortak takip edilen kullanıcıları topla
    const suggestedUserIds = new Set();
    followingUsers.forEach(user => {
      user.following.forEach(followingId => {
        if (!req.user.following.includes(followingId) && 
            followingId.toString() !== req.user._id.toString() &&
            !req.user.blockedUsers.includes(followingId)) {
          suggestedUserIds.add(followingId);
        }
      });
    });

    // Eğer yeterli öneri yoksa popüler kullanıcıları ekle
    if (suggestedUserIds.size < limit) {
      const popularUsers = await User.find({
        $and: [
          { _id: { $ne: req.user._id } },
          { _id: { $nin: req.user.following } },
          { _id: { $nin: req.user.blockedUsers } },
          { _id: { $nin: Array.from(suggestedUserIds) } }
        ]
      })
        .select('_id')
        .sort({ 'followers.length': -1 })
        .limit(limit - suggestedUserIds.size);

      popularUsers.forEach(user => {
        suggestedUserIds.add(user._id);
      });
    }

    // Önerilen kullanıcıları getir
    const suggestedUsers = await User.find({
      _id: { $in: Array.from(suggestedUserIds) }
    })
      .select('username fullName profilePicture isVerified followers')
      .limit(parseInt(limit));

    // Her kullanıcı için takip durumunu kontrol et
    const usersWithFollowStatus = suggestedUsers.map(user => {
      const userObj = user.toObject();
      userObj.isFollowing = false; // Zaten takip etmiyor
      userObj.isFollowedBy = user.followers.includes(req.user._id);
      return userObj;
    });

    res.json(usersWithFollowStatus);
  } catch (error) {
    console.error('Önerilen kullanıcılar getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/trending
// @desc    Trend hashtag'ler
// @access  Private
router.get('/trending', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Son 7 gün içindeki postları al
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const posts = await Post.find({
      createdAt: { $gte: weekAgo },
      isArchived: false,
      hashtags: { $exists: true, $ne: [] }
    }).select('hashtags');

    // Hashtag'leri say
    const hashtagCount = {};
    posts.forEach(post => {
      post.hashtags.forEach(hashtag => {
        hashtagCount[hashtag] = (hashtagCount[hashtag] || 0) + 1;
      });
    });

    // En çok kullanılan hashtag'leri sırala
    const trendingHashtags = Object.entries(hashtagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([hashtag, count]) => ({ hashtag, count }));

    res.json(trendingHashtags);
  } catch (error) {
    console.error('Trend hashtag getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/search/recent
// @desc    Son arama geçmişi
// @access  Private
router.get('/recent', protect, async (req, res) => {
  try {
    // Bu özellik için ayrı bir model gerekli olabilir
    // Şimdilik boş array dön
    res.json([]);
  } catch (error) {
    console.error('Son aramalar getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;