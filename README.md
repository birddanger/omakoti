<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# OmakotiApp - Property Maintenance Manager

A full-stack web application for managing property maintenance, tracking costs, and planning future maintenance with AI-powered predictions.

## Features

- 🏠 **Property Management** - Track multiple properties with detailed information
- 🔧 **Maintenance Tracking** - Log maintenance history with costs and provider details
- 📋 **Task Planning** - Plan and schedule future maintenance tasks
- 🤖 **AI Predictions** - Google Gemini-powered maintenance forecasting
- 📊 **Analytics** - Dashboard with spending trends and statistics
- 📄 **Document Management** - Attach documents and receipts to maintenance logs
- 🌍 **Multi-language** - English and Finnish UI support
- 🔐 **Secure Authentication** - JWT-based user authentication
- 💾 **Database Backend** - SQLite (development) / PostgreSQL (production)

## Tech Stack

**Backend:**
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite / PostgreSQL
- JWT Authentication

**Frontend:**
- React 19 with TypeScript
- Vite build tool
- Tailwind CSS
- React Router
- Recharts for data visualization

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Setup & Run

**1. Backend Setup**
```bash
cd backend
npm install
npm run prisma:migrate  # Create database
npm run dev             # Start backend (port 5000)
```

**2. Frontend Setup** (in new terminal)
```bash
npm install
cp .env.local.example .env.local
# Edit .env.local and add your Gemini API key if desired
npm run dev            # Start frontend (port 3000)
```

**3. Open Browser**
```
http://localhost:3000
```

**4. Create Account**
- Click "Create Account"
- Register with email and password
- Start managing your properties!

## Documentation

- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Complete backend setup and deployment guide
- **[BACKEND_INTEGRATION_SUMMARY.md](./BACKEND_INTEGRATION_SUMMARY.md)** - Architecture overview and feature summary
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guide for migrating from localStorage version
- **[backend/README.md](./backend/README.md)** - Backend API documentation

## Project Structure

```
omakotiapp-3/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── index.ts        # Express server
│   │   ├── middleware/     # JWT authentication
│   │   ├── routes/         # API endpoints
│   │   └── utils/          # Helper functions
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── components/             # React components
│   ├── Dashboard.tsx
│   ├── PropertyDetails.tsx
│   ├── Auth.tsx
│   └── ...
│
├── services/               # API service layer
│   ├── authService.ts
│   ├── propertyService.ts
│   ├── logsService.ts
│   └── ...
│
├── contexts/               # React Context (i18n)
├── types.ts                # TypeScript types
├── App.tsx                 # Main app component
└── package.json
```

## Key Differences from Previous Version

| Aspect | Previous | Current |
|--------|----------|---------|
| Data Storage | Browser localStorage | Backend SQLite/PostgreSQL |
| Authentication | Plaintext passwords | Hashed passwords + JWT |
| User Data | Single browser | Multi-user with isolation |
| Data Limit | ~5-10MB | Unlimited |
| Scalability | Not scalable | Enterprise-ready |
| Multi-device | No sync | Ready for sync |

## API Endpoints

All endpoints require JWT token in Authorization header (except `/register` and `/login`)

**Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

**Properties**
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

**Maintenance Logs**
- `GET /api/logs` - List logs
- `POST /api/logs` - Create log
- `PUT /api/logs/:id` - Update log
- `DELETE /api/logs/:id` - Delete log

**Planned Tasks**
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/complete` - Mark complete
- `DELETE /api/tasks/:id` - Delete task

**Documents**
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document

For full API documentation, see [backend/README.md](./backend/README.md)

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Backend (backend/.env)
```
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
```

## Development

### Running Both Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev
```

### Database Management
```bash
# View database in Prisma Studio
cd backend && npm run prisma:studio

# Reset database
cd backend && npm run prisma:migrate reset

# Run migrations
cd backend && npm run prisma:migrate dev
```

### Build

```bash
# Frontend
npm run build

# Backend
cd backend && npm run build
```

## Production Deployment

### Environment Setup
1. Use PostgreSQL instead of SQLite
2. Update `DATABASE_URL` in backend `.env`
3. Set strong `JWT_SECRET`
4. Enable HTTPS
5. Configure CORS for production domain

### Deployment Steps
```bash
# Backend
cd backend
npm run build
npm run start

# Frontend
npm run build
# Deploy dist/ folder to web server
```

See [BACKEND_SETUP.md](./BACKEND_SETUP.md#production-deployment) for detailed production guide.

## Troubleshooting

**Backend won't start**
- Check Node.js version: `node --version`
- Ensure port 5000 is available
- Run `npm install` in backend directory

**CORS errors**
- Verify backend is running
- Check `.env.local` has correct `VITE_API_URL`
- Check backend CORS config in `src/index.ts`

**Database locked**
- Only one process should access DB
- Kill other Node processes: `killall node`
- Reset: `npm run prisma:migrate reset`

**401 Unauthorized**
- Verify JWT token in localStorage
- Try logging out and back in
- Check token hasn't expired

See [BACKEND_SETUP.md](./BACKEND_SETUP.md#troubleshooting) for more troubleshooting.

## License

MIT

## Support

For issues, questions, or contributions:
1. Check the documentation files
2. Review backend logs (Terminal 1)
3. Check browser console (F12 in browser)
4. View database with Prisma Studio

