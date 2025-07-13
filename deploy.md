# 🚀 Instagram Clone Deployment Guide

Bu rehber Instagram Clone uygulamanızı canlı ortama deploy etmek için adım adım talimatları içerir.

## 📋 Deployment Aşamaları

### 1. 🗄️ MongoDB Atlas Setup (Database)

1. **MongoDB Atlas'a kaydolun**: https://cloud.mongodb.com
2. **Yeni cluster oluşturun** (ücretsiz M0 tier)
3. **Database kullanıcısı oluşturun**:
   - Username: `instagram-user`
   - Password: `instagram-password`
4. **Network Access ayarlayın**: `0.0.0.0/0` (everywhere access)
5. **Connection string'i kopyalayın**:
   ```
   mongodb+srv://instagram-user:instagram-password@cluster0.xxxxx.mongodb.net/instagram-clone?retryWrites=true&w=majority
   ```

### 2. 🚂 Railway Backend Deployment

1. **Railway'e gidin**: https://railway.app
2. **GitHub ile giriş yapın**
3. **"New Project" → "Deploy from GitHub repo"**
4. **Instagram-clone repository'sini seçin**
5. **Backend folder'ını seçin**
6. **Environment Variables ekleyin**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://instagram-user:instagram-password@cluster0.xxxxx.mongodb.net/instagram-clone?retryWrites=true&w=majority
   JWT_SECRET=instagram_clone_production_jwt_secret_2024_super_secure_key
   JWT_EXPIRE=7d
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
7. **Deploy butonuna tıklayın**
8. **Railway URL'ini kopyalayın** (örn: `https://instagram-clone-backend.up.railway.app`)

### 3. ⚡ Vercel Frontend Deployment

1. **Vercel'e gidin**: https://vercel.com
2. **GitHub ile giriş yapın**
3. **"New Project" → GitHub repository seçin**
4. **Frontend folder'ını seçin**
5. **Environment Variables ekleyin**:
   ```
   REACT_APP_API_URL=https://instagram-clone-backend.up.railway.app/api
   REACT_APP_SOCKET_URL=https://instagram-clone-backend.up.railway.app
   GENERATE_SOURCEMAP=false
   ```
6. **Deploy butonuna tıklayın**
7. **Vercel URL'ini kopyalayın** (örn: `https://instagram-clone-frontend.vercel.app`)

### 4. 🔄 CORS Güncellemesi

1. **Railway backend'de environment variables'ı güncelleyin**:
   ```
   FRONTEND_URL=https://your-actual-vercel-url.vercel.app
   ```
2. **Backend'i redeploy edin**

## 🎯 Deployment Komutları

### Manuel Deployment

```bash
# Backend build ve deploy
cd backend
npm install --production
npm start

# Frontend build ve deploy
cd frontend
npm install
npm run build
```

### Otomatik Deployment

Her git push ile otomatik deploy edilir:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## 🔍 Deployment Doğrulama

### Backend Kontrolü
```bash
curl https://your-backend-url.railway.app/
# Response: {"message":"Instagram Clone API is running!","status":"healthy"}
```

### Frontend Kontrolü
```bash
curl https://your-frontend-url.vercel.app/
# HTML response döner
```

### Database Bağlantı Kontrolü
```bash
curl https://your-backend-url.railway.app/api/auth/me
# 401 Unauthorized (normal, token yok)
```

## 🌍 Live URLs

Deploy edildiğinde uygulamanız şu URL'lerde erişilebilir olacak:

- **Frontend**: https://instagram-clone-frontend.vercel.app
- **Backend API**: https://instagram-clone-backend.up.railway.app
- **API Docs**: https://instagram-clone-backend.up.railway.app/

## 🔧 Production Optimizasyonları

### Backend
- ✅ Helmet security middleware
- ✅ CORS production ayarları
- ✅ MongoDB connection pooling
- ✅ Error handling ve logging
- ✅ File upload güvenliği
- ✅ Rate limiting

### Frontend
- ✅ Production build optimization
- ✅ Code splitting
- ✅ Asset compression
- ✅ CDN caching
- ✅ Service worker (PWA ready)

## 🚨 Troubleshooting

### Yaygın Sorunlar

1. **CORS Errors**:
   - Backend'de FRONTEND_URL doğru ayarlandığından emin olun
   - Railway'de environment variables'ı kontrol edin

2. **Database Connection**:
   - MongoDB Atlas'ta network access ayarlarını kontrol edin
   - Connection string'in doğru olduğundan emin olun

3. **File Uploads**:
   - Railway'de file upload limitleri var
   - Büyük dosyalar için cloud storage (AWS S3) kullanın

4. **Socket.io Issues**:
   - WebSocket bağlantısı için doğru URL'i kullandığınızdan emin olun
   - Firewall ayarlarını kontrol edin

### Log Kontrolleri

```bash
# Railway logs
railway logs

# Vercel logs
vercel logs
```

## 📊 Performance Monitoring

### Railway Dashboard
- CPU usage
- Memory usage
- Request metrics
- Error rates

### Vercel Analytics
- Page load times
- Core Web Vitals
- User analytics
- Error tracking

## 🔒 Security Checklist

- ✅ JWT secrets güvenli
- ✅ Database credentials güvenli
- ✅ CORS properly configured
- ✅ Input validation
- ✅ File upload restrictions
- ✅ Rate limiting
- ✅ Helmet security headers

## 🎉 Deployment Tamamlandı!

Uygulamanız artık canlı! Kullanıcılar şu adreslerden erişebilir:

**Frontend**: https://instagram-clone-frontend.vercel.app
**API**: https://instagram-clone-backend.up.railway.app

---

## 📱 Test Kullanıcı Hesapları

Production'da test için örnek hesaplar:

```
Email: test@instagram.com
Password: Test123!

Email: demo@instagram.com  
Password: Demo123!
```

## 🔄 Güncelleme Süreci

```bash
# Kod değişikliği yap
git add .
git commit -m "Update: yeni özellik"
git push origin main

# Otomatik deploy başlar
# Railway: ~2-3 dakika
# Vercel: ~1-2 dakika
```

Tebrikler! Instagram Clone uygulamanız artık dünya çapında erişilebilir! 🌍✨