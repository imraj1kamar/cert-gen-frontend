// Redux/api/signatoryApi.js
import { apiCollection } from "@/apiService/apiCollection";

export const signatureApi = {
  getSignatures: () => apiCollection.getSignatories(),
  addSignature: (formData) => apiCollection.addSignatory(formData),
  updateSignature: (id, formData) => apiCollection.updateSignatory(id, formData),  
  deleteSignature: (id) => apiCollection.deleteSignatory(id),
};