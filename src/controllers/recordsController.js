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

export {addRecord};



// db.prepare(`INSERT INTO financial_records (..., date, ...) VALUES (?, ?, ?, ?, ?, ?)`)
//   .run(amount, type, category, isoDate, notes ?? null, req.user.id);