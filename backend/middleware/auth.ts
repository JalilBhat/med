import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

    if (!token) {
      res.status(401).json({ message: "Access token required" });
      return;
    }
    console.log("Decoded token:", token);
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "abcdef123456",
    ) as { id: string; username: string };

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "Invalid token - user not found" });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
    } else {
      console.error("Auth middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
