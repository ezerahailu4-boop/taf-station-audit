# TAF ENERGIES — Station Information & Audit Management System

[![Neon Serverless PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL%2018%20Serverless-00E599?logo=postgresql&logoColor=white)](https://neon.tech)
[![Mobile Optimized](https://img.shields.io/badge/Mobile-Touch%20Optimized-3b82f6?logo=googlechrome&logoColor=white)](https://github.com/ezerahailu4-boop/taf-station-audit)
[![License: Proprietary](https://img.shields.io/badge/License-TAF%20Energies%20Internal-ea580c)](#)

A digital audit, compliance management, and photographic evidence verification platform designed specifically for **TAF Oil Ethiopia / TAF Energies** forecourt stations in Addis Ababa and surrounding regions.

---

## 🌟 Key Features

### 1. Zero Mock Data & Pure Field Audit Slate
- Completely clean initial state ready for real on-site inspections.
- No presets, mock placeholders, or fake sample data.
- Station name, Canopy ID, inspector attestation, pump counts, and compliance checks start completely fresh for each station inspection.

### 2. Mobile & Tablet Touch Optimized
- **Touch Steppers (`−` / `+`)**: One-tap increments/decrements for working vs broken dispensers on mobile touchscreens without frustrating soft-keyboard issues.
- **Direct Camera Integration**: Uses `capture="environment"` to trigger smartphone camera directly for on-site evidence capture.
- **Non-blocking Digital Signatures**: HTML5 signature canvas configured with `touch-action: none` and passive event prevention for smooth stylus and finger signing.
- **Adaptive Mobile Layout**: Header, checklist cards, and administrative table automatically adapt to responsive mobile card views.

### 3. Real Proof Photographic Evidence Annex (Page 3)
- **Authentic Evidence Protocol**: Replaces synthetic/AI mock images with genuine field photographic verification.
- **Official Forensic Watermarking**: Stamps uploaded photos with exact timestamp, item classification tag, and genuine on-site attestation.
- **Formal Verification Slots**: Page 3 incorporates standard TAF Energies equipment slots (Canopy Brand Elevation, Forecourt Dispensers & Breakaway Couplings, Fire Safety & Sand Buckets, and Lubricant Retail Displays).
- **Print & PDF Alignment**: Matches the exact layout, margins, and typography of official TAF Energies regulatory inspection documents.

### 4. Enterprise Neon Serverless PostgreSQL Backend
- **Real-time Synchronization**: Instant synchronization with Neon Serverless PostgreSQL pooler.
- **Database Schema**:
  - `station_audits`: Stores station identification, canopy ID, audit dates, compliance scores, dispenser uptime ratios, and structured checklists.
  - `audit_photos`: High-resolution inspection evidence with base64 storage, timestamps, and equipment linkage.
- **Live Fleet KPIs**: Real-time fleet health metrics, average compliance indices, dispenser availability percentages, and active corrective action tracking.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla Modern JavaScript (ES6+), Semantic HTML5, Custom CSS Design System (Inter & Outfit Google Fonts).
- **Database**: Neon Serverless PostgreSQL (`ep-rapid-surf-b5cbhx9h-pooler.c-7.us-east-2.aws.neon.tech`).
- **Serverless API**: Vercel Serverless Functions (`/api/neon/status`, `/api/audits`, `/api/audits/[id]`).
- **Local Dev Server**: Python 3.12 HTTP Server bridge (`server.py`).

---

## 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ezerahailu4-boop/taf-station-audit.git
   cd taf-station-audit
   ```

2. **Run local server:**
   ```bash
   python server.py
   ```
   Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment

The system is configured for continuous zero-config deployment on **Vercel**:
```bash
vercel --prod
```

---

## 📄 License
Copyright © 2026 TAF Energies Ethiopia. Internal Audit System. All rights reserved.
