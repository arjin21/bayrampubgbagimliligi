const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/posts
// @desc    Yeni gönderi oluştur
// @access  Private
router.post('/', [
  auth,
  body('images')
    .isArray({ min: 1 })
    .withMessage('En az bir resim gereklidir'),
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Açıklama en fazla 2200 karakter olabilir'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Konum en fazla 100 karakter olabilir'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Etiketler dizi formatında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { images, caption, location, tags } = req.body;

    const post = new Post({
      author: req.user._id,
      images,
      caption: caption || '',
      location: location || '',
      tags: tags || []
    });

    await post.save();

    // Add post to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id }
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username fullName profilePicture')
      .populate('likes', 'username')
      .populate('comments');

    res.status(201).json({
      message: 'Gönderi başarıyla oluşturuldu',
      post: populatedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/feed
// @desc    Ana sayfa akışını getir
// @access  Private
router.get('/feed', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findById(req.user._id);
    
    // Get posts from users that current user follows
    const followingIds = user.following.map(id => id.toString());
    followingIds.push(req.user._id.toString()); // Include own posts

    const posts = await Post.find({
      author: { $in: followingIds },
      isArchived: false,
      isHidden: false
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username fullName profilePicture isPrivate')
    .populate('likes', 'username')
    .populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture'
      }
    });

    const totalPosts = await Post.countDocuments({
      author: { $in: followingIds },
      isArchived: false,
      isHidden: false
    });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page * limit < totalPosts
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/explore
// @desc    Keşfet sayfası gönderilerini getir
// @access  Public
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let query = { isArchived: false, isHidden: false };

    // If user is authenticated, exclude posts from blocked users
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        query.author = { $nin: user.blockedUsers };
      }
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username fullName profilePicture isPrivate')
      .populate('likes', 'username')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName profilePicture'
        }
      });

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page * limit < totalPosts
    });
  } catch (error) {
    console.error('Get explore error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/:postId
// @desc    Tekil gönderi getir
// @access  Public
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'username fullName profilePicture isPrivate')
      .populate('likes', 'username')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName profilePicture'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/posts/:postId
// @desc    Gönderi düzenle
// @access  Private
router.put('/:postId', [
  auth,
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Açıklama en fazla 2200 karakter olabilir'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Konum en fazla 100 karakter olabilir'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Etiketler dizi formatında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId } = req.params;
    const { caption, location, tags } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    const updateData = {};
    if (caption !== undefined) updateData.caption = caption;
    if (location !== undefined) updateData.location = location;
    if (tags !== undefined) updateData.tags = tags;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true }
    )
    .populate('author', 'username fullName profilePicture')
    .populate('likes', 'username')
    .populate('comments');

    res.json({
      message: 'Gönderi başarıyla güncellendi',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/posts/:postId
// @desc    Gönderi sil
// @access  Private
router.delete('/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    await Post.findByIdAndDelete(postId);

    // Remove post from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: postId }
    });

    res.json({ message: 'Gönderi başarıyla silindi' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts/:postId/archive
// @desc    Gönderiyi arşivle
// @access  Private
router.post('/:postId/archive', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    post.isArchived = true;
    await post.save();

    res.json({ message: 'Gönderi arşivlendi' });
  } catch (error) {
    console.error('Archive post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts/:postId/save
// @desc    Gönderiyi kaydet
// @access  Private
router.post('/:postId/save', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    const user = await User.findById(req.user._id);

    if (user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: 'Bu gönderi zaten kaydedilmiş' });
    }

    user.savedPosts.push(postId);
    await user.save();

    post.savedBy.push(req.user._id);
    await post.save();

    res.json({ message: 'Gönderi kaydedildi' });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/posts/:postId/save
// @desc    Gönderi kaydını kaldır
// @access  Private
router.delete('/:postId/save', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const user = await User.findById(req.user._id);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    user.savedPosts = user.savedPosts.filter(
      id => id.toString() !== postId
    );
    await user.save();

    post.savedBy = post.savedBy.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({ message: 'Gönderi kaydı kaldırıldı' });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/tag/:tag
// @desc    Etiket ile gönderi ara
// @access  Public
router.get('/tag/:tag', optionalAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let query = { 
      tags: { $regex: tag, $options: 'i' },
      isArchived: false,
      isHidden: false
    };

    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.blockedUsers.length > 0) {
        query.author = { $nin: user.blockedUsers };
      }
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username fullName profilePicture isPrivate')
      .populate('likes', 'username')
      .populate('comments');

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      tag,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      hasMore: page * limit < totalPosts
    });
  } catch (error) {
    console.error('Get posts by tag error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;