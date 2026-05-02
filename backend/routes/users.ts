import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

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

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "abcdef123456",
      { expiresIn: "1h" },
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
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

// PUT /api/users/:id - Update user
router.put(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email } = req.body as {
        username?: string;
        email?: string;
      };

      const updateData: Partial<IUser> = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const userResponse = {
        id: user._id,
        username: user.username,
        email: user.email,
        updatedAt: user.updatedAt,
      };

      res.json({ message: "User updated successfully", user: userResponse });
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
