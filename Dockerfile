# Build stage
FROM node:16-alpine as build

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci

# Kaynak kodunu kopyala
COPY . .

# React uygulamasını build et (OpenSSL legacy provider ile)
ENV NODE_OPTIONS="--openssl-legacy-provider"
RUN npm run build

# Production stage
FROM nginx:alpine

# Build edilmiş dosyaları nginx'e kopyala
COPY --from=build /app/build /usr/share/nginx/html

# Nginx konfigürasyonunu kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port'u expose et
EXPOSE 3001

# Nginx'i başlat
CMD ["nginx", "-g", "daemon off;"]
