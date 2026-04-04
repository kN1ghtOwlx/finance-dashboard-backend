import jwt from "jsonwebtoken";

const generateTokenAndSetCookies = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_KEY, {
        expiresIn: '7d'
    });

    res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true
    });

    return token;
}

export default generateTokenAndSetCookies;