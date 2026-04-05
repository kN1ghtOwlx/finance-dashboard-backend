import z from "zod";
import db from "../db/database.js";
import bcrypt from "bcryptjs";

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
};

const addUsers = async (req, res) => {
    try {
        const result = CreateUserSchema.safeParse(req.body);

        if(!result.success){
            return res.status(400).json({message: "Validation Failed!!"})
        };

        const {name, email, password, role} = result.data;
        const hashPassword = await bcrypt.hash(password, 10);

        const userExist = db.prepare('Select * from Users where email = ?').get(email);
        if(userExist){
            return res.status(400).json({message: "User already exists!"})
        };

        const newUser = db.prepare('Insert into Users (name, email, password, role) Values(?, ?, ?, ?)').run(name, email, hashPassword, role);
        const newUserDate = db.prepare('Select id, name, email, role, status from Users where id = ?').get(newUser.lastInsertRowid);

        res.status(201).json({
            message: "New user Created!",
            user: newUserDate
        })

    } catch (error) {
        res.status(500).json({message: error.message});
        console.log("Error in addUsers: ", error.message);
    }
}

export {getUsers, addUsers};