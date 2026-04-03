import Database from "better-sqlite3";
import path from 'path';

const db = new Database(path.join(__dirname, '../../finance.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    Create Table if not Exist Users(
        id interger primary key autoincrement,
        name text not null,
        email text unique not null,
        password text not null,
        role text not null Check(role In ('viewer', 'analyst', 'admin')) Default 'viewer',
        status text not null Check(status In('active', 'inactive')) Default 'active',
        createdAt text not null default (datetime('now'))
    );

    Create Table id not Exist Finance_Records(
        id interger primary key autoincrement,
        amount real not null Check(amount>0),
        type text not null Check(type In ('income', 'expense')),
        category text not null,
        date text not null,
        notes text,
        createdBy integer not null References Users(id),
        deletedAt text default null,
        createdAt text not null default (datetime('now')),
        updatedAt text not null default (datetime('now'))
    );
    `);

export default db;