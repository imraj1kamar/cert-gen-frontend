// api/apiHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCollection } from "./apiCollection";

// --- Auth Hooks ---
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCollection.login,
    onSuccess: () => {
      // Login ke baad profile query ko invalidate/refetch kar lenge
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCollection.logout,
    onSuccess: () => {
      // Logout ke baad query cache clear kar denge
      queryClient.setQueryData(["profile"], null);
      queryClient.clear();
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: apiCollection.getProfile,
    retry: false, // Agar user logged out hai toh bar-bar retry nahi karega
  });
};

export const useMenus = () => {
  return useQuery({
    queryKey: ["menus"],
    queryFn: apiCollection.getMenus,
  });
}

// --- Users Hooks ---
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: apiCollection.getUsers,
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCollection.addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// --- Signatories Hooks ---
export const useSignatories = () => {
  return useQuery({
    queryKey: ["signatories"],
    queryFn: apiCollection.getSignatories,
  });
};

export const useAddSignatory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCollection.addSignatory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signatories"] });
    },
  });
};

// --- Templates Hooks ---
export const useTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: apiCollection.getTemplates,
  });
};

export const useAddTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCollection.addTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
};

// --- Logs Hooks ---
export const useLogs = () => {
  return useQuery({
    queryKey: ["logs"],
    queryFn: apiCollection.getLogs,
  });
};