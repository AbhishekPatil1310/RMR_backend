
---

### 📝 README for Backend  

```markdown
# ⚙️ E-Commerce Backend

This is the backend of the E-Commerce application built with **Node.js + Express + Fastify**.  
It provides APIs for authentication, product management, orders, and user data.

---

## 🚀 Tech Stack
- Node.js
- Fastify
- MongoDb
- JWT (authentication)
- Bcrypt (password hashing)

---

## 📂 Folder Structure
RMR_repo/
│── RMR_backend-main/   # Backend (API server)
│   ├── backend/
│   │   ├── package.json
│   │   ├── server.js
│   │   └── src/
│   │       ├── app.js
│   │       ├── config/       # Database & environment configs
│   │       ├── controllers/  # Request controllers
│   │       ├── models/       # Database models
│   │       ├── plugins/      # JWT and other plugins
│   │       ├── routes/       # fastify routes
│   │       ├── services/     # External services (Supabase, etc.)
│   │       └── utils/        # Helpers (Mailer, Password, Token)


---

## ✨ Features

-Authentication (JWT-based login/register)

-User Management (CRUD via user.controller.js)

-Ads Management (ad.model.js)

-Feedback & Contact APIs

-Supabase integration

-Password hashing + token utilities

-Mailer utility for notifications

---
## ⚙️env
PORT=4000
MONGO_URI="mongoDb url"
JWT_SECRET="JWT secret"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET="cookie secret"
NODE_ENV=development
FRONTEND_URL=http://localhost:5173


EMAIL_USER = "you service email
EMAIL_PASS = "your app password"


SUPABASE_KEY="your supabase key"
SUPABASE_BUCKET=test
SUPABASE_URL="supabase url"


---

## ⚙️ Setup Instructions
1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   npm run dev

