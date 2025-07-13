const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    maxlength: 2200,
    default: ''
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, default: '' }
  }],
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
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  commentsDisabled: {
    type: Boolean,
    default: false
  },
  hideLikesCount: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Beğeni sayısını hesaplama
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Yorum sayısını hesaplama
postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Hashtag'leri otomatik çıkarma
postSchema.pre('save', function(next) {
  if (this.isModified('caption')) {
    const hashtagRegex = /#[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
    this.hashtags = this.caption.match(hashtagRegex) || [];
    this.hashtags = this.hashtags.map(tag => tag.toLowerCase());
  }
  next();
});

// Mention'ları otomatik çıkarma
postSchema.pre('save', async function(next) {
  if (this.isModified('caption')) {
    const mentionRegex = /@[\w.]+/gi;
    const mentionMatches = this.caption.match(mentionRegex) || [];
    
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
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);