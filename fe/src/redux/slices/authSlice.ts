import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { baseUrl } from "../baseUrl";
import { toast } from "react-toastify";
import { errorToast } from "../../utils/errorToast";

type registerType = {
    firstName: string;
    lastName: string;
    role: String;
    about: String;
    email: string;
    password: string;
    timezone: string;
}

export const registerAction = createAsyncThunk(
    '/auth/register',
    async(value: registerType, {rejectWithValue})=>{
        try{
            await axios.post(`${baseUrl}/auth/register`, value)
            toast.success("Account Created Successfully. Login to continue.")
            // console.log('res 20 ', res )
        }catch(err:any){
            // console.log('error reg act', err?.response?.data)
            errorToast(err);
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!")
        }
})

type logingType = {
    email: string
    password: string
}

export const loginAction = createAsyncThunk(
    '/auth/login',
    async(value:logingType, {rejectWithValue})=>{
        try{
            let res = await axios.post(`${baseUrl}/auth/login`, value)
            localStorage.setItem('token',res?.data?.access_token)
            localStorage.setItem('refresh-token',res?.data?.refresh_token)
            let user = await axios.get(`${baseUrl}/auth/get-me`,{
                headers:{
                    Authorization: `Bearer ${res?.data?.access_token}`
                }
            })
            localStorage.setItem('rag-user', JSON.stringify(user?.data))
            toast.success("Welcome Back!")
            setTimeout(()=>{
                window.location.href = "/"
            },1000)
        }catch(err: any){
            errorToast(err)
            // console.log('error', err?.response?.data)
            return rejectWithValue(err?.response?.data?.detail || "Something went wrong!")
        }
    }
)

// not using thunk as it'll be used in .ts file not as a hook
export const refreshTokenAction = async()=>{
    try{
        // here in camelCase as fast api don't take under score on headers
        let res = await axios.get(`${baseUrl}/auth/refresh`,{
                headers:{
                    refreshToken: localStorage.getItem('refresh-token')
                }
            })
            console.log('refresh data', res?.data)
            localStorage.setItem('token',res?.data?.access_token)
            localStorage.setItem('refresh-token',res?.data?.refresh_token)
            toast.success("Session Renewed Successfully!")
            setTimeout(()=>{
                window.location.href = "/"
            },1000)
    }catch(err:any){
        // if(err?.response?.data?.detail === "Invalid R Token ID"){
            toast.error("Session Expired.")
            localStorage.removeItem('rag-user')
            localStorage.removeItem('token')
            localStorage.removeItem('refresh-token')
            setTimeout(()=>{
                window.location.href = "/login"
            },1000)
            return;
        // }
        // errorToast(err)
    }
}

interface AuthState {
    loading: boolean;
    user: object | {};
}
const initialState = {
    loading: false,
    user: JSON.parse(localStorage.getItem('rag-user') || '{}') || {}
} as AuthState


const authSlice = createSlice({
    name: "auth",
    initialState: initialState,
    reducers:{
        // sync
        logout:(state)=>{
            state.user = {}
            localStorage.removeItem('rag-user')
            localStorage.removeItem('token')
            localStorage.removeItem('refresh-token')
            window.location.href = "/login"
        }
    },
    extraReducers:(builder)=>{
        builder.addCase(registerAction.pending, (state)=>{
            state.loading = true
        })
        .addCase(registerAction.fulfilled, (state)=>{
            state.loading = false
        })
        .addCase(registerAction.rejected, (state)=>{
            state.loading = false
        })
        .addCase(loginAction.pending, (state)=>{
            state.loading = true
        })
        .addCase(loginAction.fulfilled, (state, action:PayloadAction<any>)=>{
            state.loading = false,
            state.user = action.payload
        })
        .addCase(loginAction.rejected, (state)=>{
            state.loading = false
        })
    }
})

export const {logout} = authSlice.actions;
export default authSlice.reducer;