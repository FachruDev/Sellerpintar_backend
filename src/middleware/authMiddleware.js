import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token not provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

export const checkProjectAccess = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Mengecek apakah user adalah pemilik atau anggota proyek
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      }
    });
    
    if (!project) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }
    
    // Menambahkan proyek ke request untuk penggunaan nantinya
    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const checkProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Mengecek apakah user adalah pemilik proyek
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });
    
    if (!project) {
      return res.status(403).json({ message: 'Only project owner can perform this action' });
    }
    
    // Menambahkan proyek ke request untuk penggunaan nantinya
    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; 