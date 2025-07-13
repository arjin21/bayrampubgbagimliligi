const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/comments
// @desc    Yorum ekle
// @access  Private
router.post('/', [
  auth,
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Yorum 1-1000 karakter arasında olmalıdır'),
  body('postId')
    .notEmpty()
    .withMessage('Gönderi ID gereklidir'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir üst yorum ID giriniz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, postId, parentCommentId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    // Check if comments are allowed
    if (!post.allowComments) {
      return res.status(400).json({ message: 'Bu gönderiye yorum yapılamaz' });
    }

    const comment = new Comment({
      author: req.user._id,
      post: postId,
      content,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(comment._id);
        await parentComment.save();
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username fullName profilePicture')
      .populate('likes', 'username');

    res.status(201).json({
      message: 'Yorum başarıyla eklendi',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/comments/post/:postId
// @desc    Gönderinin yorumlarını getir
// @access  Public
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const comments = await Comment.find({
      post: postId,
      parentComment: null // Only top-level comments
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'username fullName profilePicture')
    .populate('likes', 'username')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username fullName profilePicture'
      }
    });

    const totalComments = await Comment.countDocuments({
      post: postId,
      parentComment: null
    });

    res.json({
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      hasMore: page * limit < totalComments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/comments/:commentId
// @desc    Yorum düzenle
// @access  Private
router.put('/:commentId', [
  auth,
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Yorum 1-1000 karakter arasında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate('author', 'username fullName profilePicture')
      .populate('likes', 'username');

    res.json({
      message: 'Yorum başarıyla güncellendi',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/comments/:commentId
// @desc    Yorum sil
// @access  Private
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    // Check if user owns the comment or is admin
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId }
    });

    // If it's a reply, remove from parent comment
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: commentId }
      });
    }

    // Delete all replies to this comment
    if (comment.replies.length > 0) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Yorum başarıyla silindi' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/comments/:commentId/replies
// @desc    Yorumun yanıtlarını getir
// @access  Public
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const comment = await Comment.findById(commentId)
      .populate({
        path: 'replies',
        options: {
          skip: (page - 1) * limit,
          limit: limit,
          sort: { createdAt: 1 }
        },
        populate: {
          path: 'author',
          select: 'username fullName profilePicture'
        }
      });

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    res.json({
      replies: comment.replies,
      currentPage: page,
      totalPages: Math.ceil(comment.replies.length / limit),
      hasMore: page * limit < comment.replies.length
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;