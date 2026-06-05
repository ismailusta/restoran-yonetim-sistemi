# Restoran Yönetim Sistemi

Gerçek zamanlı sipariş takip ve KDS (Kitchen Display System) demo uygulaması.

## Yapı

```
/client   → Next.js + Tailwind + PWA + Socket.io-client
/server   → Express + Socket.io + Telegram Bot
```

## Kurulum

```bash
npm install
```

### Server ortam değişkenleri

`server/.env` dosyası oluşturun:

```env
PORT=4000
CLIENT_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Telegram değişkenleri opsiyoneldir — tanımlanmazsa bildirimler devre dışı kalır.

### Client ortam değişkenleri (opsiyonel)

`client/.env.local`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
```

## Çalıştırma

```bash
npm run dev
```

- Client: http://localhost:3000
- Server: http://localhost:4000

## Ekranlar

| Sayfa | Açıklama |
|-------|----------|
| `/waiter` | Garson — sipariş alma (mobil dikey) |
| `/kitchen` | Mutfak KDS — yemek siparişleri (yatay) |
| `/bar` | Bar KDS — içecek siparişleri (yatay) |

## Demo Akışı

1. `/kitchen` ve `/bar` sayfalarını ayrı sekmelerde açın
2. `/waiter` sayfasından sipariş oluşturup **Gönder**'e basın
3. Yemekler mutfağa, içecekler bara anında düşer
4. Telegram'a bildirim gider (yapılandırıldıysa)
5. KDS ekranında **Hazır — Yazdır** ile sanal termal yazıcı simülasyonu

## Canlıya Alma (Deploy)

### Mimari

```
GitHub Repo
    ├── /server  →  Railway   (WebSocket + API)
    └── /client  →  Vercel    (Next.js arayüz)
```

### 1. GitHub'a push

```bash
git add .
git commit -m "Restoran KDS demo"
git push origin main
```

### 2. Server → Railway

1. https://railway.app → **New Project** → **Deploy from GitHub repo**
2. Repo'yu seç → servis ayarları:
   - **Root Directory:** `server`
   - **Start Command:** `npm start` (otomatik gelir)
3. **Variables** sekmesine ekle:

```env
CLIENT_URL=https://SENIN-APP.vercel.app
TELEGRAM_BOT_TOKEN=opsiyonel
TELEGRAM_CHAT_ID=opsiyonel
```

4. **Settings → Networking → Generate Domain** → URL'i kopyala  
   Örnek: `https://restoran-server-production.up.railway.app`
5. Test: `https://SENIN-SERVER-URL/health` → `{"status":"ok"}`

### 3. Client → Vercel

1. https://vercel.com → **Add New Project** → GitHub repo'yu import et
2. Ayarlar:
   - **Root Directory:** `client`
   - **Framework:** Next.js (otomatik)
3. **Environment Variables:**

```env
NEXT_PUBLIC_SERVER_URL=https://SENIN-SERVER-URL
```

4. **Deploy** → URL'i kopyala  
   Örnek: `https://restoran-kds.vercel.app`

### 4. CORS güncelle

Railway'deki `CLIENT_URL` değişkenini Vercel'in gerçek URL'si yap → **Redeploy**.

### 5. Demo testi

| Sekme | URL |
|-------|-----|
| Garson | `https://SENIN-APP.vercel.app/waiter` |
| Mutfak | `https://SENIN-APP.vercel.app/kitchen` |
| Bar | `https://SENIN-APP.vercel.app/bar` |

Garson'dan sipariş gönder → mutfak ve bar ekranlarına anında düşmeli.
