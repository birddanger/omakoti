# Migration Guide: localStorage to Backend

This guide helps existing users migrate their data from the localStorage-based version to the new backend-based version.

## What Changed

The application previously stored all data in browser localStorage. It now stores data in a backend database for better performance, security, and multi-device access.

## Migration Steps

### Step 1: Update Code

Pull the latest version with backend support:

```bash
git pull origin main
```

Or download the updated files.

### Step 2: Install Dependencies

Backend has new dependencies:

```bash
cd backend
npm install
```

### Step 3: Set Up Backend

Follow [BACKEND_SETUP.md](./BACKEND_SETUP.md) to:
- Create `.env` file
- Run database migrations
- Start the backend server

### Step 4: Data Migration

**Option A: Manual Re-entry (Simple)**

1. Open dev tools (F12) in the old version
2. In browser console, copy this data:
   ```javascript
   console.log(JSON.stringify({
     properties: JSON.parse(localStorage.getItem('pm_properties') || '[]'),
     logs: JSON.parse(localStorage.getItem('pm_logs') || '[]'),
     tasks: JSON.parse(localStorage.getItem('pm_planned_tasks') || '[]')
   }, null, 2))
   ```
3. Save the output to a text file
4. In the new backend app, re-create properties and logs manually using the UI

**Option B: Bulk Import Script (Advanced)**

Create a migration script at `backend/scripts/migrate.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function migrate() {
  // Import your localStorage JSON here
  const importedData = {
    user: { name: 'User', email: 'user@example.com', password: 'password123' },
    properties: [],
    logs: [],
    tasks: []
  };

  // Create user
  const user = await prisma.user.create({
    data: {
      name: importedData.user.name,
      email: importedData.user.email,
      password: await hashPassword(importedData.user.password)
    }
  });

  // Import properties
  for (const prop of importedData.properties) {
    await prisma.property.create({
      data: {
        userId: user.id,
        ...prop
      }
    });
  }

  // Import logs
  for (const log of importedData.logs) {
    await prisma.maintenanceLog.create({
      data: {
        userId: user.id,
        ...log
      }
    });
  }

  console.log('Migration complete!');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
```

Run with:
```bash
npm run ts-node scripts/migrate.ts
```

### Step 5: Verify Data

1. Start backend: `npm run dev` (in backend directory)
2. Start frontend: `npm run dev`
3. Log in with credentials
4. Check that data appears correctly

## Important Notes

### User IDs Change
- Old localStorage IDs (strings like "1", "2") will not match
- Backend generates new UUIDs
- This is normal and secure

### Passwords
- Old plaintext passwords were insecure
- New system hashes passwords with bcryptjs
- You'll need to register with a new password

### localStorage Cleanup
- New version doesn't use localStorage for data
- Only JWT token is stored in localStorage
- Old localStorage data is ignored
- You can safely clear it after verification

To clear old data:
```javascript
// In browser console
localStorage.removeItem('pm_properties');
localStorage.removeItem('pm_logs');
localStorage.removeItem('pm_documents');
localStorage.removeItem('pm_planned_tasks');
localStorage.removeItem('pm_users');
```

## Rollback (If Needed)

If you need to go back to localStorage version:

```bash
git checkout <commit-hash>
```

Old localStorage data will still be available in browser.

## Post-Migration

### Update Environment
Make sure `.env.local` is configured:
```
VITE_API_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Test Features
- [ ] Register new account
- [ ] Create property
- [ ] Add maintenance log
- [ ] Upload document
- [ ] View dashboard
- [ ] Export CSV
- [ ] Use AI maintenance planner
- [ ] Log out and log back in

### Performance Improvements

You should notice:
- ✅ Faster data loading (especially with many properties)
- ✅ Better responsiveness
- ✅ No localStorage size limits
- ✅ Data syncs across browser tabs
- ✅ Multi-device support (when deployed)

## Common Issues

### "Failed to fetch" errors
- Check backend is running on port 5000
- Check `VITE_API_URL` is correct
- Check network tab in dev tools

### "Invalid or expired token"
- Log out and log in again
- Clear localStorage: `localStorage.clear()`
- Restart browser

### Old data doesn't appear
- This is expected - use manual re-entry or import script
- Data now lives in backend database, not localStorage

### Database is locked
- Close other browser tabs with the app
- Kill other Node processes: `killall node`
- Reset: `npm run prisma:migrate reset`

## Support

For migration help:
1. Check [BACKEND_SETUP.md](./BACKEND_SETUP.md)
2. Review backend logs
3. Check browser console (F12) for errors
4. Verify database with `npm run prisma:studio`
