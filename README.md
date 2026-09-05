# Mom & Bébé 🍼💊

A specialized, sleep-deprived-friendly web application designed for postpartum recovery and infant bottle feeding care.

## Core Features

- **Mom's Medication Management**:
  - Scheduled staggered pain relief: Acetaminophen (12:00 & 6:00) & Ibuprofen (3:00 & 9:00).
  - PRN medications: Flexeril (min 6h) & Oxycodone (min 4h).
  - **Active Conflict Warning**: Prevents taking Flexeril and Oxycodone concurrently.
  - Daily 9:00 PM Escitalopram maintenance dose tracker.
  - Hydration & recovery tracking.
- **Baby's Bottle Feeding**:
  - Default unit in **Milliliters (ML)** with 1-tap **Ounces (OZ)** conversion.
  - Instant volume presets (30, 60, 75, 90, 120, 150 ml).
  - 3-hour feeding window countdown timer with audio chime and browser notification.
- **1-Tap Diaper Tracker**:
  - Instant logging for **Wet**, **Dirty**, and **Both**.
  - Rolling 24-hour tally for pediatrician visits.
- **Pediatrician Reports & Data Persistence**:
  - Rolling 24h/48h summaries.
  - 1-click JSON backup export & restore.
- **Night Nursery Mode**:
  - Ultra-dim OLED dark theme with warm amber accents.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- LocalStorage / IndexedDB persistence
