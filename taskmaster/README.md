# 🎯 TaskMaster — MERN Stack Task Management System

A production-ready MERN stack app with gamification, recurring task automation, Google OAuth, dark mode, and role-based access.

---

## 🗂️ Project Structure

```
taskmaster/
├── backend/
│   ├── config/         → MongoDB connection
│   ├── controllers/    → Business logic (auth, tasks, users)
│   ├── cron/           → Recurring task automation (node-cron)
│   ├── middleware/      → JWT auth, error handler, validator
│   ├── models/         → Mongoose schemas (User, Task)
│   ├── routes/         → Express routers
│   ├── utils/          → JWT helpers, date calculator
│   └── server.js       → App entry point
└── frontend/
    └── src/
        ├── components/ → Reusable UI (layout, tasks, common)
        ├── context/    → AuthContext, ThemeContext
        ├── hooks/      → useTasks
        ├── pages/      → Dashboard, Tasks, Leaderboard, Activity, Admin
        ├── routes/     → ProtectedRoute, PublicRoute
        └── services/   → Axios API client
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google Cloud Console project (for OAuth)

---

### 1. Clone the project

```bash
git clone <repo-url>
cd taskmaster
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmaster
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLIENT_URL=http://localhost:5173

# Set your server's local timezone
CRON_TIMEZONE=Asia/Kolkata

NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The server runs at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

### 4. Create Admin User

Register normally, then run in MongoDB shell:

```javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## 🔐 Authentication

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/me` | Get current user (protected) |

---

## 📋 Tasks API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks` | List tasks (with filter/search/pagination) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/toggle` | Toggle complete/pending |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats` | Dashboard stats |

**Query params for GET /tasks:**
- `status=pending|completed`
- `priority=low|medium|high|urgent`
- `isRecurring=true|false`
- `search=keyword`
- `page=1&limit=10`

---

## 🔄 Recurring Task Cron Job

The cron runs **daily at 00:00** in the configured timezone.

**Logic:**
1. Finds tasks where `isRecurring=true`, `status=completed`, `recurrence.autoReassign=true`
2. Calculates next due date using `getNextDate()` (handles month overflow, leap year)
3. Resets: `status→pending`, `dueDate→next`, `pointsAwarded→false`
4. Idempotent: skips tasks already processed today

**Configure timezone** in `.env`:
```
CRON_TIMEZONE=Asia/Kolkata   # or America/New_York, Europe/London, etc.
```

---

## 🏆 Gamification

- Each task has a `pointValue` (default: 10)
- Points are awarded **once** on first completion (`pointsAwarded` flag prevents duplicates)
- Points persist even if task is toggled back to pending
- For recurring tasks, `pointsAwarded` resets so users earn again each cycle
- Full `pointHistory` is stored on user profile

---

## 🌙 Features

| Feature | Status |
|---------|--------|
| Email/Password auth | ✅ |
| Google OAuth 2.0 | ✅ |
| JWT middleware | ✅ |
| Role-based access (Admin/User) | ✅ |
| Task CRUD with filtering & search | ✅ |
| Pagination | ✅ |
| Points system (no duplicates) | ✅ |
| Recurring task automation (cron) | ✅ |
| Dark mode | ✅ |
| Leaderboard | ✅ |
| Activity history | ✅ |
| Admin user management | ✅ |
| Mobile responsive | ✅ |
| Toast notifications | ✅ |
| Confirm delete modal | ✅ |
| Loading skeletons | ✅ |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (salt rounds: 12)
- JWTs signed with secret key
- Admin routes protected by `adminOnly` middleware
- Input validation via `express-validator`
- CORS configured for specific client URL
- `.env` for all secrets (never commit)

---

## 🌍 Timezone Support

To find your timezone string:
```bash
node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"
```

Common timezones:
- `Asia/Kolkata` (IST, UTC+5:30)
- `America/New_York` (EST)
- `America/Los_Angeles` (PST)
- `Europe/London` (GMT)
- `Asia/Tokyo` (JST)

---

## 📦 Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, node-cron, google-auth-library  
**Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios, react-hot-toast, react-icons, date-fns

---

## 🚢 Deployment

### Backend (Railway / Render)
1. Set all `.env` variables in dashboard
2. Set `NODE_ENV=production`
3. Deploy from GitHub

### Frontend (Vercel / Netlify)
1. Set `VITE_GOOGLE_CLIENT_ID` in environment
2. Update `CLIENT_URL` in backend `.env` to production URL
3. Build: `npm run build`

---

## 📝 License

MIT
