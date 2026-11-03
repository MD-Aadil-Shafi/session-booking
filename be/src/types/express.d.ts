declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: "USER" | "PROFESSIONAL";
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
      };
    }
  }
}

export {};