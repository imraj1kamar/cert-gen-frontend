// redux/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import menuReducer from "./slices/menuSlice"; 
import userReducer from "./slices/userSlice"; 
import templateReducer from "./slices/templateSlice";
import signatureReducer from "./slices/signatoriesSlice";
import generateReducer from "./slices/generateSlice"; // 👈 Naya slice import kiya

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    user: userReducer, 
    template: templateReducer, 
    signature: signatureReducer,
    generate: generateReducer, // 👈 Store mein register kiya
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disabling serializableCheck taaki FormData/File objects jo hum UI 
      // component se Redux state mein bhej rahe hain, unpe warning na aaye
      serializableCheck: false, 
    }),
});

export default store;