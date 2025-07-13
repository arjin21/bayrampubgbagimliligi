const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');
const { uploadPostImages, handleMulterError } = require('../middleware/upload');
const { validatePost, validateComment } = require('../middleware/validation');

// @route   GET /api/posts/feed
// @desc    Ana sayfa gönderilerini getir
// @access  Private
router.get('/feed', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Takip edilen kullanıcıların postlarını getir
    const followingIds = req.user.following;
    followingIds.push(req.user._id); // Kendi postlarını da dahil et

    const posts = await Post.find({ 
      user: { $in: followingIds },
      isArchived: false 
    })
      .populate('user', 'username fullName profilePicture isVerified')
      .populate('comments', 'user text createdAt')
      .populate('comments.user', 'username fullName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Her post için beğenme durumunu kontrol et
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      postObj.isSaved = req.user.savedPosts.includes(post._id);
      return postObj;
    });

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Ana sayfa gönderileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/explore
// @desc    Keşfet sayfası gönderilerini getir
// @access  Private
router.get('/explore', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Engellenen ve gizli hesap olmayan kullanıcıların postlarını getir
    const blockedUsers = req.user.blockedUsers;
    const followingIds = req.user.following;

    const posts = await Post.find({ 
      user: { $nin: blockedUsers },
      isArchived: false 
    })
      .populate('user', 'username fullName profilePicture isVerified isPrivate followers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Gizli hesapların postlarını filtrele
    const filteredPosts = posts.filter(post => {
      if (post.user.isPrivate) {
        return followingIds.includes(post.user._id) || post.user._id.toString() === req.user._id.toString();
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
    console.error('Keşfet gönderileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/:postId
// @desc    Belirli bir gönderinin detaylarını getir
// @access  Private
router.get('/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'username fullName profilePicture isVerified')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username fullName profilePicture isVerified'
        }
      });

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Gizli hesap kontrolü
    if (post.user.isPrivate && !post.user.followers.includes(req.user._id) && post.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu gönderiyi görüntüleme yetkiniz yok' });
    }

    const postObj = post.toObject();
    postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
    postObj.isSaved = req.user.savedPosts.includes(post._id);

    res.json(postObj);
  } catch (error) {
    console.error('Gönderi detayı getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts
// @desc    Yeni gönderi oluştur
// @access  Private
router.post('/', protect, uploadPostImages, handleMulterError, validatePost, async (req, res) => {
  try {
    const { caption, location } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'En az bir resim yüklenmelidir' });
    }

    // Resim URL'lerini oluştur
    const images = req.files.map(file => ({
      url: `/uploads/posts/${file.filename}`,
      alt: caption || ''
    }));

    // Yeni gönderi oluştur
    const post = new Post({
      user: req.user._id,
      caption,
      images,
      location: location ? JSON.parse(location) : undefined
    });

    await post.save();

    // Kullanıcının post listesine ekle
    req.user.posts.push(post._id);
    await req.user.save();

    // Populate et
    await post.populate('user', 'username fullName profilePicture isVerified');

    res.status(201).json({
      message: 'Gönderi başarıyla oluşturuldu',
      post
    });
  } catch (error) {
    console.error('Gönderi oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/posts/:postId
// @desc    Gönderi sil
// @access  Private
router.delete('/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Sadece gönderi sahibi silebilir
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu gönderiyi silme yetkiniz yok' });
    }

    // Gönderiyi sil
    await Post.findByIdAndDelete(req.params.postId);

    // Kullanıcının post listesinden çıkar
    req.user.posts = req.user.posts.filter(postId => postId.toString() !== req.params.postId);
    await req.user.save();

    // Tüm kullanıcıların kaydettiği listesinden çıkar
    await User.updateMany(
      { savedPosts: req.params.postId },
      { $pull: { savedPosts: req.params.postId } }
    );

    res.json({ message: 'Gönderi başarıyla silindi' });
  } catch (error) {
    console.error('Gönderi silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts/:postId/like
// @desc    Gönderiyi beğen
// @access  Private
router.post('/:postId/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Zaten beğenmiş mi kontrol et
    const existingLike = post.likes.find(like => like.user.toString() === req.user._id.toString());

    if (existingLike) {
      return res.status(400).json({ message: 'Bu gönderiyi zaten beğendiniz' });
    }

    // Beğeni ekle
    post.likes.push({ user: req.user._id });
    await post.save();

    res.json({ message: 'Gönderi beğenildi', likesCount: post.likes.length });
  } catch (error) {
    console.error('Beğenme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/posts/:postId/like
// @desc    Gönderi beğenisini kaldır
// @access  Private
router.delete('/:postId/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Beğeni var mı kontrol et
    const existingLike = post.likes.find(like => like.user.toString() === req.user._id.toString());

    if (!existingLike) {
      return res.status(400).json({ message: 'Bu gönderiyi beğenmediniz' });
    }

    // Beğeniyi kaldır
    post.likes = post.likes.filter(like => like.user.toString() !== req.user._id.toString());
    await post.save();

    res.json({ message: 'Beğeni kaldırıldı', likesCount: post.likes.length });
  } catch (error) {
    console.error('Beğeni kaldırma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts/:postId/save
// @desc    Gönderiyi kaydet
// @access  Private
router.post('/:postId/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Zaten kaydetmiş mi kontrol et
    if (req.user.savedPosts.includes(req.params.postId)) {
      return res.status(400).json({ message: 'Bu gönderi zaten kaydedilmiş' });
    }

    // Kaydet
    req.user.savedPosts.push(req.params.postId);
    await req.user.save();

    res.json({ message: 'Gönderi kaydedildi' });
  } catch (error) {
    console.error('Kaydetme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/posts/:postId/save
// @desc    Gönderi kaydını kaldır
// @access  Private
router.delete('/:postId/save', protect, async (req, res) => {
  try {
    // Kaydetmiş mi kontrol et
    if (!req.user.savedPosts.includes(req.params.postId)) {
      return res.status(400).json({ message: 'Bu gönderi zaten kaydedilmemiş' });
    }

    // Kayıttan çıkar
    req.user.savedPosts = req.user.savedPosts.filter(postId => postId.toString() !== req.params.postId);
    await req.user.save();

    res.json({ message: 'Gönderi kayıttan çıkarıldı' });
  } catch (error) {
    console.error('Kayıt kaldırma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/posts/:postId/comments
// @desc    Gönderiye yorum yap
// @access  Private
router.post('/:postId/comments', protect, validateComment, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Yorumlar kapalı mı kontrol et
    if (post.commentsDisabled) {
      return res.status(403).json({ message: 'Bu gönderide yorumlar kapalı' });
    }

    // Yeni yorum oluştur
    const comment = new Comment({
      user: req.user._id,
      post: req.params.postId,
      text
    });

    await comment.save();

    // Gönderiyi güncelle
    post.comments.push(comment._id);
    await post.save();

    // Populate et
    await comment.populate('user', 'username fullName profilePicture isVerified');

    res.status(201).json({
      message: 'Yorum eklendi',
      comment
    });
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/posts/:postId/comments/:commentId
// @desc    Yorum sil
// @access  Private
router.delete('/:postId/comments/:commentId', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    // Sadece yorum sahibi veya gönderi sahibi silebilir
    const post = await Post.findById(req.params.postId);
    if (comment.user.toString() !== req.user._id.toString() && post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok' });
    }

    // Yorumu sil
    await Comment.findByIdAndDelete(req.params.commentId);

    // Gönderiyi güncelle
    post.comments = post.comments.filter(commentId => commentId.toString() !== req.params.commentId);
    await post.save();

    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/user/:username
// @desc    Kullanıcının gönderilerini getir
// @access  Private
router.get('/user/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Gizli hesap kontrolü
    if (user.isPrivate && !user.followers.includes(req.user._id) && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu hesap gizli' });
    }

    const posts = await Post.find({ 
      user: user._id,
      isArchived: false 
    })
      .populate('user', 'username fullName profilePicture isVerified')
      .sort({ createdAt: -1 });

    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      postObj.isSaved = req.user.savedPosts.includes(post._id);
      return postObj;
    });

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Kullanıcı gönderileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/posts/saved
// @desc    Kaydettiğim gönderileri getir
// @access  Private
router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: {
        path: 'user',
        select: 'username fullName profilePicture isVerified'
      }
    });

    const postsWithLikeStatus = user.savedPosts.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      postObj.isSaved = true;
      return postObj;
    });

    res.json(postsWithLikeStatus);
  } catch (error) {
    console.error('Kaydettiğim gönderiler getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;