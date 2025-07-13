const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/messages
// @desc    Mesaj gönder
// @access  Private
router.post('/', [
  auth,
  body('recipientId')
    .isMongoId()
    .withMessage('Geçerli bir alıcı ID giriniz'),
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Mesaj 1-1000 karakter arasında olmalıdır'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'file'])
    .withMessage('Geçerli bir mesaj tipi giriniz'),
  body('mediaUrl')
    .optional()
    .isURL()
    .withMessage('Geçerli bir medya URL giriniz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, content, messageType = 'text', mediaUrl = '' } = req.body;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Alıcı bulunamadı' });
    }

    // Check if recipient is blocked
    const currentUser = await User.findById(req.user._id);
    if (currentUser.blockedUsers.includes(recipientId)) {
      return res.status(400).json({ message: 'Bu kullanıcıya mesaj gönderemezsiniz' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      messageType,
      mediaUrl
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName profilePicture')
      .populate('recipient', 'username fullName profilePicture');

    res.status(201).json({
      message: 'Mesaj başarıyla gönderildi',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/messages/conversations
// @desc    Kullanıcının konuşmalarını getir
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all conversations for the current user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ],
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user information
    const populatedConversations = await Message.populate(conversations, [
      {
        path: '_id',
        select: 'username fullName profilePicture isOnline lastSeen',
        model: 'User'
      },
      {
        path: 'lastMessage.sender',
        select: 'username fullName profilePicture',
        model: 'User'
      },
      {
        path: 'lastMessage.recipient',
        select: 'username fullName profilePicture',
        model: 'User'
      }
    ]);

    res.json(populatedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/messages/:userId
// @desc    Belirli bir kullanıcı ile olan mesajları getir
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ],
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username fullName profilePicture')
    .populate('recipient', 'username fullName profilePicture');

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ],
      isDeleted: false
    });

    res.json({
      messages: messages.reverse(), // Show oldest first
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      hasMore: page * limit < totalMessages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mesajı okundu olarak işaretle
// @access  Private
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    // Check if user is the recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({ message: 'Mesaj okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Mesaj sil
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    message.isDeleted = true;
    message.deletedFor.push(req.user._id);
    await message.save();

    res.json({ message: 'Mesaj silindi' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/messages/:messageId/reactions
// @desc    Mesaja tepki ekle
// @access  Private
router.post('/:messageId/reactions', [
  auth,
  body('emoji')
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji 1-10 karakter arasında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ message: 'Bu tepkiyi zaten verdiniz' });
    }

    message.reactions.push({
      user: req.user._id,
      emoji
    });

    await message.save();

    res.json({ message: 'Tepki eklendi' });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/messages/:messageId/reactions
// @desc    Mesaj tepkisini kaldır
// @access  Private
router.delete('/:messageId/reactions', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    message.reactions = message.reactions.filter(
      reaction => !(reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji)
    );

    await message.save();

    res.json({ message: 'Tepki kaldırıldı' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;