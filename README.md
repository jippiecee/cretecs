# Cretecs — thrift shop (React + Vite + Lenis + Supabase)
1. `npm install`
2. Salin `.env.example` → `.env`, isi URL & anon key Supabase.
3. Supabase → SQL Editor → jalankan `supabase/schema.sql`.
4. Supabase → Authentication → aktifkan Email provider.
5. `npm run dev`

Tanpa `.env` web jalan dalam mode demo (produk lokal, tanpa login/order).

## Pembayaran
Checkout membuat row `orders` berstatus `pending`. Untuk bayar beneran, buat Supabase Edge Function
yang memanggil Midtrans/Xendit (server key jangan di frontend), lalu webhook-nya mengubah `status` jadi `paid`.
