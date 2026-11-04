import { Router } from "express";
import {
  setWorkingHours,
  listProfessionals,
  getProfessional,
} from "./professional.ctrl.js";
import { authMiddleware } from "@/middlewares/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware(["MEMBER"]), listProfessionals);
router.get("/:id", authMiddleware(["MEMBER"]), getProfessional);
router.put("/:id/working-hours", authMiddleware(["PROFESSIONAL"]), setWorkingHours);

export default router;