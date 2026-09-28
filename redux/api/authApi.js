// Redux/api/authApi.js
import { apiCollection } from "@/apiService/apiCollection";

export const authApi = {
  login: (credentials) => apiCollection.login(credentials),
  logout: () => apiCollection.logout(),
  getProfile: () => apiCollection.getProfile(),
};