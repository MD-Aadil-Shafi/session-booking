import { Router } from "express";
import { getAvailableSlotsController } from "./availability.ctrl.js";

const router = Router();

router.get(
  "/:professionalId/available-slots",
  getAvailableSlotsController
);

export default router;