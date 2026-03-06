# 🚀 Eventku Database Migration Guide

## 📁 File Structure

```
migration-export/
├── MASTER_MIGRATION.sql    # ⭐ SINGLE FILE - Run this first!
├── 00_enums.sql           # Enum types (separate file)
├── 01_tables.sql          # Table definitions (separate file)
├── 02_functions.sql       # Database functions (separate file)
├── 03_triggers.sql        # Triggers (separate file)
├── 04_rls_policies.sql    # Row Level Security (separate file)
├── 05_storage.sql         # Storage buckets (separate file)
├── 06_auth_trigger.sql    # Auth trigger (separate file)
├── 07_seed_data.sql       # Initial data (separate file)
└── README.md              # This file
```

---

## ⚡ Quick Start (Recommended)

### Option 1: Single File Migration

1. **Buka Supabase SQL Editor**
   - Login ke https://supabase.com/dashboard
   - Pilih project Anda
   - Buka **SQL Editor** di sidebar

2. **Copy & Paste**
   - Buka file `MASTER_MIGRATION.sql`
   - Copy semua isi file
   - Paste ke SQL Editor
   - Klik **Run**

3. **Selesai!** Database siap digunakan.

---

## 📋 Option 2: Step-by-Step Migration

Jika ingin menjalankan file satu peratu:

| Order | File | Description |
|-------|------|-------------|
| 1 | `00_enums.sql` | Custom enum types |
| 2 | `01_tables.sql` | Table definitions |
| 3 | `02_functions.sql` | Database functions |
| 4 | `03_triggers.sql` | Auto-update triggers |
| 5 | `04_rls_policies.sql` | Row Level Security |
| 6 | `05_storage.sql` | Storage buckets |
| 7 | `06_auth_trigger.sql` | Auth trigger |
| 8 | `07_seed_data.sql` | Initial seed data |

---

## 🔑 Required Environment Variables

Setelah migration, tambahkan environment variables di project Anda:

```env
# .env.local atau .env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Untuk Edge Functions (opsional)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Cara Mendapatkan Keys:
1. Buka https://supabase.com/dashboard
2. Pilih project
3. Klik **Settings** → **API**
4. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔐 Secrets Configuration (Untuk Edge Functions)

Jika menggunakan Edge Functions, tambahkan secrets di:
**Settings** → **Vault** → **Add new secret**

| Secret Name | Description |
|-------------|-------------|
| `MIDTRANS_SERVER_KEY` | Midtrans payment server key |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key |
| `MIDTRANS_IRIS_API_KEY` | Midtrans Iris for payouts |
| `RESEND_API_KEY` | Resend email service |
| `MAPBOX_PUBLIC_TOKEN` | Mapbox for maps |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business API |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone ID |
| `MANUAL_PAYMENT_BANK_NAME` | Bank name |
| `MANUAL_PAYMENT_ACCOUNT_NUMBER` | Account number |
| `MANUAL_PAYMENT_ACCOUNT_HOLDER` | Account holder |

---

## 📊 Database Statistics

| Component | Count |
|-----------|-------|
| **Tables** | 35+ |
| **Enums** | 8 |
| **Functions** | 10 |
| **Triggers** | 22 |
| **RLS Policies** | 100+ |
| **Storage Buckets** | 4 |

---

## 🗂️ Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `prize-images` | ✅ Yes | Gambar hadiah |
| `event-images` | ✅ Yes | Cover event |
| `payment-proofs` | ❌ No | Bukti transfer |
| `certificate-logos` | ✅ Yes | Logo sertifikat |

---

## 📋 Pricing Tiers (Seed Data)

| Tier | Price | Max Participants | Prizes |
|------|-------|------------------|--------|
| Free | Rp 0 | 50 | 5 Hiburan, 2 Utama, 1 Grand Prize |
| Basic | Rp 99.000 | 200 | 15 Hiburan, 5 Utama, 2 Grand Prize |
| Pro | Rp 299.000 | 500 | 30 Hiburan, 10 Utama, 5 Grand Prize |
| Enterprise | Rp 799.000 | 2000 | 100 Hiburan, 30 Utama, 15 Grand Prize |

---

## 📋 Affiliate Tiers (Seed Data)

| Tier | Commission | Min Conversions |
|------|------------|-----------------|
| Bronze | 10% | 0 |
| Silver | 12.5% | 5 |
| Gold | 15% | 15 |
| Platinum | 20% | 30 |

---

## ⚠️ Important Notes

1. **Auth Users tidak bisa di-migrate** - Users harus register ulang
2. **Storage Files** - Export manual dan upload ke bucket baru
3. **Edge Functions** - Perlu re-deploy ke project Supabase baru
4. **CORS** - Update di Settings → API → CORS

---

## 🛠️ Troubleshooting

### Error: "type already exists"
Jalankan satu per satu file, skip file yang sudah ada.

### Error: "relation already exists"
Table sudah ada, skip atau gunakan `DROP TABLE IF EXISTS` sebelum create.

### Error: "policy already exists"
Policy sudah ada, skip atau hapus dulu:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

---

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- Project Repository: https://github.com/bukdanaws-commits/eventkunext
