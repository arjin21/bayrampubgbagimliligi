const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const { uploadProfilePicture, handleMulterError } = require('../middleware/upload');
const { validateProfileUpdate } = require('../middleware/validation');

// @route   GET /api/users/profile/:username
// @desc    Kullanıcı profilini getir
// @access  Private
router.get('/profile/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Eğer hesap gizli ise ve takip etmiyorsa sadece temel bilgileri göster
    if (user.isPrivate && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        isPrivate: user.isPrivate,
        isVerified: user.isVerified,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        isFollowing: false,
        isFollowedBy: false,
        isOwner: false
      });
    }

    // Takip durumunu kontrol et
    const isFollowing = user.followers.includes(req.user._id);
    const isFollowedBy = user.following.includes(req.user._id);
    const isOwner = user._id.toString() === req.user._id.toString();

    res.json({
      ...user.toObject(),
      isFollowing,
      isFollowedBy,
      isOwner
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/profile
// @desc    Profil güncelle
// @access  Private
router.put('/profile', protect, validateProfileUpdate, async (req, res) => {
  try {
    const { username, fullName, bio, email } = req.body;

    // Kullanıcı adı değişikliği kontrolü
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
    }

    // Email değişikliği kontrolü
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Bu email adresi zaten kullanılıyor' });
      }
    }

    // Profil güncelleme
    const updateFields = {};
    if (username) updateFields.username = username;
    if (fullName) updateFields.fullName = fullName;
    if (bio !== undefined) updateFields.bio = bio;
    if (email) updateFields.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profil başarıyla güncellendi',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/upload-profile-picture
// @desc    Profil fotoğrafı yükle
// @access  Private
router.post('/upload-profile-picture', protect, uploadProfilePicture, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenmedi' });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profil fotoğrafı başarıyla yüklendi',
      profilePicture: profilePictureUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Profil fotoğrafı yükleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Kullanıcıyı takip et
// @access  Private
router.post('/follow/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Kendinizi takip edemezsiniz' });
    }

    const targetUser = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Zaten takip ediyor mu kontrol et
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Bu kullanıcıyı zaten takip ediyorsunuz' });
    }

    // Takip et
    currentUser.following.push(userId);
    targetUser.followers.push(currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Kullanıcı başarıyla takip edildi' });
  } catch (error) {
    console.error('Takip etme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/unfollow/:userId
// @desc    Kullanıcıyı takip etmeyi bırak
// @access  Private
router.post('/unfollow/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Kendinizi takip etmeyi bırakamazsınız' });
    }

    const targetUser = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Takip ediyor mu kontrol et
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Bu kullanıcıyı zaten takip etmiyorsunuz' });
    }

    // Takip etmeyi bırak
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Kullanıcıyı takip etmeyi bıraktınız' });
  } catch (error) {
    console.error('Takip etmeyi bırakma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/users/:userId/followers
// @desc    Kullanıcının takipçilerini getir
// @access  Private
router.get('/:userId/followers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('followers', 'username fullName profilePicture isVerified')
      .select('followers isPrivate');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Gizli hesap kontrolü
    if (user.isPrivate && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu hesap gizli' });
    }

    res.json(user.followers);
  } catch (error) {
    console.error('Takipçi listesi getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/users/:userId/following
// @desc    Kullanıcının takip ettiklerini getir
// @access  Private
router.get('/:userId/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('following', 'username fullName profilePicture isVerified')
      .select('following isPrivate followers');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Gizli hesap kontrolü
    if (user.isPrivate && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu hesap gizli' });
    }

    res.json(user.following);
  } catch (error) {
    console.error('Takip edilen listesi getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/block/:userId
// @desc    Kullanıcıyı engelle
// @access  Private
router.post('/block/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Kendinizi engelleyemezsiniz' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Zaten engelli mi kontrol et
    if (req.user.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'Bu kullanıcı zaten engelli' });
    }

    // Engelle
    req.user.blockedUsers.push(userId);
    
    // Takip ilişkilerini kaldır
    req.user.following = req.user.following.filter(id => id.toString() !== userId);
    req.user.followers = req.user.followers.filter(id => id.toString() !== userId);
    
    targetUser.following = targetUser.following.filter(id => id.toString() !== currentUserId.toString());
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());

    await Promise.all([req.user.save(), targetUser.save()]);

    res.json({ message: 'Kullanıcı başarıyla engellendi' });
  } catch (error) {
    console.error('Engelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/users/unblock/:userId
// @desc    Kullanıcının engelini kaldır
// @access  Private
router.post('/unblock/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'Bu kullanıcı zaten engelli değil' });
    }

    // Engeli kaldır
    req.user.blockedUsers = req.user.blockedUsers.filter(id => id.toString() !== userId);
    await req.user.save();

    res.json({ message: 'Kullanıcının engeli kaldırıldı' });
  } catch (error) {
    console.error('Engel kaldırma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/privacy
// @desc    Gizlilik ayarlarını güncelle
// @access  Private
router.put('/privacy', protect, async (req, res) => {
  try {
    const { isPrivate } = req.body;

    req.user.isPrivate = isPrivate;
    await req.user.save();

    res.json({ 
      message: 'Gizlilik ayarları güncellendi',
      isPrivate: req.user.isPrivate 
    });
  } catch (error) {
    console.error('Gizlilik ayarları güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/users/settings
// @desc    Hesap ayarlarını güncelle
// @access  Private
router.put('/settings', protect, async (req, res) => {
  try {
    const { settings } = req.body;

    req.user.settings = { ...req.user.settings, ...settings };
    await req.user.save();

    res.json({ 
      message: 'Ayarlar güncellendi',
      settings: req.user.settings 
    });
  } catch (error) {
    console.error('Ayarlar güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;