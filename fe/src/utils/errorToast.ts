import { toast } from "react-toastify";
import { refreshTokenAction } from "../redux/slices/authSlice";

export const errorToast = async(err:any)=>{

    if(err?.response?.data?.message){
        return toast.error(err?.response?.data?.message || "Oops!! something went wrong. Please try later.")
    }else if(typeof err?.response?.data?.detail !== "string"){
        let message = ''
        err?.response?.data?.detail?.map((item:any)=>{
            message += `Invalid form data : \n
            ${item?.loc?.[1]} : ${item?.msg || item?.type}
            `
        })
        return toast.error(message || "Unable to perform action. Please try later.")
    }else if(typeof err?.response?.data?.detail === "string"){
        if(err?.response?.data?.detail === "Invalid token"){
            toast.warn("Token Expired")
            await refreshTokenAction()
            return
        }
        return toast.error(err?.response?.data?.detail || "Oops!! something went wrong. Please try later.")

    }
    else{
        return toast.error("Something went wrong. Please Try later")
    }
}