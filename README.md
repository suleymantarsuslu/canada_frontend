# Canada Ankara Event Management - Frontend

Kanada Ankara Büyükelçiliği etkinlik yönetim sistemi React frontend uygulaması.

## Özellikler

- React 18
- React Router
- Axios HTTP client
- i18next çoklu dil desteği
- Bootstrap CSS framework
- Tailwind CSS
- QR kod okuma
- PDF oluşturma
- Chart.js grafikler
- reCAPTCHA entegrasyonu

## Coolify ile Deploy

### Deploy Ayarları

1. **Repository**: Bu frontend klasörünü ayrı repository olarak deploy edin
2. **Build Context**: `.` (root directory)
3. **Dockerfile**: `Dockerfile`
4. **Port**: `3001`
5. **Domain**: `canada-ankara.com:3001`

### Build Süreci

Coolify otomatik olarak:
1. `Dockerfile` kullanarak multi-stage build yapacak
2. React uygulamasını build edecek
3. Nginx ile serve edecek
4. Port 3001'de çalıştıracak

### Nginx Konfigürasyonu

`nginx.conf` dosyası şu özellikleri sağlar:
- React Router için client-side routing desteği
- Static dosyalar için cache optimizasyonu
- Gzip compression
- API proxy (backend'e yönlendirme)

## API Bağlantısı

Frontend, backend API'sine şu adres üzerinden bağlanır:
- **Backend URL**: `https://backend.canada-ankara.com`

## Sayfalar

### Public Sayfalar
- `/` - Ana sayfa
- `/invitation/:qrId` - Davetiye sayfası
- `/rsvp/:qrId` - RSVP sayfası
- `/confirmation` - Onay sayfası

### Admin Sayfalar (Authentication gerekli)
- `/login` - Giriş sayfası
- `/checkin` - Check-in işlemleri
- `/manual-checkin` - Manuel check-in
- `/participants` - Katılımcı listesi
- `/users` - Kullanıcı yönetimi
- `/settings` - Etkinlik ayarları
- `/admin-settings` - Admin ayarları

## Çoklu Dil Desteği

- Türkçe (tr)
- İngilizce (en)
- Fransızca (fr)

## Gereksinimler

- Node.js 18+
- React 18
- Docker
- Coolify

## Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Development modunda çalıştır
npm start

# Production build oluştur
npm run build
```

## Build Komutları

```bash
# Docker image build et
docker build -t canada-frontend .

# Container çalıştır
docker run -p 3001:3001 canada-frontend
```

## Notlar

- Frontend port 3001'de çalışır
- Nginx ile serve edilir
- Backend API'sine CORS ile bağlanır
- SSL sertifikaları Coolify tarafından otomatik yönetilir
- Client-side routing desteklenir
- Static dosyalar cache edilir
