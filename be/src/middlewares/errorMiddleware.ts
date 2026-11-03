import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "@/utils/apiError.utils.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    err = new ApiError(400, err.issues.map((e) => e.message).join(", "));
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message =
    err instanceof ApiError ? err.message : "Internal server error";


  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
