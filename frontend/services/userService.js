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

