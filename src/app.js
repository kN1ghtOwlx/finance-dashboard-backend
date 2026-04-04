import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js"
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes)

app.listen(PORT, () => {
    console.log("App running on port: ", PORT);
})