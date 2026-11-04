import { Router } from "express";
import { bookSession } from "./session.ctrl.js";
import { authMiddleware } from "@/middlewares/authMiddleware.js";
const router = Router();

router.post("/book", authMiddleware(["USER"]), bookSession);

export default router;