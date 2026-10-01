# MERN User Authentication & JWT

A beginner-friendly, secure authentication system built with the MERN stack. Users can register, log in, view a protected dashboard and log out. The JWT is stored in an **HTTP-only cookie** (never in `localStorage`).

## 1. Project overview

| Part | What it does |
|------|--------------|
| **React (Vite)** | Pages: Home, Register, Login, Dashboard |
| **Express + Node.js** | REST API with JWT middleware |
| **MongoDB + Mongoose** | Stores users (with bcrypt-hashed passwords) |

## 2. Features

- Register with validation (name, email, password, confirm password)
- Passwords hashed with **bcryptjs**; plain passwords are never stored
- Login creates a signed **JWT** that expires (default 1 day)
- JWT sent in an **HTTP-only cookie**
- Protected API route (`GET /api/auth/me`) guarded by middleware
- Protected React route (`/dashboard`)
- Logout clears the cookie
- Central error handling, Helmet security headers, rate limiting on login/register

## 3. Tech stack

| Area | Tools | Why |
|------|-------|-----|
| Frontend | React, Vite, React Router, Axios | UI, fast dev server, page navigation, API calls |
| Backend | Node.js, Express | Runs JavaScript on the server and builds the API |
| Database | MongoDB, Mongoose | Stores data; Mongoose adds schemas and validation |
| Security | bcryptjs, jsonwebtoken, cookie-parser, helmet, express-rate-limit | Hashing, tokens, reading cookies, safe headers, brute-force protection |
| Config | dotenv, cors | Secrets in `.env`; allow only our frontend |
| Tools | Postman, Git/GitHub | API testing, version control |

## 4. Architecture

```
 Browser (React, :5173)                Express API (:5000)               MongoDB
 ┌────────────────────┐   HTTP + cookie  ┌─────────────────────────┐      ┌──────────┐
 │ Pages / Components │ ───────────────► │ Routes → Middleware →   │ ───► │  users   │
 │ AuthContext        │ ◄─────────────── │ Controllers → Models    │ ◄─── │collection│
 │ Axios (credentials)│   JSON response  └─────────────────────────┘      └──────────┘
 └────────────────────┘
```

## 5. Folder structure

```
mern-authentication/
├── client/
│   ├── src/
│   │   ├── components/   Navbar.jsx, ProtectedRoute.jsx
│   │   ├── context/      AuthContext.jsx
│   │   ├── pages/        Home.jsx, Login.jsx, Register.jsx, Dashboard.jsx
│   │   ├── services/     api.js
│   │   ├── App.jsx, main.jsx, index.css
│   ├── .env.example, index.html, package.json, vite.config.js, vercel.json
├── server/
│   ├── config/db.js
│   ├── controllers/authController.js
│   ├── middleware/       authMiddleware.js, errorMiddleware.js
│   ├── models/User.js
│   ├── routes/authRoutes.js
│   ├── utils/generateToken.js
│   ├── .env.example, .gitignore, package.json, server.js
├── postman/MERN-Auth.postman_collection.json
├── .gitignore, package.json, README.md
```

## 6. Authentication flow

**Register**
```
React form → POST /api/auth/register → validate → email exists? → bcrypt.hash
          → save in MongoDB → 201 { success, message }
```

**Login**
```
React form → POST /api/auth/login → find user → bcrypt.compare → jwt.sign
          → Set-Cookie: authToken (HttpOnly) → 200 { user }
```

**Protected request**
```
React → GET /api/auth/me (browser attaches cookie automatically)
      → protect middleware → jwt.verify → load user → req.user
      → controller → 200 { user }          (no/invalid token → 401)
```

**Page refresh:** React calls `/api/auth/me` on start. If the cookie is valid, the user stays logged in.

## 7. Installation

Requirements: Node.js 18+, and MongoDB (local install or a free MongoDB Atlas cluster).

```bash
git clone <your-repo-url>
cd mern-authentication

# Backend
cd server
npm install
cp .env.example .env      # Windows: copy .env.example .env

# Frontend (new terminal)
cd client
npm install
cp .env.example .env
```

## 8. Environment variables

**server/.env**

| Variable | Meaning |
|----------|---------|
| `PORT` | Port the API runs on (5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign tokens. Keep it secret |
| `JWT_EXPIRES_IN` | Token (and cookie) lifetime, e.g. `1d`, `2h` |
| `CLIENT_URL` | Frontend URL allowed by CORS |
| `NODE_ENV` | `development` or `production` |

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**client/.env**

| Variable | Meaning |
|----------|---------|
| `VITE_API_URL` | Backend API base URL (`http://localhost:5000/api`) |

> Anything starting with `VITE_` is visible in the browser. Never put secrets there.

## 9. Running locally

```bash
# Terminal 1
cd server
npm run dev        # http://localhost:5000

# Terminal 2
cd client
npm run dev        # http://localhost:5173
```

Or from the root (after `npm install` in the root, `server` and `client`):
```bash
npm install
npm run install:all
npm run dev
```

## 10. API endpoints

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/api/auth/register` | No | Register a user |
| POST | `/api/auth/login` | No | Log in and set the auth cookie |
| GET | `/api/auth/me` | **Yes** | Get the current user |
| POST | `/api/auth/logout` | No | Clear the auth cookie |

Status codes used: `200` OK, `201` Created, `400` Bad request, `401` Unauthorized, `404` Not found, `409` Conflict (duplicate email), `429` Too many requests, `500` Server error.

## 11. Postman testing

Import `postman/MERN-Auth.postman_collection.json`. Postman keeps cookies automatically, so the login cookie is reused. Run requests in order.

| # | Request | Body | Expected |
|---|---------|------|----------|
| 0 | GET `/auth/me` (before login) | – | **401** `{ "success": false, "message": "Not authenticated. Please log in." }` |
| 1 | POST `/auth/register` | `{"name":"Test User","email":"a@b.com","password":"Password123"}` | **201** `{ "success": true, "message": "User registered successfully" }` |
| 2 | POST `/auth/register` (same email) | same | **409** "An account with this email already exists" |
| 3 | POST `/auth/register` | `{"name":"","email":"bad","password":"1"}` | **400** |
| 4 | POST `/auth/login` | correct email + password | **200** + `Set-Cookie: authToken=...; HttpOnly` + user (no password) |
| 5 | POST `/auth/login` | wrong password | **401** "Invalid email or password" |
| 6 | POST `/auth/login` | unknown email | **401** "Invalid email or password" |
| 7 | GET `/auth/me` (after login) | – | **200** `{ "success": true, "user": {...} }` |
| 8 | POST `/auth/logout` | – | **200** "Logged out successfully" (cookie cleared) |
| 9 | GET `/auth/me` (after logout) | – | **401** |

Headers: `Content-Type: application/json` for requests with a body. No `Authorization` header is needed; the cookie does the job.

## 12. Security practices

| Practice | Where |
|----------|-------|
| Password hashing (bcrypt, 10 salt rounds) | `authController.js` |
| JWT contains only `userId` and expires | `generateToken.js` |
| HTTP-only cookie | `generateToken.js` |
| Same error for wrong email/password | `authController.js` |
| Password never returned | `safeUser()` and `.select("-password")` |
| CORS limited to `CLIENT_URL` with credentials | `server.js` |
| Secrets in `.env`, ignored by Git | `.gitignore` |
| Helmet headers | `server.js` |
| Rate limiting on login/register | `authRoutes.js` |
| Input validation (frontend and backend) | controller and pages |
| Backend checks the JWT on every protected request | `authMiddleware.js` |

### Cookie settings explained

| Option | Dev | Production | Why |
|--------|-----|-----------|-----|
| `httpOnly` | true | true | JavaScript cannot read the cookie, so an XSS attack cannot steal the JWT |
| `secure` | false | true | `true` sends the cookie only over HTTPS. `localhost` has no HTTPS, so it is off in dev |
| `sameSite` | `lax` | `none` | `lax` blocks cross-site sending and works on localhost. In production the frontend (Vercel) and backend (Render) are different sites, so `none` is needed (it requires `secure: true`) |
| `maxAge` | from JWT | from JWT | The cookie expires when the token does |

**CSRF note:** `sameSite: "none"` allows cross-site cookie sending, so for a real production app add CSRF protection (for example a CSRF token), or host the frontend and API under the same parent domain and use `lax`. This is listed under future improvements.

**Common beginner mistakes:** committing `.env`, weak `JWT_SECRET`, storing JWT in `localStorage`, returning the password hash, trusting only frontend route protection, using CORS `*` with credentials.

## 13. Deployment

### Database: MongoDB Atlas
1. Create a free cluster at mongodb.com/atlas.
2. Database Access: create a user with a password.
3. Network Access: allow `0.0.0.0/0` (or Render's outbound IPs).
4. Connect → Drivers → copy the string and add the database name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mern_auth?retryWrites=true&w=majority`
   (URL-encode special characters in the password.)

### Backend: Render
1. Push the project to GitHub.
2. Render → New → Web Service → connect the repo.
3. Root Directory: `server`. Build Command: `npm install`. Start Command: `npm start`.
4. Environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas string |
| `JWT_SECRET` | a long random string |
| `JWT_EXPIRES_IN` | `1d` |
| `CLIENT_URL` | your Vercel URL, no trailing slash, e.g. `https://my-app.vercel.app` |

Render provides the PORT automatically. Your API URL will look like `https://my-api.onrender.com`.

### Frontend: Vercel
1. Vercel → New Project → import the repo.
2. Root Directory: `client`. Framework: Vite.
3. Environment variable: `VITE_API_URL=https://my-api.onrender.com/api`
4. Deploy. Then update `CLIENT_URL` on Render to the final Vercel URL and redeploy the backend.

`client/vercel.json` makes page refreshes on `/dashboard` work.

### Production checklist
- Both sites use **HTTPS** (Vercel and Render do this automatically).
- `NODE_ENV=production` so cookies are `secure` and `sameSite: none`.
- `CLIENT_URL` exactly matches the frontend origin.
- Free Render services sleep when idle, so the first request can be slow.
- Some browsers block third-party cookies. If login works but `/me` fails after refresh, use a custom domain for both apps under the same parent domain (for example `app.example.com` and `api.example.com`).

## 14. Future improvements

- Refresh tokens and token rotation
- CSRF protection
- Email verification and password reset
- Roles (admin/user) for authorization
- Stronger validation library (Zod / express-validator)
- Account lockout, 2FA
- Automated tests (Jest, Supertest)

## Git / GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/mern-authentication.git
git push -u origin main
```
Check `git status` first and confirm no `.env` file is listed.

## Common errors

| Problem | Fix |
|---------|-----|
| `MongoDB connection failed` | Start MongoDB or check `MONGO_URI` (and Atlas IP allow list) |
| `Missing JWT_SECRET or MONGO_URI` | Create `server/.env` from `.env.example` |
| CORS error in browser | `CLIENT_URL` must exactly match the frontend URL (including port) |
| Cookie not saved / `/me` always 401 | Axios needs `withCredentials: true`; CORS needs `credentials: true`; don't open the app via `127.0.0.1` if `CLIENT_URL` uses `localhost` |
| `EADDRINUSE` port in use | Stop the other process or change `PORT` |
| Duplicate email error | Email is unique. Use another email or delete the user in MongoDB |
| 429 Too many attempts | Wait 15 minutes or raise the limit in `authRoutes.js` while testing |

## 15. Author

Your Name · [GitHub](https://github.com/your-username) · your.email@example.com
