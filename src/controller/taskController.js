import prisma from '../config/prisma.js';
import { SOCKET_EVENTS, emitTaskEvent, emitProjectEvent } from '../utils/socketEvents.js';

export const getAllTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Mengecek akses proyek
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
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Mengambil semua task untuk proyek
    const tasks = await prisma.task.findMany({
      where: {
        projectId
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;
    
    // Mengecek akses proyek
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
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Mengambil task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        projectId
      }
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    return res.status(200).json(task);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Fungsi helper untuk mendapatkan dan mengirim statistik proyek
const updateProjectStats = async (io, projectId) => {
  try {
    // Mengambil statistik task
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId
      },
      _count: {
        id: true
      }
    });
    
    // Memformat statistik
    const formattedStats = {
      todo: 0,
      'in-progress': 0,
      done: 0
    };
    
    taskStats.forEach(stat => {
      formattedStats[stat.status] = stat._count.id;
    });
    
    // Mengirim event statistik
    emitProjectEvent(io, projectId, SOCKET_EVENTS.PROJECT_STATS_UPDATED, formattedStats);
    
    return formattedStats;
  } catch (error) {
    console.error('Error updating project stats:', error);
  }
};

export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status = 'todo', assigneeId } = req.body;
    const userId = req.user.id;
    
    // Mengecek akses proyek
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
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Validasi input
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    
    // Mengecek apakah assignee adalah anggota proyek
    if (assigneeId) {
      const isMember = await prisma.membership.findFirst({
        where: {
          projectId,
          userId: assigneeId
        }
      });
      
      if (!isMember && assigneeId !== project.ownerId) {
        return res.status(400).json({ message: 'Assignee must be a member of the project' });
      }
    }
    
    // Membuat task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        status,
        assigneeId,
        project: {
          connect: { id: projectId }
        }
      }
    });
    
    // Mengirim event realtime
    if (req.io) {
      emitTaskEvent(req.io, projectId, SOCKET_EVENTS.TASK_CREATED, task);
      // Update statistik proyek
      await updateProjectStats(req.io, projectId);
    }
    
    return res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, status, assigneeId } = req.body;
    const userId = req.user.id;
    
    // Mengecek akses proyek
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
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Mengecek apakah task ada
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId
      }
    });
    
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Mengecek apakah assignee adalah anggota proyek
    if (assigneeId) {
      const isMember = await prisma.membership.findFirst({
        where: {
          projectId,
          userId: assigneeId
        }
      });
      
      if (!isMember && assigneeId !== project.ownerId) {
        return res.status(400).json({ message: 'Assignee must be a member of the project' });
      }
    }
    
    // Menyiapkan data update
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    
    // Memperbarui task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });
    
    // Mengirim event realtime
    if (req.io) {
      // Jika status berubah, mengirim event khusus untuk update kanban
      if (status && status !== existingTask.status) {
        emitTaskEvent(req.io, projectId, SOCKET_EVENTS.TASK_STATUS_CHANGED, {
          ...updatedTask,
          oldStatus: existingTask.status,
          newStatus: status
        });
      } else {
        emitTaskEvent(req.io, projectId, SOCKET_EVENTS.TASK_UPDATED, updatedTask);
      }
      
      // Update statistik proyek jika status berubah
      if (status && status !== existingTask.status) {
        await updateProjectStats(req.io, projectId);
      }
    }
    
    return res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user.id;
    
    // Mengecek akses proyek
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
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Mengecek apakah task ada
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId
      }
    });
    
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Menghapus task
    await prisma.task.delete({
      where: { id: taskId }
    });
    
    // Mengirim event realtime
    if (req.io) {
      emitTaskEvent(req.io, projectId, SOCKET_EVENTS.TASK_DELETED, { 
        id: taskId,
        projectId,
        status: existingTask.status // Menyertakan status untuk update UI
      });
      
      // Update statistik proyek
      await updateProjectStats(req.io, projectId);
    }
    
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; 