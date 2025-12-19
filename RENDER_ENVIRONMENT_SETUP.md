# Render Environment Setup Guide

## JWT_SECRET Configuration

The application uses JWT (JSON Web Tokens) for authentication. To ensure your Render deployment works correctly, you need to set the `JWT_SECRET` environment variable.

### Steps to Configure JWT_SECRET on Render:

1. **Go to your Render Backend Service**
   - Navigate to https://dashboard.render.com
   - Select your backend service (e.g., `omakoti-1backend`)

2. **Access Environment Variables**
   - Click on the "Environment" tab in the left sidebar
   - Click "Add Environment Variable"

3. **Add JWT_SECRET**
   - **Key**: `JWT_SECRET`
   - **Value**: Use a strong, random secret (at least 32 characters)
     - Example: `your-super-secret-key-at-least-32-characters-long!@#$%`
   - Or generate one: `openssl rand -base64 32`

4. **Save and Redeploy**
   - Click "Save"
   - Your service will automatically redeploy with the new environment variable

### Important Notes:

- The same `JWT_SECRET` must be used consistently across all deployments
- Do NOT commit the actual secret value to Git - it's already in environment variables
- If you change `JWT_SECRET`, all existing tokens will become invalid (users will need to log in again)
- The default development value is only for local testing

### Verifying the Setup:

1. Log in to your application
2. Try to initialize a checklist - it should now work with HTTP 201 status
3. Check Render logs if you still see 401 errors:
   ```
   curl https://omakoti-1backend.onrender.com/health
   # Should return: {"status":"OK"}
   ```

## Other Recommended Environment Variables:

Add these to your Render backend service as well:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables production mode optimizations |
| `DATABASE_URL` | (Set by Render if using Render DB) | PostgreSQL connection string |
| `GEMINI_API_KEY` | Your Gemini API key | AI-powered maintenance suggestions |

## Troubleshooting:

**Getting 401 Unauthorized errors?**
- Verify `JWT_SECRET` is set in Render environment variables
- Check that the frontend has a valid token in localStorage
- Clear browser cache and re-login

**Getting 500 errors after setting JWT_SECRET?**
- Check Render logs: Dashboard → Your Service → "Logs" tab
- Ensure the format of the secret doesn't contain special characters that break YAML

**Need to reset everything?**
- Delete the environment variable
- Redeploy
- Add it back with a new value
