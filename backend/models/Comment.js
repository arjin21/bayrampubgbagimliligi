const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 2200
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: 2200
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, {
  timestamps: true
});

// Beğeni sayısını hesaplama
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Yanıt sayısını hesaplama
commentSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Mention'ları otomatik çıkarma
commentSchema.pre('save', async function(next) {
  if (this.isModified('text')) {
    const mentionRegex = /@[\w.]+/gi;
    const mentionMatches = this.text.match(mentionRegex) || [];
    
    if (mentionMatches.length > 0) {
      const User = mongoose.model('User');
      const usernames = mentionMatches.map(mention => mention.substring(1));
      
      try {
        const users = await User.find({ username: { $in: usernames } });
        this.mentions = users.map(user => user._id);
      } catch (error) {
        console.error('Mention işleme hatası:', error);
      }
    }
  }
  next();
});

// JSON çıktısında virtual alanları da dahil et
commentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);