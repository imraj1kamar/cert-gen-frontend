// Redux/api/generateApi.js
import { apiCollection } from "@/apiService/apiCollection";

export const generateApi = {
    generateCertificates: (formData) => apiCollection.generateCertificates(formData),
};