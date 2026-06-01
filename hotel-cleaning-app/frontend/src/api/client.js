const BASE = '/api';

async function request(method, path, body, isFormData = false) {
  const options = {
    method,
    credentials: 'include',
  };

  if (body) {
    if (isFormData) {
      options.body = body;
    } else {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Błąd serwera');
  }

  return data;
}

export const api = {
  // Auth
  login: (pin) => request('POST', '/auth/login', { pin }),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me'),

  // Rooms
  getRooms: () => request('GET', '/rooms'),
  addRoom: (number, floor) => request('POST', '/rooms', { number, floor }),
  deleteRoom: (id) => request('DELETE', `/rooms/${id}`),
  assignRoom: (id, data) => request('PUT', `/rooms/${id}/assign`, data),
  setRoomStatus: (id, status) => request('PUT', `/rooms/${id}/status`, { status }),

  // Common areas
  getCommonAreas: () => request('GET', '/common-areas'),
  addCommonArea: (name) => request('POST', '/common-areas', { name }),
  deleteCommonArea: (id) => request('DELETE', `/common-areas/${id}`),
  assignCommonArea: (id, assigned_to) => request('PUT', `/common-areas/${id}/assign`, { assigned_to }),
  setCommonAreaStatus: (id, status) => request('PUT', `/common-areas/${id}/status`, { status }),

  // Issues
  getIssues: () => request('GET', '/issues'),
  addIssue: (formData) => request('POST', '/issues', formData, true),
  setIssueStatus: (id, status) => request('PUT', `/issues/${id}/status`, { status }),
  deleteIssue: (id) => request('DELETE', `/issues/${id}`),

  // Other tasks
  getTasks: () => request('GET', '/tasks'),
  addTask: (description, assigned_to) => request('POST', '/tasks', { description, assigned_to }),
  setTaskStatus: (id, status) => request('PUT', `/tasks/${id}/status`, { status }),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  // Users
  getCleaners: () => request('GET', '/users/cleaners'),
  addUser: (name, role, pin) => request('POST', '/users', { name, role, pin }),
  deleteUser: (id) => request('DELETE', `/users/${id}`),
};
