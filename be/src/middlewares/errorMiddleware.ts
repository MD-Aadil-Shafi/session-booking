
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "@/utils/apiError.utils.js";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    err = new ApiError(
      400,
      err.issues.map((e) => e.message).join(", ")
    );
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Prisma Error Code:", err.code);
    console.error("Prisma Error Meta:", err.meta);
    console.error("Prisma Client Version:", err.clientVersion);
    switch (err.code) {
      case "P2002": {
        const target = err.meta?.target;
        const field = Array.isArray(target)
          ? target.join(", ")
          : "field";

        err = new ApiError(409, `Duplicate value for ${field}`);
        break;
      }

      case "P2003":
        err = new ApiError(400, "Foreign key constraint failed");
        break;

      case "P2025":
        err = new ApiError(404, "Record not found");
        break;

      case "P2000":
        err = new ApiError(400, "Input value is too long");
        break;

      case "P2011":
        err = new ApiError(400, "Null constraint violation");
        break;

      case "P2012":
        err = new ApiError(400, "Missing required value");
        break;

      case "P2014":
        err = new ApiError(400, "Invalid relation change");
        break;

      case "P2024":
        err = new ApiError(503, "Database connection pool timeout");
        break;

      default:
        err = new ApiError(500, "Database operation failed");
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    err = new ApiError(400, "Invalid database input");
  }

  // Prisma initialization errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    err = new ApiError(503, "Database connection unavailable");
  }
  if (err instanceof Error) {
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);
}

  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  const message =
    err instanceof ApiError ? err.message : "Internal server error";

  // Log actual error details on server
  console.error({
    method: req.method,
    url: req.originalUrl,
    error: err,
  });


  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && err instanceof Error
      ? {
          stack: `DEVELOPMENT MODE ERROR FORMAT => : ${err.stack}`,
          ...(err instanceof Prisma.PrismaClientKnownRequestError
            ? { prismaCode: err.code }
            : {}),
        }
      : {}),
  });
}
