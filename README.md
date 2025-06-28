# Multi-User Project Management API

Backend API untuk aplikasi manajemen proyek multi-user dengan fitur autentikasi, manajemen proyek, tugas, dan anggota tim.

## Fitur

- **Autentikasi**: Register dan login dengan JWT
- **Manajemen Proyek**: CRUD untuk proyek
- **Manajemen Tugas**: CRUD untuk tugas dengan status (todo, in-progress, done)
- **Manajemen Anggota**: Invite dan remove member dari proyek
- **Proteksi endpoint**: Hanya user yang memiliki akses ke proyek yang dapat melihat/mengubah data
- **Realtime Updates**: Update realtime untuk perubahan task, project, dan member menggunakan Socket.IO

## Teknologi

- Node.js dengan Express
- PostgreSQL dengan Prisma ORM
- JWT untuk autentikasi
- RESTful API
- Socket.IO untuk realtime updates

## Instalasi

1. Clone repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
# atau
bun install
```

3. Setup environment variables:
```bash
cp .env.example .env
# Edit .env file dengan konfigurasi yang sesuai
```

4. Setup database dan generate Prisma client:
```bash
npx prisma migrate dev
# atau
bun prisma:migrate
```

## Menjalankan Aplikasi

```bash
# Development mode dengan hot reload
npm run dev
# atau
bun dev

# Production mode
npm start
# atau
bun start
```

Server akan berjalan di `http://localhost:3000` (atau port yang ditentukan di .env)

## Dokumentasi API

### Auth Endpoints

#### Register User Baru
- **URL**: `POST /api/auth/register`
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response Success** (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "token": "jwt-token"
}
```

#### Login User
- **URL**: `POST /api/auth/login`
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response Success** (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "token": "jwt-token"
}
```

### User Endpoints

#### Get User Profile
- **URL**: `GET /api/users/profile`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Update User Profile
- **URL**: `PUT /api/users/profile`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "email": "new-email@example.com",
  "password": "new-password"
}
```
- **Response Success** (200):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "new-email@example.com",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### Search Users (untuk invite)
- **URL**: `GET /api/users/search?email={email}`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
[
  {
    "id": "uuid",
    "email": "user@example.com"
  },
  {
    "id": "uuid",
    "email": "another-user@example.com"
  }
]
```

### Project Endpoints

#### Get All Projects
- **URL**: `GET /api/projects`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
[
  {
    "id": "uuid",
    "name": "Project Name",
    "ownerId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "owner": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "members": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "email": "member@example.com"
        }
      }
    ],
    "_count": {
      "tasks": 5
    }
  }
]
```

#### Create Project
- **URL**: `POST /api/projects`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "name": "New Project"
}
```
- **Response Success** (201):
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid",
    "name": "New Project",
    "ownerId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "owner": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

#### Get Project By ID
- **URL**: `GET /api/projects/{projectId}`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "id": "uuid",
  "name": "Project Name",
  "ownerId": "uuid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "owner": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "members": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "member@example.com"
      }
    }
  ],
  "tasks": [
    {
      "id": "uuid",
      "title": "Task Title",
      "description": "Task Description",
      "status": "todo",
      "projectId": "uuid",
      "assigneeId": "uuid",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

#### Update Project
- **URL**: `PUT /api/projects/{projectId}`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "name": "Updated Project Name"
}
```
- **Response Success** (200):
```json
{
  "message": "Project updated successfully",
  "project": {
    "id": "uuid",
    "name": "Updated Project Name",
    "ownerId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "owner": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

#### Delete Project
- **URL**: `DELETE /api/projects/{projectId}`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "message": "Project deleted successfully"
}
```

#### Get Project Stats
- **URL**: `GET /api/projects/{projectId}/stats`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "todo": 3,
  "in-progress": 2,
  "done": 5
}
```

### Task Endpoints

#### Get All Tasks in Project
- **URL**: `GET /api/projects/{projectId}/tasks`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
[
  {
    "id": "uuid",
    "title": "Task Title",
    "description": "Task Description",
    "status": "todo",
    "projectId": "uuid",
    "assigneeId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "project": {
      "name": "Project Name"
    }
  }
]
```

#### Create Task
- **URL**: `POST /api/projects/{projectId}/tasks`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "title": "New Task",
  "description": "Task Description",
  "status": "todo",
  "assigneeId": "uuid"
}
```
- **Response Success** (201):
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "uuid",
    "title": "New Task",
    "description": "Task Description",
    "status": "todo",
    "projectId": "uuid",
    "assigneeId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### Get Task By ID
- **URL**: `GET /api/projects/{projectId}/tasks/{taskId}`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "id": "uuid",
  "title": "Task Title",
  "description": "Task Description",
  "status": "todo",
  "projectId": "uuid",
  "assigneeId": "uuid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Update Task
- **URL**: `PUT /api/projects/{projectId}/tasks/{taskId}`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "title": "Updated Task",
  "description": "Updated Description",
  "status": "in-progress",
  "assigneeId": "uuid"
}
```
- **Response Success** (200):
```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "uuid",
    "title": "Updated Task",
    "description": "Updated Description",
    "status": "in-progress",
    "projectId": "uuid",
    "assigneeId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### Delete Task
- **URL**: `DELETE /api/projects/{projectId}/tasks/{taskId}`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "message": "Task deleted successfully"
}
```

### Membership Endpoints

#### Get Project Members
- **URL**: `GET /api/projects/{projectId}/members`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "owner": {
    "id": "uuid",
    "email": "owner@example.com",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "members": [
    {
      "membershipId": "uuid",
      "id": "uuid",
      "email": "member@example.com",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

#### Invite Member
- **URL**: `POST /api/projects/{projectId}/members`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "userId": "uuid"
}
```
- **Response Success** (201):
```json
{
  "message": "Member invited successfully",
  "membership": {
    "id": "uuid",
    "projectId": "uuid",
    "userId": "uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "user": {
      "id": "uuid",
      "email": "member@example.com"
    }
  }
}
```

#### Remove Member
- **URL**: `DELETE /api/projects/{projectId}/members/{membershipId}`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success** (200):
```json
{
  "message": "Member removed successfully"
}
```

## Panduan Integrasi untuk Frontend

### Autentikasi

1. **Register dan Login**
   - Simpan token JWT di localStorage atau cookie
   - Gunakan token untuk semua request selanjutnya

```javascript
// Contoh login dan menyimpan token
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } else {
    throw new Error(data.message);
  }
};
```

### Membuat Request Terautentikasi

```javascript
// Contoh fungsi untuk membuat request terautentikasi
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};

// Contoh penggunaan
const getProjects = () => authFetch('http://localhost:3000/api/projects');
const createProject = (name) => authFetch('http://localhost:3000/api/projects', {
  method: 'POST',
  body: JSON.stringify({ name }),
});
```

### Implementasi Drag and Drop untuk Tasks

Untuk implementasi drag and drop task antar status (kanban-style), gunakan endpoint update task:

```javascript
// Contoh update status task saat di-drag and drop
const updateTaskStatus = async (projectId, taskId, newStatus) => {
  return authFetch(`http://localhost:3000/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus }),
  });
};
```

### Implementasi Realtime Updates dengan Socket.IO

Untuk menggunakan fitur realtime updates, tambahkan Socket.IO client di frontend:

```javascript
// Install socket.io-client
// npm install socket.io-client
// atau
// bun add socket.io-client

import { io } from 'socket.io-client';

// Inisialisasi koneksi socket
const socket = io('http://localhost:3000', {
  withCredentials: true,
});

// Menangani koneksi
socket.on('connect', () => {
  console.log('Connected to socket server');
});

// Bergabung dengan room project
const joinProject = (projectId) => {
  socket.emit('join-project', projectId);
};

// Keluar dari room project
const leaveProject = (projectId) => {
  socket.emit('leave-project', projectId);
};

// Mendengarkan event task
socket.on('task-created', (task) => {
  console.log('New task created:', task);
  // Update UI dengan task baru
});

socket.on('task-updated', (task) => {
  console.log('Task updated:', task);
  // Update UI dengan task yang diperbarui
});

socket.on('task-deleted', (task) => {
  console.log('Task deleted:', task);
  // Hapus task dari UI
});

socket.on('task-status-changed', (data) => {
  console.log('Task status changed:', data);
  // Update UI dengan status task yang diperbarui
  // data berisi oldStatus dan newStatus untuk animasi drag-and-drop
});

// Mendengarkan event member
socket.on('member-added', (data) => {
  console.log('Member added:', data);
  // Update UI dengan member baru
});

socket.on('member-removed', (data) => {
  console.log('Member removed:', data);
  // Hapus member dari UI
});

// Mendengarkan event project
socket.on('project-updated', (project) => {
  console.log('Project updated:', project);
  // Update UI dengan project yang diperbarui
});

socket.on('project-deleted', (data) => {
  console.log('Project deleted:', data);
  // Redirect jika project yang sedang dilihat dihapus
});

// Menangani disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});
```

## Error Handling

API akan mengembalikan kode status HTTP yang sesuai dengan error yang terjadi:

- **400** - Bad Request (input tidak valid)
- **401** - Unauthorized (token tidak valid atau expired)
- **403** - Forbidden (tidak memiliki akses ke resource)
- **404** - Not Found (resource tidak ditemukan)
- **500** - Server Error

Contoh respons error:

```json
{
  "message": "Error message here"
}
```

## Catatan Penting

- Semua endpoint kecuali register dan login memerlukan token JWT dalam header Authorization
- Project hanya bisa diakses oleh owner atau member
- Hanya owner project yang bisa mengundang/menghapus member dan menghapus project
- Task status harus salah satu dari: "todo", "in-progress", atau "done"
- Fitur realtime menggunakan Socket.IO untuk update otomatis di client

This project was created using `bun init` in bun v1.1.36. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
