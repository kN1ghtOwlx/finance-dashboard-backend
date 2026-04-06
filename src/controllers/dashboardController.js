import db from "../db/database.js";


const dashboardSummary = async (req, res) => {
    try {
        const total = db.prepare("Select round(coalesce(sum(case when type = 'income' then amount else 0 end), 0), 2) as totalIncome, round(coalesce(sum(case when type = 'expense' then amount else 0 end), 0), 2) as totalExpenses, round(coalesce(sum(case when type = 'income' then amount else -amount end), 0), 2) as netBalance, count(*) as totalRecords from Finance_Records where deletedAt is NULL").get();

        const byCategory = db.prepare("Select category, type, round(sum(amount), 2) as total, count(*) as count from Finance_Records where deletedAt is NULL group by category, type order by total desc").all();

        const recent = db.prepare("Select r.id, r.amount, r.type, r.category, r.date, r.notes, u.name as createdBy from Finance_Records r join Users u on r.createdBy = u.id  where r.deletedAt is NULL order by r.date desc, r.createdAt desc limit 10").all();

        res.status(200).json({
            message: "Record Summary Generated!",
            summary: {
                total,
                byCategory,
                recent
            }
        })

    } catch (error) {
        res.status(500).json({message: error.message});
        console.log("Error in dashboardSummary: ", error.message)
    }
}

export {dashboardSummary};