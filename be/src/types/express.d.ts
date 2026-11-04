declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: "MEMBER" | "PROFESSIONAL" | "USER";
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
      };
    }
  }
}

export {};