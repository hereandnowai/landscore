import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import parcelRoutes from './routes/parcels.js';
import authRoutes from './routes/auth.js';
import chatbotRoutes from './routes/chatbot.js';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes placeholder
app.get('/api', (req, res) => {
  res.json({
    name: 'LANDSCORE API',
    version: '1.0.0',
    description: 'GIS Real Estate & Analytics Platform',
    endpoints: {
      health: '/health',
      parcels: '/api/parcels',
      auth: '/api/auth',
      chatbot: '/api/chatbot',
    },
  });
});

// Mount routes
app.use('/api/parcels', parcelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🗺️  LANDSCORE API Server                                ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${config.port}                                           ║
║   Environment: ${config.nodeEnv.padEnd(10)}                            ║
║   Client URL: ${config.clientUrl.padEnd(30)}    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
