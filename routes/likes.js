const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/likes/post/:postId
// @desc    Gönderiyi beğen
// @access  Private
router.post('/post/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Bu gönderiyi zaten beğendiniz' });
    }

    post.likes.push(req.user._id);
    await post.save();

    res.json({ message: 'Gönderi beğenildi' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/likes/post/:postId
// @desc    Gönderi beğenisini kaldır
// @access  Private
router.delete('/post/:postId', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    post.likes = post.likes.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await post.save();

    res.json({ message: 'Beğeni kaldırıldı' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/likes/comment/:commentId
// @desc    Yorumu beğen
// @access  Private
router.post('/comment/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    if (comment.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Bu yorumu zaten beğendiniz' });
    }

    comment.likes.push(req.user._id);
    await comment.save();

    res.json({ message: 'Yorum beğenildi' });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/likes/comment/:commentId
// @desc    Yorum beğenisini kaldır
// @access  Private
router.delete('/comment/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    comment.likes = comment.likes.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await comment.save();

    res.json({ message: 'Beğeni kaldırıldı' });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;