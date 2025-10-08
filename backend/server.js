import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import vaultRoutes from "./routes/vaultRoutes.js";
import landingRoute from "./routes/landingRoute.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ✅ CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "https://passwordgenerato2.netlify.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// ✅ Middleware
app.use(express.json({ limit: "2mb" }));

// ✅ Routes
app.use("/api", landingRoute);
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

// ✅ Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
