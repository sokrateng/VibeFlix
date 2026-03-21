# VibeFlix

Netflix tarzinda proje katalogu. GitHub repolarinizi AI ile analiz eder, kategorize eder ve gorsel bir vitrin olarak sunar.

## Ozellikler

- **Netflix UI** — Hero slider, kategori satirlari, hover efektleri
- **AI Analiz** — Gemini veya Claude ile otomatik proje aciklamasi, kategori, ozellik listesi
- **Admin Panel** — Proje ekleme (GitHub dropdown), duzenleme, onay/red, dosya yukleme
- **Vitrin Sistemi** — Ana sayfada one cikarmak istediginiz projeleri secin, otomatik slider
- **Dosya Yukleme** — Ekran goruntuleri, PowerPoint sunumlar, HTML icerikler
- **Kategori Yonetimi** — Admin'den kategori ekle/duzenle/sil, AI otomatik eslestirir
- **AI Ayarlari** — Provider (Gemini/Claude), model ve API key admin panelden yonetilir
- **Yari Otomatik** — AI oner, sen onayla

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Next.js API Routes (Serverless) |
| Veritabani | Supabase (PostgreSQL) |
| Depolama | Supabase Storage |
| AI | Google Gemini / Anthropic Claude (secimli) |
| Deploy | Vercel |

## Kurulum

```bash
git clone https://github.com/sokrateng/VibeFlix.git
cd VibeFlix
npm install
```

`.env.local` dosyasi olusturun (`.env.local.example` sablonuna bakin):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GITHUB_TOKEN=...
ADMIN_TOKEN=...
```

Supabase'de `supabase/migrations/001_initial_schema.sql` dosyasini calistirin.

```bash
npm run dev
```

## Admin Panel

`/admin` adresinden token ile giris yapin.

**Sekmeler:**
- **Projeler** — GitHub dropdown'dan repo sec, AI analiz, onayla/reddet, dosya yukle
- **Kategoriler** — Yeni kategori ekle, duzenle, sil
- **AI Ayarlari** — Provider sec, API key gir, model sec, test et

**Proje Karti Ozellikleri:**
- Duzenle — Tum alanlari (aciklama, kategori, ozellikler, kullanim senaryosu) edit et
- AI Analiz — Projeyi yeniden analiz et
- Vitrin (★) — Ana sayfada one cikar
- Dosya Yukle — Screenshot, PPT, HTML ekle
- Sil — Projeyi kaldir

## Sayfa Yapisi

```
/                   → Ana sayfa (hero slider + kategori satirlari)
/project/[slug]     → Proje detay (carousel, ozellikler, dokumanlar)
/admin              → Admin panel
```

## Proje Detay Sayfasi

- Ekran goruntuleri carousel
- Kategori, son guncelleme, durum, karmasiklik
- Tech stack badge'leri
- Ozellikler listesi
- Kullanim senaryosu
- Proje aciklamasi (AI tarafindan)
- Proje dokumanlari (PPT inline viewer, HTML iframe)

## Lisans

MIT
