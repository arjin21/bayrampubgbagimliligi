const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    maxlength: 100
  },
  groupImage: {
    type: String,
    default: ''
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mutedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedAt: {
      type: Date,
      default: Date.now
    }
  }],
  archivedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Son mesajı güncelleme
conversationSchema.methods.updateLastMessage = function(messageId) {
  this.lastMessage = messageId;
  this.lastActivity = new Date();
  return this.save();
};

// Kullanıcıyı konuşmadan çıkarma
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.toString() !== userId.toString());
  return this.save();
};

// Kullanıcıyı konuşmaya ekleme
conversationSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
  return this.save();
};

// Konuşmayı sessiz alma
conversationSchema.methods.muteConversation = function(userId) {
  const existingMute = this.mutedBy.find(m => m.user.toString() === userId.toString());
  if (!existingMute) {
    this.mutedBy.push({ user: userId });
  }
  return this.save();
};

// Konuşmanın sesini açma
conversationSchema.methods.unmuteConversation = function(userId) {
  this.mutedBy = this.mutedBy.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);