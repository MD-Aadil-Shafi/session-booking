import { Router } from "express";
import {
    login, register, refreshToken, logout
} from './auth.ctrl.js'
import { validatePayload } from "@/middlewares/validateSchemaMiddleware.js";
import { loginSchema, registerSchema } from "@/validators/authValidator.js";
import { authMiddleware } from "@/middlewares/authMiddleware.js";

const router = Router();

router.post("/register",validatePayload(registerSchema), register);
router.post("/login", validatePayload(loginSchema), login);
router.get("/refresh", refreshToken);
router.post("/logout", authMiddleware(), logout);


export default router;