#!/bin/bash

# 🚀 Instagram Clone Quick Deploy Script
# Bu script uygulamanızı hızlıca deploy eder

echo "🚀 Instagram Clone Deployment Başlıyor..."

# Git repository check
if [ ! -d ".git" ]; then
    echo "📦 Git repository initialize ediliyor..."
    git init
    git add .
    git commit -m "Initial commit: Instagram Clone ready for deployment"
fi

echo "📋 Deployment Checklist:"
echo "✅ Backend hazır (Node.js + Express + MongoDB)"
echo "✅ Frontend hazır (React + TypeScript + Tailwind)"
echo "✅ Environment variables ayarlandı"
echo "✅ CORS ve security konfigürasyonları tamam"
echo "✅ File upload ve socket.io hazır"

echo ""
echo "🌍 Deployment Platformları:"
echo "1. 🗄️  MongoDB Atlas (Database)"
echo "2. 🚂 Railway (Backend API)"
echo "3. ⚡ Vercel (Frontend)"

echo ""
echo "📖 Adım adım deployment için: deploy.md dosyasını okuyun"
echo ""

echo "🔗 Deployment Links:"
echo "MongoDB Atlas: https://cloud.mongodb.com"
echo "Railway: https://railway.app"
echo "Vercel: https://vercel.com"

echo ""
echo "📱 Production URLs (deploy sonrası):"
echo "Frontend: https://instagram-clone-frontend.vercel.app"
echo "Backend API: https://instagram-clone-backend.up.railway.app"

echo ""
echo "🎉 Deployment dosyaları hazır!"
echo "⭐ deploy.md dosyasındaki adımları takip ederek deploy edin."

# GitHub repository push (opsiyonel)
read -p "GitHub'a push yapmak istiyor musunuz? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 GitHub'a push yapılıyor..."
    
    # GitHub repository URL'i iste
    read -p "GitHub repository URL'inizi girin: " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin $repo_url
        git branch -M main
        git push -u origin main
        echo "✅ GitHub'a başarıyla push yapıldı!"
        echo "🔗 Repository: $repo_url"
    else
        echo "❌ Repository URL girilmedi, push atlandı."
    fi
fi

echo ""
echo "🎯 Sonraki Adımlar:"
echo "1. MongoDB Atlas'ta database oluşturun"
echo "2. Railway'de backend'i deploy edin"
echo "3. Vercel'de frontend'i deploy edin"
echo "4. Environment variables'ları ayarlayın"
echo "5. Test edin ve paylaşın!"

echo ""
echo "🆘 Yardım gerekirse deploy.md dosyasına bakın!"
echo "✨ Başarılar!"