const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { uploadMessageImage, handleMulterError } = require('../middleware/upload');
const { validateMessage } = require('../middleware/validation');

// @route   GET /api/messages/conversations
// @desc    Konuşmaları getir
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      'deletedBy.user': { $ne: req.user._id }
    })
      .populate('participants', 'username fullName profilePicture isOnline lastSeen')
      .populate('lastMessage')
      .populate('lastMessage.sender', 'username fullName profilePicture')
      .sort({ lastActivity: -1 });

    // Okunmamış mesaj sayısını ekle
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          isRead: false,
          isDeleted: false
        });

        const conversationObj = conversation.toObject();
        conversationObj.unreadCount = unreadCount;
        
        // Kullanıcının sessiz aldığı konuşmayı kontrol et
        const isMuted = conversation.mutedBy.some(mute => mute.user.toString() === req.user._id.toString());
        conversationObj.isMuted = isMuted;

        return conversationObj;
      })
    );

    res.json(conversationsWithUnreadCount);
  } catch (error) {
    console.error('Konuşmalar getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/messages/conversation/:conversationId
// @desc    Konuşma detaylarını getir
// @access  Private
router.get('/conversation/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'username fullName profilePicture isOnline lastSeen');

    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    // Kullanıcının bu konuşmada olup olmadığını kontrol et
    if (!conversation.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Bu konuşmaya erişim yetkiniz yok' });
    }

    // Konuşmanın silinip silinmediğini kontrol et
    const deletedByUser = conversation.deletedBy.find(d => d.user.toString() === req.user._id.toString());
    if (deletedByUser) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Mesajları getir
    const messages = await Message.find({
      conversation: req.params.conversationId,
      isDeleted: false
    })
      .populate('sender', 'username fullName profilePicture')
      .populate('sharedPost', 'images caption user')
      .populate('sharedPost.user', 'username fullName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mesajları okundu olarak işaretle
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user._id },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      conversation,
      messages: messages.reverse() // Eski mesajlardan yeni mesajlara doğru sırala
    });
  } catch (error) {
    console.error('Konuşma detayları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/messages/conversation
// @desc    Yeni konuşma başlat
// @access  Private
router.post('/conversation', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Kullanıcı ID gereklidir' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Kendinizle konuşma başlatamazsınız' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Varolan konuşmayı kontrol et
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
      isGroup: false
    });

    if (existingConversation) {
      // Silinmiş konuşmayı geri getir
      existingConversation.deletedBy = existingConversation.deletedBy.filter(
        d => d.user.toString() !== req.user._id.toString()
      );
      await existingConversation.save();

      await existingConversation.populate('participants', 'username fullName profilePicture isOnline lastSeen');
      return res.json(existingConversation);
    }

    // Yeni konuşma oluştur
    const conversation = new Conversation({
      participants: [req.user._id, userId],
      isGroup: false
    });

    await conversation.save();
    await conversation.populate('participants', 'username fullName profilePicture isOnline lastSeen');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Konuşma başlatma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/messages/send
// @desc    Mesaj gönder
// @access  Private
router.post('/send', protect, uploadMessageImage, handleMulterError, validateMessage, async (req, res) => {
  try {
    const { conversationId, text, messageType, sharedPostId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: 'Konuşma ID gereklidir' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    // Kullanıcının bu konuşmada olup olmadığını kontrol et
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Bu konuşmaya mesaj gönderme yetkiniz yok' });
    }

    // Mesaj verisini hazırla
    const messageData = {
      conversation: conversationId,
      sender: req.user._id,
      messageType: messageType || 'text'
    };

    if (messageType === 'text') {
      if (!text || text.trim() === '') {
        return res.status(400).json({ message: 'Metin mesajı boş olamaz' });
      }
      messageData.text = text;
    } else if (messageType === 'image') {
      if (!req.file) {
        return res.status(400).json({ message: 'Resim yüklenmedi' });
      }
      messageData.image = {
        url: `/uploads/messages/${req.file.filename}`,
        alt: text || ''
      };
      if (text) messageData.text = text;
    } else if (messageType === 'post') {
      if (!sharedPostId) {
        return res.status(400).json({ message: 'Paylaşılacak gönderi ID gereklidir' });
      }
      messageData.sharedPost = sharedPostId;
      if (text) messageData.text = text;
    }

    // Mesajı oluştur
    const message = new Message(messageData);
    await message.save();

    // Konuşmayı güncelle
    conversation.messages.push(message._id);
    await conversation.updateLastMessage(message._id);

    // Populate et
    await message.populate('sender', 'username fullName profilePicture');
    if (messageType === 'post') {
      await message.populate('sharedPost', 'images caption user');
      await message.populate('sharedPost.user', 'username fullName profilePicture');
    }

    res.status(201).json({
      message: 'Mesaj gönderildi',
      data: message
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Mesaj sil
// @access  Private
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    // Sadece mesaj sahibi silebilir
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu mesajı silme yetkiniz yok' });
    }

    // Mesajı sil
    await message.deleteMessage();

    res.json({ message: 'Mesaj silindi' });
  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mesajı okundu olarak işaretle
// @access  Private
router.put('/:messageId/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    // Mesajı okundu olarak işaretle
    await message.markAsRead();

    res.json({ message: 'Mesaj okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Mesaj okundu işaretleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/messages/:messageId/reaction
// @desc    Mesaja reaksiyon ekle
// @access  Private
router.post('/:messageId/reaction', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji gereklidir' });
    }

    // Varolan reaksiyonu kontrol et
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      // Reaksiyonu güncelle
      existingReaction.emoji = emoji;
    } else {
      // Yeni reaksiyon ekle
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await message.save();

    res.json({ message: 'Reaksiyon eklendi' });
  } catch (error) {
    console.error('Reaksiyon ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/messages/:messageId/reaction
// @desc    Mesajdan reaksiyonu kaldır
// @access  Private
router.delete('/:messageId/reaction', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı' });
    }

    // Reaksiyonu kaldır
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    await message.save();

    res.json({ message: 'Reaksiyon kaldırıldı' });
  } catch (error) {
    console.error('Reaksiyon kaldırma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/messages/conversation/:conversationId/mute
// @desc    Konuşmayı sessiz al
// @access  Private
router.put('/conversation/:conversationId/mute', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    // Kullanıcının bu konuşmada olup olmadığını kontrol et
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Bu konuşmaya erişim yetkiniz yok' });
    }

    await conversation.muteConversation(req.user._id);

    res.json({ message: 'Konuşma sessiz alındı' });
  } catch (error) {
    console.error('Konuşma sessiz alma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/messages/conversation/:conversationId/unmute
// @desc    Konuşmanın sesini aç
// @access  Private
router.put('/conversation/:conversationId/unmute', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    // Kullanıcının bu konuşmada olup olmadığını kontrol et
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Bu konuşmaya erişim yetkiniz yok' });
    }

    await conversation.unmuteConversation(req.user._id);

    res.json({ message: 'Konuşmanın sesi açıldı' });
  } catch (error) {
    console.error('Konuşma sesini açma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   DELETE /api/messages/conversation/:conversationId
// @desc    Konuşmayı sil
// @access  Private
router.delete('/conversation/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Konuşma bulunamadı' });
    }

    // Kullanıcının bu konuşmada olup olmadığını kontrol et
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Bu konuşmaya erişim yetkiniz yok' });
    }

    // Konuşmayı kullanıcı için sil
    const existingDelete = conversation.deletedBy.find(
      d => d.user.toString() === req.user._id.toString()
    );

    if (!existingDelete) {
      conversation.deletedBy.push({ user: req.user._id });
      await conversation.save();
    }

    res.json({ message: 'Konuşma silindi' });
  } catch (error) {
    console.error('Konuşma silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;