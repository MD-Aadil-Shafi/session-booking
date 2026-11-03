import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'

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

    return app;

}