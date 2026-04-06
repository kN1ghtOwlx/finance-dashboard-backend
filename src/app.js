import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js"
import cookieParser from "cookie-parser";
import usersRoutes from "./routes/usersRoutes.js"
import recordsRoutes from "./routes/recordsRoutes.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/records", recordsRoutes);

app.listen(PORT, () => {
    console.log("App running on port: ", PORT);
})