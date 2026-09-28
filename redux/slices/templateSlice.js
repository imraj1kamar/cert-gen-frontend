// redux/slices/templateSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    templates: [],          // List of templates
    template: null,         // Current selected template
    loading: false,
    error: null,
};

const templateSlice = createSlice({
    name: "template",
    initialState,
    reducers: {
        setTemplate: (state, action) => {
            state.template = action.payload;
            state.loading = false;
        },
        setTemplates: (state, action) => {
            state.templates = action.payload;
            state.loading = false;
        },
        addTemplateToState: (state, action) => {
            state.templates.unshift(action.payload); // push ki jagah unshift use kar sakte hain taaki naya template upar dikhe
        },
        updateTemplateInState: (state, action) => {
            const updatedTemplate = action.payload;
            const index = state.templates.findIndex((t) => t.id === updatedTemplate.id);
            if (index !== -1) {
                state.templates[index] = updatedTemplate;
            }
        },
        removeTemplateFromState: (state, action) => {
            const templateId = action.payload;
            state.templates = state.templates.filter((t) => t.id !== templateId);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearTemplate: (state) => {
            state.template = null;
            state.templates = [];
            state.loading = false;
            state.error = null;
        },
    },
});

export const {
    setTemplate,
    setTemplates,
    addTemplateToState,
    updateTemplateInState,
    removeTemplateFromState,
    setLoading,
    setError,
    clearTemplate,
} = templateSlice.actions;

// Selectors
export const selectTemplate = (state) => state.template.template;
export const selectTemplates = (state) => state.template.templates;
export const selectLoading = (state) => state.template.loading;
export const selectError = (state) => state.template.error;

export default templateSlice.reducer;