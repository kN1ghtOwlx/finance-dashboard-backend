import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const db = new Database(join(__dirname, '../../finance.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    Create Table if not Exists Users(
        id integer primary key autoincrement,
        name text not null,
        email text unique not null,
        password text not null,
        role text not null Check(role In ('viewer', 'analyst', 'admin')) Default 'viewer',
        status text not null Check(status In('active', 'inactive')) Default 'active',
        createdAt text not null default (datetime('now'))
    );

    Create Table if not Exists Finance_Records(
        id integer primary key autoincrement,
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