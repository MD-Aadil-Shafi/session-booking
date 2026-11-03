import { Request, Response } from 'express'
import jwt, {JwtPayload} from 'jsonwebtoken'
import {
hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, revokeAllRefreshToken
} from '@/utils/auth.utils.js'
import { asyncHandler } from '@/utils/asyncHandler.js'
import {prisma} from '@/config/prisma.js'
import { env } from '@/config/env.js';

type UserData = {
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    country?: string,
    role: "USER" | "PROFESSIONAL",


}

export const register = asyncHandler(async(req:Request, res:Response)=>{
    let userData:UserData;
    userData = req.body;

    let user = await prisma.user.findUnique({
        where:{email: userData.email}
    })
    if (!user) {
        let hashedPass = '';
        if(userData?.password) {
            hashedPass = await hashPassword(userData?.password)
        }
        user = await prisma.user.create({
            data: {
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: userData?.password && hashedPass,
            country: userData?.country
            },
        });
        console.log("created User : ", user)
        const {id, role} = user;
        const token = generateAccessToken({id, role})
        await generateRefreshToken({id, role}, res);
        const {password, ...rest} = user;
        res.status(200).json({
            status:true,
            message: "success",
            token,
            user:rest
        })

    }else{
        return res.status(500).json("User with this email already exists.");
    }
})


export const login = asyncHandler(async(req:Request, res:Response)=>{

    let userData:{email:string, password?:string};

    const {email, password} = req.body;
    userData = {email, password};

    let user = await prisma.user.findUnique({
        where:{email: userData?.email}
    })

    if(user){
        if(userData?.password && user?.password){
            let matched = await verifyPassword(userData?.password , user?.password);
            if(!matched) return res.status(401).json({success:false, message: "Invalid credentials."})
        }
        const {id, role} = user;
        const token = generateAccessToken({id, role})
        await generateRefreshToken({id, role}, res);
        const {password, updatedAt, ...rest} = user;
        res.status(200).json({
            status:true,
            message: "success",
            token,
            user:rest
        })

    }else{
        return res.status(500).json({success:false, message:"Invalid credentials."});
    }
})

interface TokenPayload extends JwtPayload {
  id: string;
  role: string;
}

export const refreshToken = asyncHandler(async(req:Request, res:Response)=>{
    const refToken = req.cookies.eventAuthRefToken;
    if(!refToken) return res.status(400)
            .json({success:false, message: "Invalid Token."});
    
    const decoded = jwt.verify(refToken, env.REFRESH_SECRET!) as TokenPayload;
    const exists = await prisma.refreshToken.findUnique({
        where:{token:refToken, user_id: decoded.id}
    });
    if(!exists) return res.status(400).json({status:false, message: "Invalid Token."});

    //revoke previous token
    await prisma.refreshToken.delete({
        where: {token: refToken}
    });
    //prisma returns the newly created records
    const accessToken = generateAccessToken({id:decoded.id, role:decoded.role});
    await generateRefreshToken({id:decoded.id, role:decoded.role}, res)
    return res.status(201).json({success:true, data:{
        access_token: accessToken
    }})
})


export const logout = asyncHandler(async (req:Request, res:Response)=>{
    await revokeAllRefreshToken(req.user.id, res);
})