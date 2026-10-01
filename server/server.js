import "dotenv/config"; // loads .env into process.env (must be first)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Fail fast if a required secret is missing
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("Missing JWT_SECRET or MONGO_URI. Check your server/.env file.");
  process.exit(1);
}

const app = express();

// Needed on Render/Heroku etc. so secure cookies work behind a proxy
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security headers
app.use(helmet());

// CORS: allow ONLY our frontend, and allow cookies (credentials).
// Never use "*" together with credentials.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json()); // read JSON request bodies
app.use(cookieParser()); // read cookies into req.cookies

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "MERN Auth API is running" });
});

app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
