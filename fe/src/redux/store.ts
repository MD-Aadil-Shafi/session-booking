import { configureStore } from "@reduxjs/toolkit";
import authSlice from './slices/authSlice'
import profSlice from './slices/professionalSlice';
import sessionSlice from './slices/sessionSlice';

export const store:any = configureStore({
    reducer:{
        auth: authSlice,
        professionals: profSlice,
        sessions: sessionSlice,
    }
})

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
