const Roles = {
    viewer: 1,
    analyst: 2,
    admin: 3
};

const roleAccess = (minRole) => {
    return (req, res, next) => {
        const userRole = Roles[req.user?.role];
        const reqRole = Roles[minRole];

        if(!userRole || userRole<reqRole){
            return res.status(403).json({message: "Permision Denied!! You don't have the access!"})
        };

        next();
    }
}

export default roleAccess;