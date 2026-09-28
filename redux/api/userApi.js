// Redux/api/userApi.js
import { apiCollection } from "@/apiService/apiCollection";

export const userApi = {
  getUsers: () => apiCollection.getUsers(),
  addUser: (userData) => apiCollection.addUser(userData),
  updatePermissions: (id, permissions) => apiCollection.updatePermissions(id, permissions),
  deleteUser: (id) => apiCollection.deleteUser(id),
};