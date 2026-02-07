# IchanStore - Toko Panel Pterodactyl dengan QRIS Atlantic Pedia

Website toko panel Pterodactyl dengan integrasi sistem QRIS menggunakan API Atlantic Pedia untuk pembayaran otomatis dan auto-create server.

## 🚀 Fitur Utama

- **Modern Glassmorphism Design**: UI yang elegan dengan efek glassmorphism
- **QRIS Payment Integration**: Pembayaran otomatis via QRIS Atlantic Pedia
- **Automatic Server Creation**: Server dibuat otomatis setelah pembayaran berhasil
- **Real-time Payment Verification**: Verifikasi pembayaran real-time
- **Transaction Management**: Create, check status, dan cancel deposit

## 📋 Daftar Paket

| Paket | Harga | Spesifikasi |
|-------|-------|-------------|
| Panel 1GB | Rp11.000/bulan | RAM 1GB, CPU 40%, Disk 10GB |
| Panel 2GB | Rp15.000/bulan | RAM 2GB, CPU 70%, Disk 10GB |
| Panel 3GB | Rp19.700/bulan | RAM 3GB, CPU 100%, Disk 10GB |
| Panel 4GB | Rp26.500/bulan | RAM 4GB, CPU 120%, Disk 10GB |
| Unlimited 1 Bulan | Rp30.000 | RAM Unlimited, CPU Unlimited |
| Unlimited 2 Bulan | Rp42.000 | RAM Unlimited, CPU Unlimited |
| Unlimited 3 Bulan | Rp50.000 | RAM Unlimited, CPU Unlimited |
| Unlimited 4 Bulan | Rp67.000 | RAM Unlimited, CPU Unlimited |

## 🛠️ Setup & Instalasi

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Edit file `config.js` dengan API key Anda:
- **ATLANTIC_API_KEY**: API Key dari Atlantic Pedia (REQUIRED)
- **PTERO_DOMAIN**: Domain Pterodactyl panel Anda
- **PTERO_API_KEY**: Application API Key dari Pterodactyl
- **PTERO_CLIENT_KEY**: Client API Key dari Pterodactyl

### 3. Jalankan Backend API
```bash
node backend.js
```

### 4. Jalankan Website
Buka browser dan kunjungi: `http://localhost:3000`

## 📱 Cara Penggunaan

1. **Pilih Paket**: Klik pada paket yang diinginkan
2. **Klik Beli**: Sistem akan membuat QRIS Atlantic Pedia
3. **Scan QRIS**: Scan kode QR dengan aplikasi e-wallet
4. **Bayar**: Lakukan pembayaran melalui QRIS
5. **Auto Verify**: Sistem otomatis mendeteksi pembayaran
6. **Server Created**: Server Pterodactyl dibuat otomatis

## 🤖 API Atlantic Pedia Integration

### Endpoints yang Digunakan:
- **Create Deposit**: `POST /deposit/create` - Membuat QRIS
- **Check Status**: `POST /deposit/status` - Mengecek status pembayaran
- **Cancel Deposit**: `POST /deposit/cancel` - Membatalkan transaksi

### Fitur Atlantic Pedia:
- ✅ QRIS Payment Gateway
- ✅ Real-time status checking
- ✅ Auto-expired handling
- ✅ Transaction management
- ✅ Multiple payment methods support

## 📊 Struktur File

```
ichanstore/
├── produks.html          # Website frontend utama
├── backend.js            # Backend API server dengan Atlantic Pedia
├── config.js             # Konfigurasi API keys
├── atlantic.js           # Integrasi Atlantic Pedia API
├── ptero.js              # Integrasi Pterodactyl
├── package.json          # Dependencies Node.js
└── README.md            # Dokumentasi ini
```

## 🔗 API Endpoints

### Create Deposit/QRIS
```
GET /create-deposit?package={code}
```
**Response:**
```json
{
  "status": "success",
  "deposit_id": "DEP-123456",
  "qr_image": "https://...",
  "qr_string": "000201...",
  "amount": 11000,
  "expired_at": "2024-01-01T10:00:00Z"
}
```

### Check Deposit Status
```
GET /deposit-status/{deposit_id}
```
**Response:**
```json
{
  "status": "success",
  "payment_status": "PAID",
  "server": {
    "id": "123",
    "username": "admin",
    "password": "P@ssw0rd123!"
  }
}
```

### Cancel Deposit
```
POST /cancel-deposit
Content-Type: application/json
{
  "depositId": "DEP-123456"
}
```

## 🔄 Flow Pembayaran

1. **User klik "BELI SEKARANG"**
2. **System call `/create-deposit`**
3. **Atlantic Pedia generate QRIS**
4. **Modal QRIS ditampilkan**
5. **User scan & bayar QRIS**
6. **System auto-check status setiap 5 detik**
7. **Payment success → Create Pterodactyl server**
8. **Show credentials to user**

## 📝 Catatan

- Pastikan ATLANTIC_API_KEY valid dan memiliki saldo
- Server Pterodactyl harus dapat diakses dari backend
- QRIS expired dalam waktu tertentu sesuai Atlantic Pedia
- Sistem auto-create server setelah pembayaran berhasil

## 🐛 Troubleshooting

### QRIS tidak muncul
- Cek ATLANTIC_API_KEY di config.js
- Pastikan koneksi internet stabil
- Cek log server untuk error details

### Server tidak dibuat
- Verifikasi PTERO_API_KEY dan domain
- Cek konfigurasi egg dan nest ID
- Pastikan Pterodactyl panel online

### Payment stuck di pending
- QRIS mungkin expired
- User belum melakukan pembayaran
- Cek status manual via `/deposit-status/{id}`</content>
<parameter name="filePath">c:\Users\Administrator\Desktop\whopp\README.md