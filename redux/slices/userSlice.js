// redux/slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    users: [],          // List of users
    user: null,         // Current logged-in or selected user
    loading: false,
    error: null,
    isAuthenticated: false,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
            state.loading = false;
            state.isAuthenticated = true;
        },
        // Agar components mein API call ke baad direct users list set karni ho
        setUsers: (state, action) => {
            state.users = action.payload;
            state.loading = false;
        },
        // Naya user add karne ke liye
        addUserToState: (state, action) => {
            state.users.push(action.payload);
        },
        // Permissions update hone ke baad state update karne ke liye
        updateUserInState: (state, action) => {
            const updatedUser = action.payload;
            const index = state.users.findIndex((u) => u.id === updatedUser.id);
            if (index !== -1) {
                state.users[index] = updatedUser;
            }
        },
        // User delete karne ke baad state se hatane ke liye
        removeUserFromState: (state, action) => {
            const userId = action.payload;
            state.users = state.users.filter((u) => u.id !== userId);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        // Logout par sab saaf karne ke liye
        clearUser: (state) => {
            state.user = null;
            state.users = [];
            state.loading = false;
            state.error = null;
            state.isAuthenticated = false;
        },
    },
});

export const { 
    setUser, 
    setUsers, 
    addUserToState, 
    updateUserInState, 
    removeUserFromState, 
    setLoading, 
    setError, 
    clearUser 
} = userSlice.actions;

// Selectors
export const selectUser = (state) => state.user.user;
export const selectUsers = (state) => state.user.users;
export const selectLoading = (state) => state.user.loading;
export const selectError = (state) => state.user.error;

export default userSlice.reducer;