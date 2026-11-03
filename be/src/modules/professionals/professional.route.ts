import { Router } from "express";
import {
  setWorkingHours,
  listProfessionals,
  getProfessional,
} from "./professional.ctrl.js";

const router = Router();

router.get("/", listProfessionals);
router.get("/:id", getProfessional);
router.put("/:id/working-hours", setWorkingHours);

export default router;