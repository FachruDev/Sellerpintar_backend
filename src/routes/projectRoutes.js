import express from 'express';
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectStats
} from '../controller/projectController.js';
import { authenticate, checkProjectAccess, checkProjectOwnership } from '../middleware/authMiddleware.js';

const router = express.Router();

// Semua route project dilindungi oleh middleware authenticate
router.use(authenticate);

// Route project
router.get('/', getAllProjects);
router.post('/', createProject);
router.get('/:projectId', checkProjectAccess, getProjectById);
router.put('/:projectId', checkProjectOwnership, updateProject);
router.delete('/:projectId', checkProjectOwnership, deleteProject);
router.get('/:projectId/stats', checkProjectAccess, getProjectStats);

export default router; 