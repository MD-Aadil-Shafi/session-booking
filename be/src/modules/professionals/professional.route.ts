import { Router } from "express";
import {
  setWorkingHours,
  listProfessionals,
  getProfessional,
} from "./professional.ctrl.js";
import { authMiddleware } from "@/middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware(["USER"]), listProfessionals);
router.get("/:id", authMiddleware(["USER"]), getProfessional);
router.put("/:id/working-hours", authMiddleware(["PROFESSIONAL"]), setWorkingHours);

export default router;