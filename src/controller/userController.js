import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

export const getProfile = async (req, res) => {
  try {
    // req.user setelah middleware authenticate
    return res.status(200).json(req.user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user.id;
    
    // Menyiapkan data update
    const updateData = {};
    
    if (email) {
      // Mengecek apakah email sudah digunakan
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      updateData.email = email;
    }
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Memperbarui user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email search term is required' });
    }
    
    // Mencari user berdasarkan email (untuk invit ke proyek)
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
        NOT: {
          id: req.user.id, // Menghapus user sekarang
        },
      },
      select: {
        id: true,
        email: true,
      },
      take: 10, // Batas hasil
    });
    
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; 