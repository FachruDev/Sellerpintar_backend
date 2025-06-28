import express from 'express';
import { 
  getProjectMembers, 
  inviteMember, 
  removeMember 
} from '../controller/membershipController.js';
import { authenticate, checkProjectAccess, checkProjectOwnership } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Semua route membership dilindungi oleh middleware authenticate
router.use(authenticate);

// Route membership
router.get('/', checkProjectAccess, getProjectMembers);
router.post('/', checkProjectOwnership, inviteMember);
router.delete('/:membershipId', checkProjectOwnership, removeMember);

export default router; 