import http from 'http';
import { config } from "dotenv";
import { createApp } from "./app.js";
import {prisma} from '@/config/prisma.js'

config();

const PORT = process.env.PORT || 5001

async function shutdown(server: http.Server, exitCode: number){
    console.log("Shutting down....")
    server.close(async () =>{
        console.log("Server stopped.")
        //disconnect db
        await prisma.$disconnect();
        process.exit(exitCode);
    })
}

async function bootstrap(){
    const app = await createApp();
    const server = http.createServer(app);

    server.listen(PORT, ()=>{
        console.log("Server is running on PORT : ",PORT)
    })    

   
    process.on("unhandledRejection", (reason)=>{
        console.error("Unhandled Rejection : ", reason);
        shutdown(server, 1);
    })

  
    process.on("uncaughtException", (error)=>{
        console.error("Uncaught Exception : ", error);
        shutdown(server, 1);
    })

    
}

bootstrap().catch(async (err) =>{
        console.log("Error Cached : ", err);
        //db disconnect
        await prisma.$disconnect();
        process.exit(1);
})