process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import vaultRoutes from "./routes/vaultRoutes.js";
import landingRoute from "./routes/landingRoute.js";

dotenv.config();
connectDB();


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

app.use("/api/",landingRoute);
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
