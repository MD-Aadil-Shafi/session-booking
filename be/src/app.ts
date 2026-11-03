import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { errorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from "@/modules/auth/auth.route.js"
import professionalRoutes from "@/modules/professionals/professional.route.js"

export async function createApp(){
    const app = express();
    app.use(cors())
    app.use(cookieParser())
    app.use(express.json())

    app.get("/health", (_, res)=>{
        res.status(200).json({
            success: true,
            message: "Server is running."
        })
    })

    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/professional", professionalRoutes);
    
    
    app.use(errorHandler);

    return app;

}