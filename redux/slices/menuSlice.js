// redux/slices/menuSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    menus: [],
    loading: false,
    error: null,
    isAuthenticated: false,
};

const menuSlice = createSlice({
    name: "menu",
    initialState,
    reducers: {
        setMenus: (state, action) => {
            state.menus = action.payload;
            state.loading = false;
            state.isAuthenticated = true;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        // Logout par purana menu saaf karne ke liye
        clearMenus: (state) => {
            state.menus = [];
            state.loading = false;
            state.error = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setMenus, setLoading, clearMenus } = menuSlice.actions;

export const selectMenus = (state) => state.menu.menus;
export const selectLoading = (state) => state.menu.loading;

export default menuSlice.reducer;