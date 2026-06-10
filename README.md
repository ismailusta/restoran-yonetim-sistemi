# Restoran Yönetim Sistemi

Garson sipariş ekranı + 3 termal yazıcı (kasa, mutfak, bar) entegrasyonu.

## Yapı

```
/client       → Next.js garson ekranı (Vercel)
/server       → Express + Socket.io (Railway)
/print-agent  → Termal yazıcı köprüsü (kasa PC — Windows)
```

## Akış

| Aksiyon | Ne olur |
|---------|---------|
| **Gönder** | Mutfak ürünleri → mutfak yazıcısı, bar ürünleri → bar yazıcısı. Sepet temizlenir. |
| **Adisyon Yazdır** | Tüm sipariş + toplam → kasa yazıcısı. Sepet kalır. |

## Kurulum (geliştirme)

```bash
npm install
```

### Server (`server/.env`)

```env
PORT=4000
CLIENT_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=opsiyonel
TELEGRAM_CHAT_ID=opsiyonel
```

### Print Agent (`print-agent/.env`)

```env
# npm run dev ile test → localhost
# Canlı kasa PC → Railway URL
SERVER_URL=http://localhost:4000
PRINTER_CASHIER=POS-80
SIMULATE_PRINT=false
```

**Önemli:** Client ve print-agent **aynı server'a** bağlanmalı!
- Local test: ikisi de `http://localhost:4000`
- Canlı: ikisi de Railway URL

### Çalıştırma

```bash
npm run dev
```

- Client: http://localhost:3000/waiter
- Server: http://localhost:4000
- Print Agent: arka planda Socket.io dinler

## Canlıya Alma

### Server → Railway

- Root Directory: `server`
- `CLIENT_URL` = Vercel URL

### Client → Vercel

- Root Directory: `client`
- `NEXT_PUBLIC_SERVER_URL` = Railway URL

### Print Agent → Kasa PC (Windows)

Sadece garsonun kullandığı bilgisayara kurulur. 3 USB termal yazıcı bağlı olmalı.

1. Node.js 20+ kur
2. Repo'yu klonla veya sadece `print-agent` klasörünü kopyala
3. `print-agent/.env` oluştur:

```env
SERVER_URL=https://server-production-cb2c.up.railway.app
RESTAURANT_NAME=PANORAMA RESTORAN
PRINTER_CASHIER=KASA-80
PRINTER_KITCHEN=MUTFAK-80
PRINTER_BAR=BAR-80
SIMULATE_PRINT=false
```

4. Windows'ta yazıcı adlarını kontrol et: **Ayarlar → Yazıcılar**

```bash
cd print-agent
npm install
npm start
```

## Windows'ta Otomatik Başlatma (pm2)

```bash
npm install -g pm2
npm install -g pm2-windows-startup

cd print-agent
pm2 start src/index.js --name restoran-print
pm2 save
pm2-startup install
```

Bilgisayar her açıldığında print agent arka planda başlar.

## Yazıcı Kurulumu

| Yazıcı | Windows adı | Fiş |
|--------|---------------|-----|
| Kasa | `KASA-80` | Adisyon (toplam dahil) |
| Mutfak | `MUTFAK-80` | Yemek siparişleri |
| Bar | `BAR-80` | İçecek siparişleri |

Üç yazıcı aynı PC'ye USB ile bağlanır. Her birine Windows'ta **farklı isim** verin.
