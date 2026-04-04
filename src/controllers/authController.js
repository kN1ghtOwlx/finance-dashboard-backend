import {z} from "zod";
import db from "../db/database.js";
import generateTokenAndSetCookies from "../utils/generateTokenAndSetCookies.js";
import bcrypt from "bcryptjs";

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const authLogin = async (req, res) => {
    // res.send("Logged in Succesfully");
    try {
        const result = LoginSchema.safeParse(req.body);

        if(!result.success){
            return res.status(400).json({message: "Validation Failed!!"})
        };

        const {email, password} = result.data;

        const user = db.prepare('Select * From Users Where email = ?').get(email);
        if(!user){
            return res.status(401).json({message: "Invalid User or Password!"})
        };

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(401).json({message: "Invalid User or Password!"})
        };

        if(user.status == 'inactive'){
            return res.status(403).json({message: "User has been deactivated!!"})
        };

        generateTokenAndSetCookies(user.id, res);
        res.json({
            message: "Logged in Successfully!!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        res.status(500).json({message: error.message});
        console.log("Error in authLogin: ", error.message);
    }
}

const authLogout = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 1});
        res.status(200).json({message: "Logged out successfully"})
    } catch (error) {
        res.status(500).json({message: error.message});
        console.log("Error in logoutUSer: ", error.message)
    }
}

export {authLogin, authLogout};