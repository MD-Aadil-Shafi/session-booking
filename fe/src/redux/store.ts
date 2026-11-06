import { configureStore } from "@reduxjs/toolkit";
import authSlice from './slices/authSlice'
import profSlice from './slices/professionalSlice';

export const store:any = configureStore({
    reducer:{
        auth: authSlice,
        professionals: profSlice,
    }
})

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
