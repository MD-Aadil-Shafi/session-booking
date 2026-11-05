import { Router } from "express";
import * as controller from './notification.ctrl.js'
import { authMiddleware } from "@/middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware());

router.get("/", controller.list);
router.get("/unread-count", controller.unreadCount);
router.patch("/:id/read", controller.markRead);

export default router;