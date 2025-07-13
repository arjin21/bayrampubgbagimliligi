# Instagram Clone - Full Stack Social Media Application

Modern teknolojiler kullanarak Instagram benzeri kapsamlı bir sosyal medya uygulaması. Gerçek zamanlı mesajlaşma, gönderi paylaşma, keşfet sayfası, detaylı hesap ayarları ve güvenlik özellikleri ile tam özellikli bir platform.

## 🚀 Özellikler

### 🔐 Kimlik Doğrulama ve Güvenlik
- Güvenli kullanıcı kaydı ve girişi
- JWT tabanlı kimlik doğrulama
- Şifre hashleme (bcrypt)
- İki faktörlü kimlik doğrulama desteği
- Şifre değiştirme ve sıfırlama
- Session yönetimi

### 👤 Kullanıcı Profili ve Hesap Yönetimi
- Kullanıcı profili oluşturma ve düzenleme
- Profil fotoğrafı yükleme
- Bio ve kişisel bilgiler
- Hesap gizlilik ayarları (açık/gizli hesap)
- Hesap doğrulama rozeti
- Detaylı hesap ayarları
- Bildirim tercihleri
- Gizlilik kontrolü

### 📱 Gönderi Yönetimi
- Çoklu resim paylaşma
- Açıklama ve konum ekleme
- Hashtag ve mention desteği
- Gönderi beğenme ve kaydetme
- Yorum yapma ve yanıtlama
- Gönderi silme ve düzenleme
- Gönderi arşivleme
- Yorumları kapatma/açma

### 🔍 Arama ve Keşfet
- Kullanıcı adı ve tam ad ile arama
- Hashtag arama
- Gönderi içerik arama
- Keşfet sayfası algoritması
- Önerilen kullanıcılar
- Trend hashtag'ler
- Arama geçmişi

### 💬 Gerçek Zamanlı Mesajlaşma
- Birebir mesajlaşma
- Grup mesajlaşma
- Resim ve dosya paylaşma
- Gönderi paylaşma
- Mesaj reaksiyonları
- Mesaj okundu bilgisi
- Yazıyor durumu gösterimi
- Mesaj silme ve düzenleme
- Konuşma sessiz alma
- Mesaj arşivleme

### 🤝 Sosyal Özellikler
- Takip etme/takip bırakma
- Takipçi ve takip edilen listeleri
- Kullanıcı engelleme
- Gizli hesap talebi sistemi
- Kullanıcı raporlama
- Önerilen arkadaşlar

### 🔔 Bildirim Sistemi
- Beğeni bildirimleri
- Yorum bildirimleri
- Takip bildirimleri
- Mesaj bildirimleri
- Bildirim ayarları
- Gerçek zamanlı bildirimler

## 🛠️ Teknolojiler

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Socket.io** - Real-time communication
- **Multer** - File uploads
- **Helmet** - Security middleware
- **Morgan** - Logging
- **Compression** - Response compression
- **Express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icons
- **React Intersection Observer** - Lazy loading
- **React Infinite Scroll** - Performance optimization

### Geliştirme Araçları
- **Nodemon** - Development server
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📦 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- MongoDB (v4.4 veya üzeri)
- npm veya yarn

### Backend Kurulumu

```bash
# Proje klasörüne gidin
cd backend

# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# MongoDB'yi başlatın
mongod

# Geliştirme sunucusunu başlatın
npm run dev
```

### Frontend Kurulumu

```bash
# Frontend klasörüne gidin
cd frontend

# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# Geliştirme sunucusunu başlatın
npm start
```

## 🔧 Yapılandırma

### Backend Çevre Değişkenleri (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/instagram-clone
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### Frontend Çevre Değişkenleri (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🚀 Kullanım

### Kullanıcı Kaydı
1. `/register` sayfasına gidin
2. Gerekli bilgileri doldurun
3. Hesap oluşturun ve otomatik giriş yapın

### Gönderi Paylaşma
1. Ana sayfada "+" butonuna tıklayın
2. Resim(ler) seçin
3. Açıklama ve konum ekleyin
4. Paylaşın

### Mesajlaşma
1. Mesajlar sayfasına gidin
2. Yeni konuşma başlatın
3. Gerçek zamanlı mesajlaşma yapın

### Keşfet
1. Keşfet sayfasına gidin
2. Önerilen gönderileri görüntüleyin
3. Yeni kullanıcıları keşfedin

## 🏗️ Proje Yapısı

```
instagram-clone/
├── backend/
│   ├── models/           # Veritabanı modelleri
│   ├── routes/           # API rotaları
│   ├── middleware/       # Orta katman yazılımları
│   ├── utils/            # Yardımcı fonksiyonlar
│   ├── uploads/          # Yüklenen dosyalar
│   ├── server.js         # Ana sunucu dosyası
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React bileşenleri
│   │   ├── pages/        # Sayfa bileşenleri
│   │   ├── contexts/     # React context'leri
│   │   ├── hooks/        # Custom hook'lar
│   │   ├── services/     # API servisleri
│   │   ├── types/        # TypeScript tipleri
│   │   ├── utils/        # Yardımcı fonksiyonlar
│   │   └── App.tsx       # Ana uygulama bileşeni
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Kullanıcı bilgileri
- `PUT /api/auth/change-password` - Şifre değiştirme

### Users
- `GET /api/users/profile/:username` - Profil görüntüleme
- `PUT /api/users/profile` - Profil güncelleme
- `POST /api/users/upload-profile-picture` - Profil fotoğrafı yükleme
- `POST /api/users/follow/:userId` - Takip etme
- `POST /api/users/unfollow/:userId` - Takip bırakma
- `GET /api/users/:userId/followers` - Takipçiler
- `GET /api/users/:userId/following` - Takip edilenler

### Posts
- `GET /api/posts/feed` - Ana sayfa gönderileri
- `GET /api/posts/explore` - Keşfet gönderileri
- `POST /api/posts` - Gönderi oluşturma
- `GET /api/posts/:postId` - Gönderi detayı
- `DELETE /api/posts/:postId` - Gönderi silme
- `POST /api/posts/:postId/like` - Beğenme
- `POST /api/posts/:postId/comments` - Yorum yapma

### Messages
- `GET /api/messages/conversations` - Konuşmalar
- `POST /api/messages/send` - Mesaj gönderme
- `GET /api/messages/conversation/:id` - Konuşma detayı
- `DELETE /api/messages/:messageId` - Mesaj silme

### Search
- `GET /api/search/users` - Kullanıcı arama
- `GET /api/search/posts` - Gönderi arama
- `GET /api/search/hashtags` - Hashtag arama
- `GET /api/search/suggested` - Önerilen kullanıcılar

## 🔐 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Şifre hashleme (bcrypt)
- İnput doğrulama ve sanitization
- Rate limiting
- CORS politikaları
- Helmet güvenlik middleware'i
- File upload güvenliği
- XSS ve injection saldırılarına karşı koruma

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
npm run build

# Production sunucusunu başlatın
npm start
```

### Frontend Deployment
```bash
# Production build
npm run build

# Build dosyalarını sunucuya yükleyin
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🎯 Gelecek Özellikler

- [ ] Stories özelliği
- [ ] IGTV benzeri video paylaşma
- [ ] Reels özelliği
- [ ] Shopping entegrasyonu
- [ ] Gelişmiş analytics
- [ ] Admin paneli
- [ ] Mobile uygulaması (React Native)
- [ ] PWA desteği
- [ ] Dark mode
- [ ] Çoklu dil desteği

## 🐛 Bilinen Sorunlar

- Büyük dosya yüklemelerinde performans sorunu
- Mobil cihazlarda bazı CSS uyumsuzlukları
- Safari'de socket bağlantı sorunları

## 📞 İletişim

Herhangi bir sorunuz varsa lütfen issue açın veya pull request gönderin.

---

⭐ Bu projeyi beğendiyseniz, lütfen yıldız verin!