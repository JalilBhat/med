import mongoose from "mongoose";

// Your MongoDB URI
const uri: string =
  process.env.MONGODB_URI ||
  (() => {
    throw new Error(
      "Environment variable MONGODB_URI is required but not defined.",
    );
  })();
mongoose
  .connect(uri)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err: Error) => {
    console.error("Error connecting to MongoDB:", {
      message: err.message,
      stack: err.stack,
    });
  });
