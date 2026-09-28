// redux/slices/signatureSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    signatures: [],
    signature: null,
    loading: false,
    error: null,
};

const signatureSlice = createSlice({
    name: "signature", 
    initialState,
    reducers: {
        setSignature: (state, action) => {
            state.signature = action.payload;
            state.loading = false;
        },

        setSignatures: (state, action) => {
            state.signatures = action.payload;
            state.loading = false;
        },

        addSignatureToState: (state, action) => {
            // Naya signature table mein sabse upar dikhega
            state.signatures.unshift(action.payload); 
        },

        // Update ke liye yahi reducer kaam aayega 👇
        updateSignatureInState: (state, action) => {
            const updatedSignature = action.payload;
            const index = state.signatures.findIndex((s) => s.id === updatedSignature.id);
            if (index !== -1) {
                state.signatures[index] = updatedSignature;
            }
        },

        removeSignatureFromState: (state, action) => {
            const signatureId = action.payload; 
            state.signatures = state.signatures.filter((s) => s.id !== signatureId);
        },

        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;  
        },

        clearSignature: (state) => { 
            state.signature = null;
            state.signatures = [];
            state.loading = false;
            state.error = null;
        },
    },
});

export const {
    setSignature,
    setSignatures,
    addSignatureToState,
    updateSignatureInState,
    removeSignatureFromState, 
    setLoading,
    setError,
    clearSignature, 
} = signatureSlice.actions;

export const selectSignature = (state) => state.signature.signature;
export const selectSignatures = (state) => state.signature.signatures;
export const selectLoading = (state) => state.signature.loading;
export const selectError = (state) => state.signature.error;

export default signatureSlice.reducer;