import jwt from "jsonwebtoken";
import db from "../db/database.js";

const authMiddleware  = async (req, res, next) => {
    try {
        let token = req.cookies.jwt;

        const authHeader = req.headers.authorization;
        if(authHeader && authHeader.startsWith('Bearer ')){
            token = authHeader.split(' ')[1];
        };

        if(!token){
            return res.status(401).json({message: "Unauthorised!!!"})
        };

        const decoded = jwt.verify(token, process.env.JWT_KEY);

        const user = db.prepare('Select id, name, email, role, status Form Users where id = ?').get(decoded.userId);

        if(!user){
            return res.status(401).json({message: "User doesn't exists!"})
        };

        req.user = user;
        next();

    } catch (error) {
        res.status(500).json({message: error.message});
        console.log("Error in authMiddleware: ", error.message);
    }
}

export default authMiddleware;