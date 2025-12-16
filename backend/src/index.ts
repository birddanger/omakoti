import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import logRoutes from './routes/logs.js';
import taskRoutes from './routes/tasks.js';
import documentRoutes from './routes/documents.js';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173', 'https://omakoti.onrender.com'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running', status: 'ok' });
});

// Routes
try {
  console.log('Loading routes...');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes loaded');
  app.use('/api/properties', propertyRoutes);
  console.log('Properties routes loaded');
  app.use('/api/logs', logRoutes);
  console.log('Logs routes loaded');
  app.use('/api/tasks', taskRoutes);
  console.log('Tasks routes loaded');
  app.use('/api/documents', documentRoutes);
  console.log('Documents routes loaded');
} catch (err: any) {
  console.error('Error loading routes:', err?.message || err);
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
try {
  console.log('Starting server...');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (err: any) {
  console.error('Error starting server:', err?.message || err);
  process.exit(1);
}
