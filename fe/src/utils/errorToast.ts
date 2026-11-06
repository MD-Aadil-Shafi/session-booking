import { toast } from "react-toastify";
import { refreshTokenAction } from "../redux/slices/authSlice";

export const errorToast = async(err:any)=>{

    if(typeof err?.response?.data?.message !== "string"){
        let message = ''
        err?.response?.data?.message?.map((item:any)=>{
            message += `Invalid form data : \n
            ${item?.loc?.[1]} : ${item?.msg || item?.type}
            `
        })
        return toast.error(message || "Unable to perform action. Please try later.")
    }else if(typeof err?.response?.data?.message === "string"){
        if(err?.response?.data?.message === "Unable to authenticate Or Invalid token"){
            toast.warn("Token Expired")
            await refreshTokenAction()
            return
        }
        return toast.error(err?.response?.data?.message || "Oops!! something went wrong. Please try later.")

    }
    else{
        return toast.error("Something went wrong. Please Try later")
    }
}