// redux/slices/generateSlice.js
import { createSlice } from "@reduxjs/toolkit"; // 👈 Missing import added

const initialState = {
    parsedData: [],           // Excel se nikala hua verified data (API ko bhejne ke liye)
    validationErrors: [],     // Critical errors (Missing Names/Templates)
    validationWarnings: [],   // Soft warnings (Missing Signatures)
    loading: false,           // API call ke time spinner dikhane ke liye
    error: null,
};

const generateSlice = createSlice({
    name: "generate",
    initialState,
    reducers: {
        // Excel parser jab file padh lega, tab ye dispatch hoga
        setValidationResults: (state, action) => {
            state.parsedData = action.payload.validData || [];
            state.validationErrors = action.payload.errors || [];
            state.validationWarnings = action.payload.warnings || [];
            state.error = null;
        },

        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },

        clearGenerateState: (state) => {
            state.parsedData = [];
            state.validationErrors = [];
            state.validationWarnings = [];
            state.loading = false;
            state.error = null;
        },
    },
});

export const {
    setValidationResults,
    setLoading,
    setError,
    clearGenerateState,
} = generateSlice.actions;

// Selectors
export const selectParsedData = (state) => state.generate.parsedData;
export const selectValidationErrors = (state) => state.generate.validationErrors;
export const selectValidationWarnings = (state) => state.generate.validationWarnings;
export const selectLoading = (state) => state.generate.loading;
export const selectError = (state) => state.generate.error;

export default generateSlice.reducer;