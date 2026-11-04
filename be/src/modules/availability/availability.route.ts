import { Router } from "express";
import { getAvailableSlotsController } from "./availability.ctrl.js";
import { authMiddleware } from "@/middlewares/authMiddleware.js";

const router = Router();

router.get(
  "/:professionalId/available-slots",
  authMiddleware(["MEMBER"]),
  getAvailableSlotsController
);

export default router;