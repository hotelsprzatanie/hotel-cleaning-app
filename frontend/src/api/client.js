// W produkcji frontend i backend są na tym samym origin — '/api' działa.
// VITE_API_URL ustawiamy tylko gdy frontend jest hostowany osobno.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function request(method, path, body, isFormData = false) {
  const options = { method, credentials: 'include' };
  if (body) {
    if (isFormData) { options.body = body; }
    else { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(body); }
  }
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Błąd serwera');
  return data;
}

export const api = {
  login:  (pin) => request('POST', '/auth/login', { pin }),
  logout: ()    => request('POST', '/auth/logout'),
  me:     ()    => request('GET',  '/auth/me'),

  getRooms:      ()           => request('GET',    '/rooms'),
  addRoom:       (number, floor) => request('POST', '/rooms', { number, floor }),
  deleteRoom:    (id)         => request('DELETE', `/rooms/${id}`),
  assignRoom:    (id, data)   => request('PUT',    `/rooms/${id}/assign`, data),
  setRoomStatus: (id, status, completionNotes) => request('PUT', `/rooms/${id}/status`, { status, completion_notes: completionNotes }),
  resetRoom:     (id) => request('PUT', `/rooms/${id}/reset`),

  getCommonAreas:      ()              => request('GET',    '/common-areas'),
  addCommonArea:       (name)          => request('POST',   '/common-areas', { name }),
  deleteCommonArea:    (id)            => request('DELETE', `/common-areas/${id}`),
  assignCommonArea:    (id, assigned_to) => request('PUT',  `/common-areas/${id}/assign`, { assigned_to }),
  setCommonAreaStatus:   (id, status, completionNotes) => request('PUT', `/common-areas/${id}/status`, { status, completion_notes: completionNotes }),
  resetCommonArea:       (id) => request('PUT', `/common-areas/${id}/status`, { status: 'pending' }),

  getIssues:      ()           => request('GET',    '/issues'),
  addIssue:       (formData)   => request('POST',   '/issues', formData, true),
  setIssueStatus: (id, status) => request('PUT',    `/issues/${id}/status`, { status }),
  deleteIssue:    (id)         => request('DELETE', `/issues/${id}`),

  getTasks:      ()                      => request('GET',    '/tasks'),
  addTask:       (description, assigned_to) => request('POST', '/tasks', { description, assigned_to }),
  setTaskStatus: (id, status, completionNotes) => request('PUT', `/tasks/${id}/status`, { status, completion_notes: completionNotes }),
  deleteTask:    (id)                    => request('DELETE', `/tasks/${id}`),

  getCleaners: ()              => request('GET',    '/users/cleaners'),
  addUser:     (name, role, pin) => request('POST', '/users', { name, role, pin }),
  deleteUser:  (id)            => request('DELETE', `/users/${id}`),
};
