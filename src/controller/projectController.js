import prisma from '../config/prisma.js';

export const getAllProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mengambil semua proyek di mana user adalah pemilik atau anggota
    const projects = await prisma.project.findMany({
      where: {
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
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true
          }
        },
        members: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Mengambil proyek jika user adalah pemilik atau anggota
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
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true
          }
        },
        members: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        tasks: {
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    // Membuat proyek baru
    const project = await prisma.project.create({
      data: {
        name,
        owner: {
          connect: { id: userId }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    return res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    const userId = req.user.id;
    
    // Mengecek apakah user adalah pemilik proyek
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });
    
    if (!existingProject) {
      return res.status(403).json({ message: 'Only project owner can update project details' });
    }
    
    // Memperbarui proyek
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { name },
      include: {
        owner: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Mengecek apakah user adalah pemilik proyek
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });
    
    if (!existingProject) {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }
    
    // Menghapus proyek dan data terkait (tasks dan memberships akan dihapus secara cascade)
    await prisma.project.delete({
      where: { id: projectId }
    });
    
    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProjectStats = async (req, res) => {
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
    
    return res.status(200).json(formattedStats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; 