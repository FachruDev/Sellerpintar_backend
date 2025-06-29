import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes/index.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);

// Environment variable
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// multiple frontend url
const frontendUrls = FRONTEND_URL ? FRONTEND_URL.split(',').map(url => url.trim()) : ['http://localhost:3001'];

// CORS configurati
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [...frontendUrls, /\.herokuapp\.com$/] 
    : frontendUrls,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Socket.IO setup menggunakan CORS
const io = new Server(httpServer, {
  cors: corsOptions
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet());

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Membuat io tersedia di request objec
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO connction handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Bergabung ke room proyek ketika client meminta
  socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`);
      console.log(`Socket ${socket.id} joined project-${projectId}`);
  });
  
  // Meninggalkan room proyek
  socket.on('leave-project', (projectId) => {
      socket.leave(`project-${projectId}`);
      console.log(`Socket ${socket.id} left project-${projectId}`);
  });
  
  // Handler disconnect
  socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api', routes);

// Health check endpoint untuk Heroku
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handl
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// 404 handl
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Mulai server
httpServer.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});