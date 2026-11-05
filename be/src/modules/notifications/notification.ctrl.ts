import { Request, Response, NextFunction } from "express";
import * as service from './notification.service.js'

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await service.getNotifications(
      req.user!.id
    );

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await service.markAsRead(
      String(req.params.id),
      req.user!.id
    );

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function unreadCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const count = await service.getUnreadCount(
      req.user!.id
    );

    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}