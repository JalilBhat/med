import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import usersRouter from "./routes/users";

dotenv.config();

// Connect to MongoDB
import "./data/db";
import { connectDB } from "./data/db";

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : [
        "http://localhost:8080",
        "https://localhost:8080",
        "https://localhost:4200",
      ], // Allow specific origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "API Running ... on server now... With CICD pipeline Done",
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      users: "/api/v1/users",
    },
  });
});

// Health check
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/users", usersRouter);

const PORT = process.env.PORT;

const startServer = async () => {
  await connectDB(); // 🔥 IMPORTANT (wait for DB)

  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
};

startServer();
