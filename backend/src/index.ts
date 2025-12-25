import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import logRoutes from './routes/logs.js';
import taskRoutes from './routes/tasks.js';
import documentRoutes from './routes/documents.js';
import applianceRoutes from './routes/appliances.js';
import checklistRoutes from './routes/checklists.js';
import accessRoutes from './routes/access.js';
import warrantiesRoutes from './routes/warranties.js';
import recurringTasksRoutes from './routes/recurring-tasks.js';

dotenv.config();

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// Initialize database connection
async function initializeDatabase() {
  try {
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

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
  app.use('/api/appliances', applianceRoutes);
  console.log('Appliances routes loaded');
  app.use('/api/checklists', checklistRoutes);
  console.log('Checklists routes loaded');
  app.use('/api/access', accessRoutes);
  console.log('Access routes loaded');
  app.use('/api/warranties', warrantiesRoutes);
  console.log('Warranties routes loaded');
  app.use('/api/recurring-tasks', recurringTasksRoutes);
  console.log('Recurring tasks routes loaded');
} catch (err: any) {
  console.error('Error loading routes:', err?.message || err);
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
async function start() {
  try {
    console.log('Starting server...');
    
    // Initialize database before starting server
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err: any) {
    console.error('Failed to start server:', err?.message || err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();
