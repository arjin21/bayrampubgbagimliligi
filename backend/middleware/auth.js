const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Yetkisiz erişim - Kullanıcı bulunamadı' });
      }
      
      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return res.status(401).json({ message: 'Yetkisiz erişim - Geçersiz token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkisiz erişim - Token bulunamadı' });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = { protect, generateToken };