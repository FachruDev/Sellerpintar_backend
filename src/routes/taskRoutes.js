import express from 'express';
import { 
  getAllTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../controller/taskController.js';
import { authenticate, checkProjectAccess } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

// Semua route task dilindungi oleh middleware authenticate dan checkProjectAccess
router.use(authenticate);
router.use(checkProjectAccess);

// Route task
router.get('/', getAllTasks);
router.post('/', createTask);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

export default router; 