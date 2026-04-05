import z from "zod";
import db from "../db/database.js";

const CreateUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['viewer', 'analyst', 'admin']).default('viewer'),
});

const UpdateUserSchema = z.object({
    name: z.string().min(1).optional(),
    role: z.enum(['viewer', 'analyst', 'admin']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});

const getUsers = (req, res) => {
    try {
        const user = db.prepare('Select id, name, email, role, status, createdAt from Users').all();
        res.json(user);

    } catch (error) {
        res.status(401).json({message: error.message});
        console.log("Error in getUsers: ", error.message);
    }
}

export {getUsers};