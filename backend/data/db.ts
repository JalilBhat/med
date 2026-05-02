import mongoose from "mongoose";

// Your MongoDB URI
// const uri: string =
//   process.env.MONGODB_URI ||
//   (() => {
//     throw new Error(
//       "Environment variable MONGODB_URI is required but not defined.",
//     );
//   })();
// mongoose
//   .connect(uri)
//   .then(() => console.log("Connected to MongoDB!"))
//   .catch((err: Error) => {
//     console.error("Error connecting to MongoDB:", {
//       message: err.message,
//       stack: err.stack,
//     });
//   });

// export const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.DB_URI as string);

//     console.log("MongoDB connected successfully");
//   } catch (err) {
//     console.error("MongoDB connection failed:", err);
//     process.exit(1);
//   }
// };

export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    (() => {
      throw new Error(
        "Environment variable MONGODB_URI is required but not defined.",
      );
    })();

  try {
    await mongoose.connect(uri);

    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", {
      message: (err as Error).message,
      stack: (err as Error).stack,
    });

    process.exit(1);
  }
};
