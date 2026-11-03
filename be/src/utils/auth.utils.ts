import jwt, {SignOptions, JwtPayload} from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { Response } from 'express';
import { prisma } from '@/config/prisma.js';
import bcrypt from 'bcryptjs';

export const hashPassword = async(pass: string):Promise<string>=>{
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(pass, salt);
    return hashPassword;
}

export const verifyPassword = async(pass: string, hashed: string):Promise<boolean>=>{
    const isPasswordValid = await bcrypt.compare(pass, hashed);
    return isPasswordValid;
}

interface UserPayload {
    id: string;
    role: string;
}

export const generateAccessToken = (payload: UserPayload): string =>{
    const token = jwt.sign(payload, env.JWT_SECRET!, {
        expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    });
    return token;
    //will store in local store
}


export const generateRefreshToken = async(payload: UserPayload, res:Response)=>{
    try{
        const token = jwt.sign(payload, env.REFRESH_SECRET!, {
            expiresIn: env.REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(env.REFRESH_EXPIRES_DAYS))
        await prisma.refreshToken.create({
            data:{
                user_id: payload.id,
                user_role: payload.role,
                token,
                expires_at: expiresAt
            }
        })
        res.cookie("eventAuthRefToken", token, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 100 * 60 * 60 * 24 * (Number(env.REFRESH_EXPIRES_DAYS) || 30)
        })
        return {success: true, data:token}
    }catch(error){
        console.log("Error in generating refresh token: : ", error)
        return {success:false, data:null}
    }
}


//to log out from all devices
export const revokeAllRefreshToken = async(user_id: string, res:Response)=>{
    try{
        await prisma.refreshToken.deleteMany({
            where: {user_id: user_id}
        })
        return res.status(200).json({success:true, message: "Logged out from all devices successfully."})
    }catch(error){
        console.log("Error in revoking all refresh token: : ", error)
        return res.status(500).json({success:false, message:"Error logging out from all devices. Please try later."})
    }
}
