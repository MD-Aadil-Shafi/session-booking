import { Router } from "express";
import { getAvailableSlots } from "./availability.ctrl.js";

const router = Router();

router.get(
  "/:professionalId/available-slots",
  getAvailableSlots
);

export default router;