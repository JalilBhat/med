import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "User routes are working!" });
});

// POST /api/users/register - Register a new user
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email } = req.body as {
      username: string;
      password: string;
      email?: string;
    };

    // Validate input
    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser: IUser = new User({
      username,
      password: hashedPassword,
      email,
    });

    await newUser.save();

    // Return user data without password
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    res
      .status(201)
      .json({ message: "User registered successfully", user: userResponse });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/users/login - Login user
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    // Find user
    const user: IUser | null = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate access token (5 minutes expiry)
    const accessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "abcdef123456",
      { expiresIn: "5m" },
    );

    // Generate refresh token (7 days expiry)
    const refreshToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_REFRESH_SECRET || "refresh_secret_key_12345",
      { expiresIn: "7d" },
    );

    // Store refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/users/logout - Logout user
router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Clear refresh token from database
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
      }

      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// POST /api/users/refresh - Refresh access token
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token required" });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh_secret_key_12345",
    ) as { id: string; username: string };

    // Check if refresh token exists in database
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "abcdef123456",
      { expiresIn: "5m" },
    );

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// GET /api/users - Get all users with pagination
router.get(
  "/",
  //authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await User.countDocuments();

      // Get paginated users
      const users = await User.find({}, "-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Sort by newest first

      const totalPages = Math.ceil(total / limit);

      res.json({
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// GET /api/users/:id - Get user by ID
router.get(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.id, "-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// PUT /api/users/:id - Update user by ID
router.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email } = req.body as {
        username?: string;
        email?: string;
      };

      // Get user ID from token
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "abcdef123456",
      ) as { id: string };
      const userId = decoded.id;

      // Check if user is updating their own profile or is admin (for now, only self-update)
      if (req.params.id !== userId) {
        res
          .status(403)
          .json({ message: "You can only update your own profile" });
        return;
      }

      // Find and update user
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { username, email },
        { new: true, runValidators: true },
      ).select("-password");

      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// DELETE /api/users/:id - Delete user
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
