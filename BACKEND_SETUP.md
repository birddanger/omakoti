# Backend Integration Setup Guide

This guide will help you set up and run the OmakotiApp with the new backend infrastructure.

## Architecture Overview

The application has been refactored from a localStorage-based system to a full-stack architecture:

- **Backend**: Node.js/Express with SQLite and Prisma ORM
- **Frontend**: React with TypeScript
- **Communication**: RESTful API with JWT authentication
- **Database**: SQLite (dev) / PostgreSQL (production-ready)

## Setup Steps

### 1. Backend Setup

#### Install Backend Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and update:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
PORT=5000
```

**Important**: Generate a strong JWT_SECRET for production.

#### Initialize Database

```bash
npm run prisma:migrate
```

This will:
- Create SQLite database (`dev.db`)
- Run all Prisma migrations
- Set up database schema with User, Property, MaintenanceLog, PlannedTask, AppDocument tables

#### (Optional) View Database

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5050` to view/edit data.

### 2. Frontend Setup

#### Install Frontend Dependencies

```bash
cd ..  # Back to omakotiapp-3 root
npm install
```

#### Configure Environment Variables

Create `.env.local` file in the frontend root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

The `VITE_GEMINI_API_KEY` is needed for AI-powered maintenance planning features.

### 3. Running the Application

#### Terminal 1 - Start Backend

```bash
cd backend
npm run dev
```

Backend will be available at `http://localhost:5000`

#### Terminal 2 - Start Frontend

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 4. First Use

1. Open `http://localhost:3000` in your browser
2. Click "Create Account" to register
3. Log in with your new credentials
4. Backend will automatically store your data in SQLite database

## Key Changes from localStorage

| Aspect | Before | After |
|--------|--------|-------|
| Data Storage | Browser localStorage | SQLite database |
| Authentication | Plaintext passwords in localStorage | Hashed passwords + JWT tokens |
| Data Persistence | Limited to ~5-10MB | Unlimited (within database) |
| Multi-user | Via userId filtering | Full server-side user isolation |
| API Calls | Local functions | RESTful API endpoints |
| Performance | In-memory operations | Database queries |

## API Endpoints Reference

All endpoints require `Authorization: Bearer <token>` header except auth endpoints.

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Maintenance Logs
- `GET /api/logs` - Get all logs
- `POST /api/logs` - Create log
- `PUT /api/logs/:id` - Update log
- `DELETE /api/logs/:id` - Delete log

### Planned Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id/complete` - Mark complete
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document

## Service Layer

Frontend services now handle API communication:

- `services/authService.ts` - Authentication (login, register, logout)
- `services/propertyService.ts` - Property CRUD
- `services/logsService.ts` - Maintenance log CRUD
- `services/tasksService.ts` - Planned task CRUD
- `services/documentsService.ts` - Document CRUD

All services use the same pattern:
```typescript
const token = authService.getToken();
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

## Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (needs 18+)
- Check if port 5000 is in use: `lsof -i :5000`
- Verify database permissions: `ls -la backend/dev.db`

### CORS errors
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `.env.local` matches backend URL
- Verify CORS whitelist in `backend/src/index.ts`

### Database locked
- Only one process should access database
- Kill other Node processes: `killall node`
- Reset database: `npm run prisma:migrate reset` (in backend)

### Login/Registration fails
- Verify `.env` is configured in backend
- Check database connection
- Review error logs in browser console

### API calls return 401 (Unauthorized)
- Verify JWT token is saved in localStorage
- Check token expiration (7 days)
- Re-login to get new token

## Production Deployment

### Database
```bash
# Switch to PostgreSQL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/omakotiapp"

# Run migrations
npm run prisma:migrate deploy
```

### Backend
```bash
# Build
npm run build

# Start
npm run start
```

### Security Considerations
1. Change `JWT_SECRET` to a strong random value
2. Enable HTTPS
3. Set environment to production: `NODE_ENV=production`
4. Use environment variables for all secrets
5. Enable rate limiting
6. Set up database backups
7. Use managed database service (AWS RDS, Heroku, etc.)

## Data Migration from localStorage

If you have existing data in localStorage, you can migrate it:

1. Backend creates empty database tables
2. Log in to create your user
3. Re-add properties and maintenance logs manually (for now)

Future versions can include data import functionality.

## Support

For issues or questions, check:
- Backend logs: Terminal where backend is running
- Frontend logs: Browser console (F12)
- Database: `npm run prisma:studio` (when backend is running)

## Next Steps

1. Test full workflow: Create property → Add maintenance log → View dashboard
2. Configure Gemini API key for AI features
3. Deploy to production environment
4. Set up database backups
5. Monitor logs and performance
