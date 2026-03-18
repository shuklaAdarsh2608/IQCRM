import api from "./api";

export async function fetchUsers() {
  return api.get("/users");
}

export async function createUser(payload) {
  return api.post("/users", payload);
}

export async function resetUserPassword(userId, payload) {
  return api.post(`/users/${userId}/reset-password`, payload);
}

export async function forceLogoutUser(userId) {
  return api.post(`/users/${userId}/force-logout`);
}

export async function deleteUser(userId) {
  return api.delete(`/users/${userId}`);
}

export async function setUserSmtp(userId, payload) {
  return api.post(`/users/${userId}/smtp`, payload);
}

export async function setMySmtp(payload) {
  return api.post(`/users/me/smtp`, payload);
}

