# Quick Reference - Backend Integration

## 🚀 Start Here

```bash
# Backend (Terminal 1)
cd backend
npm install
npm run prisma:migrate
npm run dev

# Frontend (Terminal 2)  
npm install
npm run dev

# Then open: http://localhost:3000
```

## 📖 Documentation Links

| Document | Purpose |
|----------|---------|
| [BACKEND_SETUP.md](./BACKEND_SETUP.md) | Installation & deployment |
| [BACKEND_INTEGRATION_SUMMARY.md](./BACKEND_INTEGRATION_SUMMARY.md) | Architecture & features |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Migrate from localStorage |
| [backend/README.md](./backend/README.md) | API reference |
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | What was done |

## 🔧 Common Commands

```bash
# Backend database
npm run prisma:studio          # View database
npm run prisma:migrate reset   # Reset database

# Build for production
npm run build                  # Frontend
npm run build                  # Backend (in backend/)

# View logs
# Frontend: Browser console (F12)
# Backend: Terminal output
```

## 🔑 Key Concepts

| Concept | Details |
|---------|---------|
| **Port 5000** | Backend API server |
| **Port 3000** | Frontend React app |
| **JWT Token** | Stored in localStorage, sent in headers |
| **SQLite** | Database file: `backend/dev.db` |
| **Prisma** | ORM for database queries |

## 🗂️ New Files

**Backend**
- `backend/src/` - Express server code
- `backend/prisma/schema.prisma` - Database schema
- `backend/.env` - Configuration

**Frontend Services**
- `services/propertyService.ts`
- `services/logsService.ts`
- `services/tasksService.ts`
- `services/documentsService.ts`

## ⚙️ Environment Setup

**.env.local (Frontend)**
```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-key-here
```

**backend/.env**
```
DATABASE_URL=file:./dev.db
JWT_SECRET=dev-secret
NODE_ENV=development
PORT=5000
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check port 5000 not in use |
| "Cannot find module" | Run `npm install` |
| 401 Unauthorized | Re-login, check JWT token |
| Database locked | Kill: `killall node` |
| CORS error | Check `VITE_API_URL` in .env.local |

## 📊 API Endpoints (Quick List)

```
POST   /api/auth/register      # Create account
POST   /api/auth/login         # Sign in
GET    /api/properties         # List properties
POST   /api/properties         # Create property
POST   /api/logs               # Create log
GET    /api/tasks              # List tasks
POST   /api/tasks              # Create task
PATCH  /api/tasks/:id/complete # Mark done
POST   /api/documents          # Upload document
```

## 💾 Database Models

```
User
  ├─ Properties
  ├─ MaintenanceLogs  
  ├─ PlannedTasks
  └─ AppDocuments
```

## ✨ Main Differences

| Before | After |
|--------|-------|
| localStorage | Database |
| No backend | Express API |
| Plaintext passwords | Hashed + JWT |
| Single user | Multi-user |
| 5-10MB limit | Unlimited |

## 📋 First Use Workflow

1. Open http://localhost:3000
2. Click "Create Account"
3. Register with email/password
4. Add property
5. Add maintenance log
6. View dashboard
7. Logout and login again

## 🔐 Security

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens expire in 7 days
- ✅ Per-user data isolation
- ✅ CORS protected
- ✅ Secure headers ready

## 🎯 What Works Now

- ✅ User authentication (register/login)
- ✅ Property management (CRUD)
- ✅ Maintenance logging (CRUD)
- ✅ Task planning (CRUD + complete)
- ✅ Document uploads
- ✅ Dashboard analytics
- ✅ CSV export
- ✅ AI suggestions (with API key)
- ✅ Multi-language (EN/FI)
- ✅ Error handling
- ✅ Loading states

## 🚢 Production Checklist

- [ ] Switch to PostgreSQL
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS for domain
- [ ] Set up database backups
- [ ] Enable monitoring
- [ ] Test all endpoints
- [ ] Load test
- [ ] Security audit

## 📞 When Stuck

1. **Check documentation** - BACKEND_SETUP.md
2. **Review error logs** - Terminal + browser console
3. **View database** - `npm run prisma:studio`
4. **Reset & retry** - `npm run prisma:migrate reset`

---

**Status**: ✅ Backend integration complete!

**Next Step**: Run the Quick Start commands above
