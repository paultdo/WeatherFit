# WeatherFit

WeatherFit is a full-stack web app that finds forecast details and picks an outfit for you.

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
| Backend    | Node.js, Express, express-session, Sequelize ORM       |
| Database   | MySQL (any Sequelize-compatible SQL engine)       |
| External   | Open-Meteo Geocoding & Forecast APIs                   |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MySQL (or equivalent configured in Sequelize)

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

```
### Database
In backend/.env, change env variables to match your database. 
Then, run npm run sync to create database tables.




