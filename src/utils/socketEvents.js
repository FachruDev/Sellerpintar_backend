export const SOCKET_EVENTS = {
  // Event proyek
  PROJECT_UPDATED: 'project-updated',
  PROJECT_DELETED: 'project-deleted',
  
  // Event task
  TASK_CREATED: 'task-created',
  TASK_UPDATED: 'task-updated',
  TASK_DELETED: 'task-deleted',
  TASK_STATUS_CHANGED: 'task-status-changed',
  
  // Event member
  MEMBER_ADDED: 'member-added',
  MEMBER_REMOVED: 'member-removed'
};

// Fungsi bantu untuk mengirim event proyek
export const emitProjectEvent = (io, projectId, eventType, data) => {
  io.to(`project-${projectId}`).emit(eventType, data);
};

// Fungsi bantu untuk mengirim event task
export const emitTaskEvent = (io, projectId, eventType, data) => {
  io.to(`project-${projectId}`).emit(eventType, data);
};

// Fungsi bantu untuk mengirim event member
export const emitMemberEvent = (io, projectId, eventType, data) => {
  io.to(`project-${projectId}`).emit(eventType, data);
}; 