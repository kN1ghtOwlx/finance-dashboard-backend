import z from "zod";
import db from "../db/database.js";

const RecordSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Category is required'),
    date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in DD-MM-YYYY format'),
    notes: z.string().optional(),
});

const addRecord = async (req, res) =>{
    try {
        const result = RecordSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                message: "Data Validation Failed!!",
                error: result.error.flatten()
            })
        };

        const {amount, type, category, date, notes} = result.data;

        const [dd, mm, yyyy] = date.split('-');
        const revDate = `${yyyy}-${mm}-${dd}`;

        const newRecord = db.prepare('Insert into Finance_Records(amount, type, category, date, notes, createdBy) Values(?, ?, ?, ?, ?, ?)').run(amount, type, category, revDate, notes ?? null, req.user.id);

        const newRecordData = db.prepare('Select * from Finance_Records where id = ?').get(newRecord.lastInsertRowid);

        res.status(201).json({
            message: "Record added successfully!!",
            record: newRecordData
        })

    } catch (error) {
        res.status(500).json({message: error.message});
        console.log(("Error in addReords: ", error.message))
    }
}

const getRecords = async (req, res) => {
    try {
        const { type, category, from, to, page = '1', limit = '20' } = req.query;

        const conditions = ['r.deletedAt IS NULL'];
        const params     = [];

        if(type){
            conditions.push('r.type = ?');     
            params.push(type); 
        }
        if(category){
            conditions.push('r.category = ?'); 
            params.push(category); 
        }
        if(from){
            conditions.push('r.date >= ?');    
            params.push(from); 
        }
        if(to){
            conditions.push('r.date <= ?');    
            params.push(to); 
        }

        const where    = `Where ${conditions.join(' and ')}`;
        const pageNum  = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const offset   = (pageNum - 1) * limitNum;

        const { count: total } = db.prepare(`Select Count(*) as count From Finance_Records r ${where}`).get(...params);

        const records = db.prepare(`Select r.*, u.name as createdByName from Finance_Records r Join users u on r.createdBy = u.id ${where} Order by r.date desc, r.createdAt desc limit ? offset ?`).all(...params, limitNum, offset);

        res.status(401).json({
            message: "Records found successfully",
            record: records,
            pagination: {
                page:  pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });

    } catch (error) {
        res.status(500).json({message: error.message});
        console.log(("Error in getReocrds: ", error.message))
    }
}

export {addRecord, getRecords};



// db.prepare(`INSERT INTO financial_records (..., date, ...) VALUES (?, ?, ?, ?, ?, ?)`)
//   .run(amount, type, category, isoDate, notes ?? null, req.user.id);