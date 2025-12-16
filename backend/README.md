# OmakotiApp Backend

Node.js/Express backend API for the OmakotiApp property maintenance management system.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NODE_ENV="development"
PORT=5000
```

4. Set up the database:
```bash
npm run prisma:migrate
```

This will create the SQLite database and run all migrations.

5. (Optional) View database in Prisma Studio:
```bash
npm run prisma:studio
```

## Running the Server

### Development
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production
```bash
npm run build
npm run start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get specific property
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Maintenance Logs
- `GET /api/logs` - Get all logs
- `GET /api/logs/property/:propertyId` - Get logs for property
- `POST /api/logs` - Create log
- `PUT /api/logs/:id` - Update log
- `DELETE /api/logs/:id` - Delete log

### Planned Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/property/:propertyId` - Get tasks for property
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/complete` - Mark task as completed
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/property/:propertyId` - Get documents for property
- `POST /api/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document

## Authentication

All endpoints (except `/auth/register` and `/auth/login`) require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is received from login/register responses and should be stored in localStorage on the client.

## Database Schema

The database uses SQLite with Prisma ORM. Key models:

- **User**: User account information
- **Property**: Property details (address, type, heating, etc.)
- **MaintenanceLog**: Historical maintenance records
- **PlannedTask**: Scheduled future maintenance
- **AppDocument**: Uploaded documents/files

See `prisma/schema.prisma` for detailed schema.

## Security Notes

- Passwords are hashed with bcryptjs
- JWT tokens expire after 7 days
- Change `JWT_SECRET` in production
- Enable HTTPS in production
- Add rate limiting for production
- Consider adding additional validation and error handling

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | SQLite database path | file:./dev.db |
| JWT_SECRET | Secret for JWT token signing | - |
| NODE_ENV | Environment | development |
| PORT | Server port | 5000 |

## Troubleshooting

### Database locked error
If you see "database locked" errors, ensure only one process is accessing the database.

### Migration issues
```bash
npm run prisma:migrate reset
```

This will reset the database and re-run all migrations.

### CORS issues
Check that the frontend URL is in the CORS whitelist in `src/index.ts`
