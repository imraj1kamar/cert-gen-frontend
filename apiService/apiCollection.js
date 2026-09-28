// api/apiCollection.js
import { apiService } from "./apiService";

export const apiCollection = {
  // Auth
  login: (credentials) => apiService.post("/api/auth/login", credentials),
  logout: () => apiService.post("/api/auth/logout"),
  getProfile: () => apiService.get("/api/auth/profile"),
  
  // Menus
  getMenus: () => apiService.get("/api/menus"),

  // Users
  getUsers: () => apiService.get("/api/users"),
  addUser: (userData) => apiService.post("/api/users", userData),
  updatePermissions: (id, permissions) => apiService.put(`/api/users/${id}/permissions`, permissions),
  deleteUser: (id) => apiService.delete(`/api/users/${id}`),

  // Signatories
  getSignatories: () => apiService.get("/api/signatories"),
  addSignatory: (formData) => apiService.post("/api/signatories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),   
  updateSignatory: (id, formData) => apiService.put(`/api/signatories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),  
  deleteSignatory: (id) => apiService.delete(`/api/signatories/${id}`),

  // Templates
  getTemplates: () => apiService.get("/api/templates"),
  addTemplate: (formData) => apiService.post("/api/templates", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateTemplate: (id, data) => apiService.put(`/api/templates/${id}`, data),
  deleteTemplate: (id) => apiService.delete(`/api/templates/${id}`),

  // Logs
  getLogs: () => apiService.get("/api/logs"),

  // ⭐️ Master Certificate Generation Engine
  generateCertificates: (formData) => apiService.post("/api/generate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob", 
  }),
};