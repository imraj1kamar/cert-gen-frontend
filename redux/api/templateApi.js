// Redux/api/templateApi.js
import { apiCollection } from "@/apiService/apiCollection";

export const templateApi = {
  getTemplates: () => apiCollection.getTemplates(),
  addTemplate: (formData) => apiCollection.addTemplate(formData),
  updateTemplate: (id, data) => apiCollection.updateTemplate(id, data),
  deleteTemplate: (id) => apiCollection.deleteTemplate(id),
};