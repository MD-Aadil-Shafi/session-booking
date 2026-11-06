import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { authTokenHeader, baseUrl } from "../baseUrl";
import { toast } from "react-toastify";
import { errorToast } from "../../utils/errorToast";

interface listType {
    id: string;
    firstName: string;
    lastName: string;
    timezone: string;
}

export const listProfAction = createAsyncThunk(
    '/professional',
    async(_, {rejectWithValue})=>{
        try{
           const res = await axios.get(`${baseUrl}/professional`, {
                headers: {
                    ...authTokenHeader
                }
            })
            return res?.data?.data;
            // console.log('res 20 ', res )
        }catch(err:any){
            console.log('error', err?.response?.data)
            errorToast(err);
            return rejectWithValue(err?.response?.data?.message || "Something went wrong!")
        }
})

export const getSingProfAction = createAsyncThunk(
    '/professional/single',
    async(id:string, {rejectWithValue})=>{
        try{
            let res = await axios.get(`${baseUrl}/professional/${id}`,{
                headers:{
                    ...authTokenHeader
                }
            })
            return res.data

        }catch(err:any){
            errorToast(err)
            return rejectWithValue(err?.response?.data?.message || "Unable to get professional profile. Try again later.")
        }
    }
)

// {
//   "hours": [
//     {
//       "dayOfWeek": 1,
//       "startTime": "09:00",
//       "endTime": "17:00"
//     },

type hoursDataType = {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}
export const addWorkingHoursAction = createAsyncThunk(
    '/professional/setHours',
    async(value: hoursDataType[], {rejectWithValue})=>{
        try{
            const res = await axios.post(`${baseUrl}/professional/working-hours`, value)
            toast.success(res?.data?.message || "Hours updated successfully.")
            return res?.data?.data;
        }catch(err:any){
            console.log('error reg act', err?.response?.data)
            errorToast(err);
            return rejectWithValue(err?.response?.data?.message || "Something went wrong!")
        }
})

type getAvailabilityPayload = {
    professional_id: string;
    timezone: string;
}
export const getAvailabilityAction = createAsyncThunk(
    '/professional/availability',
    async(value:getAvailabilityPayload, {rejectWithValue})=>{
        try{
            let res = await axios.get(`${baseUrl}availability/${value.professional_id}/available-slots?timezone=${value.timezone}`,{
                headers:{
                    ...authTokenHeader
                }
            })
            return res.data

        }catch(err:any){
            errorToast(err)
            return rejectWithValue(err?.response?.data?.message || "Unable to get professional profile. Try again later.")
        }
    }
)


// "workingHours": [
//       {
//         "id": "d35a38ee-001a-4d85-aec5-8042c7d484bd",
//         "professionalId": "797bb98d-de09-413e-8b89-e5c4ca2f51a7",
//         "dayOfWeek": 1,
//         "startTime": "09:00",
//         "endTime": "17:00"
//       },

interface addedHoursDataType extends hoursDataType {
    id: string;
    professionalId: string;
}

type workingHoursType = {
    id: string;
    professionalId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface profileType extends listType {
    workingHours: workingHoursType[]
}

interface Slot {
  startsAt: string;
  endsAt: string; 
  localStart: string;
  localEnd: string; 
  timezone: string;
}

export interface availabilityData {
  professionalId: string;
  memberTimezone: string;
  totalSlots: number;
  slots: Slot[];
}

interface profState {
    loading: boolean;
    profList: listType[];
    profProfile: profileType | null;
    addedHours: addedHoursDataType[];
    availability: availabilityData | null;
}
const initialState = {
    loading: false,
    profList: [],
    profProfile: null,
    addedHours: [],
    availability: null
} as profState


const authSlice = createSlice({
    name: "professionals",
    initialState: initialState,
    reducers:{
        // sync
    },
    extraReducers:(builder)=>{
        builder.addCase(listProfAction.pending, (state)=>{
            state.loading = true
        })
        .addCase(listProfAction.fulfilled, (state, action:PayloadAction<listType[]>)=>{
            state.loading = false,
            state.profList = action.payload;
        })
        .addCase(listProfAction.rejected, (state)=>{
            state.loading = false
        })
        .addCase(getSingProfAction.pending, (state)=>{
            state.loading = true
        })
        .addCase(getSingProfAction.fulfilled, (state, action:PayloadAction<profileType>)=>{
            state.loading = false,
            state.profProfile = action.payload
        })
        .addCase(getSingProfAction.rejected, (state)=>{
            state.loading = false
        })
        .addCase(addWorkingHoursAction.pending, (state)=>{
            state.loading = true
        })
        .addCase(addWorkingHoursAction.fulfilled, (state, action:PayloadAction<addedHoursDataType[]>)=>{
            state.loading = false,
            state.addedHours = action.payload
        })
        .addCase(addWorkingHoursAction.rejected, (state)=>{
            state.loading = false
        })
        .addCase(getAvailabilityAction.pending, (state)=>{
            state.loading = true
        })
        .addCase(getAvailabilityAction.fulfilled, (state, action:PayloadAction<availabilityData>)=>{
            state.loading = false,
            state.availability = action.payload
        })
        .addCase(getAvailabilityAction.rejected, (state)=>{
            state.loading = false
        })
    }
})

export const {} = authSlice.actions;
export default authSlice.reducer;