const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Depolama konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    
    // Uploads klasörü yoksa oluştur
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Dosya tipine göre alt klasör oluştur
    let subFolder = '';
    if (file.fieldname === 'profilePicture') {
      subFolder = 'profiles';
    } else if (file.fieldname === 'postImages') {
      subFolder = 'posts';
    } else if (file.fieldname === 'messageImage') {
      subFolder = 'messages';
    } else {
      subFolder = 'misc';
    }
    
    const finalPath = path.join(uploadPath, subFolder);
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
    
    cb(null, finalPath);
  },
  filename: function (req, file, cb) {
    // Dosya adını benzersiz yap
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarını kabul et
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
    files: 10 // Maksimum 10 dosya
  },
  fileFilter: fileFilter
});

// Profil resmi yükleme
const uploadProfilePicture = upload.single('profilePicture');

// Post resimleri yükleme (çoklu)
const uploadPostImages = upload.array('postImages', 10);

// Mesaj resmi yükleme
const uploadMessageImage = upload.single('messageImage');

// Grup resmi yükleme
const uploadGroupImage = upload.single('groupImage');

// Hata yönetimi middleware'i
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Dosya boyutu çok büyük' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Çok fazla dosya yüklendi' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Beklenmeyen dosya alanı' });
    }
  }
  
  if (err.message === 'Sadece resim dosyaları yüklenebilir') {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
};

module.exports = {
  uploadProfilePicture,
  uploadPostImages,
  uploadMessageImage,
  uploadGroupImage,
  handleMulterError
};