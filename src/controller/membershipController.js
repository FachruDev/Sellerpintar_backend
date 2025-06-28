import prisma from '../config/prisma.js';
import { SOCKET_EVENTS, emitMemberEvent } from '../utils/socketEvents.js';

export const getProjectMembers = async (req, res) => {
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
    
    // Mengambil pemilik proyek
    const owner = await prisma.user.findUnique({
      where: { id: project.ownerId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    // Mengambil anggota proyek
    const memberships = await prisma.membership.findMany({
      where: {
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });
    
    const members = memberships.map(membership => ({
      membershipId: membership.id,
      ...membership.user
    }));
    
    return res.status(200).json({
      owner,
      members
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId: memberUserId } = req.body;
    const userId = req.user.id;
    
    // Mengecek apakah user adalah pemilik proyek
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });
    
    if (!project) {
      return res.status(403).json({ message: 'Only project owner can invite members' });
    }
    
    // Mengecek apakah user yang akan diundang ada
    const userToInvite = await prisma.user.findUnique({
      where: { id: memberUserId }
    });
    
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Mengecek apakah user sudah menjadi anggota
    const existingMembership = await prisma.membership.findFirst({
      where: {
        projectId,
        userId: memberUserId
      }
    });
    
    if (existingMembership) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    
    // Mengecek apakah user adalah pemilik proyek
    if (project.ownerId === memberUserId) {
      return res.status(400).json({ message: 'User is already the owner of this project' });
    }
    
    // Membuat membership
    const membership = await prisma.membership.create({
      data: {
        project: {
          connect: { id: projectId }
        },
        user: {
          connect: { id: memberUserId }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    // Mengirim event realtime
    if (req.io) {
      emitMemberEvent(req.io, projectId, SOCKET_EVENTS.MEMBER_ADDED, {
        membershipId: membership.id,
        projectId,
        user: membership.user
      });
    }
    
    return res.status(201).json({
      message: 'Member invited successfully',
      membership
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { projectId, membershipId } = req.params;
    const userId = req.user.id;
    
    // Mengecek apakah user adalah pemilik proyek
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });
    
    if (!project) {
      return res.status(403).json({ message: 'Only project owner can remove members' });
    }
    
    // Mengecek apakah membership ada
    const membership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        projectId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    
    // Menyimpan info user sebelum penghapusan untuk event
    const removedUser = {
      id: membership.user.id,
      email: membership.user.email
    };
    
    // Menghapus membership
    await prisma.membership.delete({
      where: { id: membershipId }
    });
    
    // Mengirim event realtime
    if (req.io) {
      emitMemberEvent(req.io, projectId, SOCKET_EVENTS.MEMBER_REMOVED, {
        membershipId,
        projectId,
        user: removedUser
      });
    }
    
    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}; 