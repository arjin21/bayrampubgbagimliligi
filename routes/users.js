const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:username
// @desc    Kullanıcı profilini getir
// @access  Public
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('-password -blockedUsers')
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Get user posts
    const posts = await Post.find({ author: user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName profilePicture')
      .populate('likes', 'username')
      .populate('comments');

    res.json({
      user,
      posts,
      postCount: posts.length,
      followerCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/profile
// @desc    Profil güncelleme
// @access  Private
router.put('/profile', [
  auth,
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad soyad 2-50 karakter arasında olmalıdır'),
  body('bio')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Bio en fazla 150 karakter olabilir'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Geçerli bir URL giriniz'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Geçerli bir telefon numarası giriniz'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', ''])
    .withMessage('Geçerli bir cinsiyet seçiniz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, bio, website, phone, gender } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profil başarıyla güncellendi',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/profile-picture
// @desc    Profil fotoğrafı güncelleme
// @access  Private
router.put('/profile-picture', auth, async (req, res) => {
  try {
    const { profilePicture } = req.body;

    if (!profilePicture) {
      return res.status(400).json({ message: 'Profil fotoğrafı gereklidir' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profil fotoğrafı başarıyla güncellendi',
      user
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/privacy
// @desc    Gizlilik ayarlarını güncelleme
// @access  Private
router.put('/privacy', [
  auth,
  body('isPrivate')
    .isBoolean()
    .withMessage('Geçerli bir gizlilik değeri giriniz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isPrivate } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPrivate },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Gizlilik ayarları güncellendi',
      user
    });
  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/notifications
// @desc    Bildirim ayarlarını güncelleme
// @access  Private
router.put('/notifications', auth, async (req, res) => {
  try {
    const { notifications } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notifications },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Bildirim ayarları güncellendi',
      user
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Kullanıcı takip etme
// @access  Private
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Kendinizi takip edemezsiniz' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Bu kullanıcıyı zaten takip ediyorsunuz' });
    }

    // Add to following
    currentUser.following.push(userId);
    await currentUser.save();

    // Add to followers
    userToFollow.followers.push(req.user._id);
    await userToFollow.save();

    res.json({
      message: 'Kullanıcı takip edildi',
      isFollowing: true
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/users/follow/:userId
// @desc    Kullanıcı takibi bırakma
// @access  Private
router.delete('/follow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);
    const userToUnfollow = await User.findById(userId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Remove from following
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();

    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await userToUnfollow.save();

    res.json({
      message: 'Kullanıcı takibi bırakıldı',
      isFollowing: false
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/users/followers/:userId
// @desc    Kullanıcının takipçilerini getir
// @access  Public
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username fullName profilePicture isPrivate',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      followers: user.followers,
      totalFollowers: user.followers.length,
      currentPage: page,
      totalPages: Math.ceil(user.followers.length / limit)
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/users/following/:userId
// @desc    Kullanıcının takip ettiklerini getir
// @access  Public
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username fullName profilePicture isPrivate',
        options: {
          skip: (page - 1) * limit,
          limit: limit
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      following: user.following,
      totalFollowing: user.following.length,
      currentPage: page,
      totalPages: Math.ceil(user.following.length / limit)
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/block/:userId
// @desc    Kullanıcı engelleme
// @access  Private
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'Kendinizi engelleyemezsiniz' });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const currentUser = await User.findById(req.user._id);

    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'Bu kullanıcı zaten engellenmiş' });
    }

    currentUser.blockedUsers.push(userId);
    await currentUser.save();

    res.json({ message: 'Kullanıcı engellendi' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/users/block/:userId
// @desc    Kullanıcı engelini kaldırma
// @access  Private
router.delete('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();

    res.json({ message: 'Kullanıcı engeli kaldırıldı' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;