import jwt, {JwtPayload} from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/prisma.js";
import { env } from "@/config/env.js";


type Role = "MEMBER" | "PROFESSIONAL" | "USER" ;
interface TokenPayload extends JwtPayload {
    id: string;
    //TODO
    //not using role to get extra security to fetch from db
}


export const authMiddleware = (roles?: Role[]) => async(req:Request ,res:Response, next:NextFunction)=>{
    
    let token:string | null = null;
    if(req?.headers?.authorization &&
        req?.headers?.authorization?.startsWith("Bearer")
    ){
        token = req.headers.authorization.split(" ")?.[1]
    }
    if(!token){
        return res.status(401).json({
            success: false,
            message: "Unauthorized."
        })
    }
    try{
    const decoded = jwt.verify(token, env.JWT_SECRET!) as TokenPayload;
    const user = await prisma.user.findUnique({
        where: {id: decoded.id},
    });
    
    if(!user){
            return res.status(401).json({
                success:false,
                message: "No user found!"
            })
        }

    if (roles && !roles.includes(user.role)) {
        return res.status(401).json({
                success:false,
                message: "Forbidden!"
        })
        }

    req.user = user;
    next();
    }catch(error){
       return res.status(401).json({
                success:false,
                message: "Unable to authenticate Or Invalid token"
        }) 
    }

}

/*
authMiddleware();// Any authenticated user
authMiddleware(["USER"]);
authMiddleware(["PROFESSIONAL"]);
authMiddleware(["USER", "PROFESSIONAL"]);

*/ 