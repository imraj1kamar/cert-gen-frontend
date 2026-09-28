import { apiCollection } from "@/apiService/apiCollection";

export const menuApi = {
    getMenus: () => apiCollection.getMenus(),
};