# WeatherFit

WeatherFit is a full-stack weather concierge that blends real-time forecasts with your personal wardrobe.

---

## Features
- Session-based auth with email/password login.
- Location manager with default location support and automatic geocoding via Open-Meteo.
- Wardrobe builder: categorize items (top/bottom/outerwear/footwear/accessory), set insulation, waterproof, UV, formality, color, and notes.
- Today dashboard that pulls hourly forecasts, highlights weather changes, and generates tailored outfits using saved clothing.

---

## Tech Stack
| Layer      | Technology |
|------------|------------|
| Frontend   | Vue 3 (Composition API), Vite, Pinia, Vue Router, Axios |
| Styling    | Tailwind-style utility classes (customised)            |
| Backend    | Node.js, Express, express-session, Sequelize ORM       |
| Database   | PostgreSQL (any Sequelize-compatible SQL engine)       |
| External   | Open-Meteo Geocoding & Forecast APIs                   |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MySQL (or equivalent configured in Sequelize)
- `.env` file in `backend/` with session secret + DB credentials

### Backend Setup
```bash
cd backend
npm install
# create backend/.env (see Environment Variables)
npm run dev      # or node src/index.js

Note: Vite proxies /api to the backend. If you deploy separately, update src/lib/api.js accordingly.
```

### Frontend Setup
```bash
cd weather-fit
npm install
npm run dev



