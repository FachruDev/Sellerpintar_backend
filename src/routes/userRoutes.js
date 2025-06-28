import express from 'express';
import { getProfile, updateProfile, searchUsers } from '../controller/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Semua route user dilindungi oleh middleware authenticate
router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/search', searchUsers);

export default router; 