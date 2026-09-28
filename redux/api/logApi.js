// Redux/api/logApi.js
import { apiCollection } from "@/apiService/apiCollection";

export const logApi = {
  getLogs: () => apiCollection.getLogs(),
};