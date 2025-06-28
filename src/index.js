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
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Membuat io available in request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API routes
app.use('/api', routes);

// Health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Socket.IO connection handler
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

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));