const { body, validationResult } = require('express-validator');

// Doğrulama hatalarını kontrol et
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Doğrulama hatası',
      errors: errors.array()
    });
  }
  next();
};

// Kayıt doğrulama kuralları
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Kullanıcı adı 3-20 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad soyad 2-50 karakter arasında olmalıdır'),
  
  handleValidationErrors
];

// Giriş doğrulama kuralları
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir'),
  
  handleValidationErrors
];

// Post oluşturma doğrulama kuralları
const validatePost = [
  body('caption')
    .optional()
    .isLength({ max: 2200 })
    .withMessage('Açıklama 2200 karakterden uzun olamaz'),
  
  handleValidationErrors
];

// Yorum doğrulama kuralları
const validateComment = [
  body('text')
    .notEmpty()
    .withMessage('Yorum metni gereklidir')
    .isLength({ max: 2200 })
    .withMessage('Yorum 2200 karakterden uzun olamaz'),
  
  handleValidationErrors
];

// Mesaj doğrulama kuralları
const validateMessage = [
  body('text')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Mesaj 1000 karakterden uzun olamaz'),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'post', 'location'])
    .withMessage('Geçersiz mesaj tipi'),
  
  handleValidationErrors
];

// Profil güncelleme doğrulama kuralları
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Kullanıcı adı 3-20 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad soyad 2-50 karakter arasında olmalıdır'),
  
  body('bio')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Bio 150 karakterden uzun olamaz'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  
  handleValidationErrors
];

// Şifre değiştirme doğrulama kuralları
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre gereklidir'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePost,
  validateComment,
  validateMessage,
  validateProfileUpdate,
  validatePasswordChange,
  handleValidationErrors
};