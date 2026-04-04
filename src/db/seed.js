import db from "./database.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const seed = () => {
    const adminExist = db.prepare('Select id from Users Where email = ?').get('admin@gmail.com');

    if(adminExist){
        console.log("Admin exists already!");
        return;
    }

    const adminPassword = bcrypt.hashSync('admin@123', 10);

    db.prepare(`Insert into Users (name, email, password, role) Values (?, ?, ?, ?)`).run('Admin', 'admin@gmail.com', adminPassword, 'admin');
    
    console.log("Admin Created (email: admin@gmail.com | password: admin@123)");
}

seed();