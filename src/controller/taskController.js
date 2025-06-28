import prisma from '../config/prisma.js';

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
    
    // Validasi Input
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
    
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; 