const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { validateRegister, validateLogin, validatePasswordChange } = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Yeni kullanıcı kaydı
// @access  Public
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Kullanıcı adı veya email zaten var mı kontrol et
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Bu email adresi zaten kullanılıyor' : 'Bu kullanıcı adı zaten kullanılıyor' 
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      username,
      email,
      password,
      fullName
    });

    await user.save();

    // Token oluştur
    const token = generateToken(user._id);

    // Şifreyi response'dan çıkar
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre' });
    }

    // Şifreyi kontrol et
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz email veya şifre' });
    }

    // Kullanıcıyı online olarak işaretle
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    // Token oluştur
    const token = generateToken(user._id);

    // Şifreyi response'dan çıkar
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Giriş başarılı',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/auth/logout
// @desc    Kullanıcı çıkışı
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Kullanıcıyı offline olarak işaretle
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();

    res.json({ message: 'Çıkış başarılı' });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   GET /api/auth/me
// @desc    Mevcut kullanıcı bilgilerini getir
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'username fullName profilePicture')
      .populate('following', 'username fullName profilePicture');

    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Şifre değiştir
// @access  Private
router.put('/change-password', protect, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Mevcut şifreyi kontrol et
    const isMatch = await req.user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    // Yeni şifreyi kaydet
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Token doğrula
// @access  Private
router.post('/verify-token', protect, (req, res) => {
  res.json({ 
    message: 'Token geçerli',
    user: req.user 
  });
});

module.exports = router;