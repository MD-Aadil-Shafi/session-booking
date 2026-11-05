import { Router } from "express";
import { bookSession, cancelSession, mySession, reschedule } from "./session.ctrl.js";
import { authMiddleware } from "@/middlewares/authMiddleware.js";
import { validatePayload } from "@/middlewares/validateSchemaMiddleware.js";
import { bookingSchema } from "@/validators/authValidator.js";
const router = Router();

router.post("/book", authMiddleware(["MEMBER"]), validatePayload(bookingSchema), bookSession);
router.post("/:id/cancel", authMiddleware(["MEMBER", "PROFESSIONAL"]), cancelSession);
router.patch("/:id/reschedule", authMiddleware(["MEMBER"]), reschedule);
router.get('/my', authMiddleware(), mySession);

export default router;