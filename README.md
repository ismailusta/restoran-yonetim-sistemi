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
