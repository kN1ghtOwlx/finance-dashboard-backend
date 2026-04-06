# Finance Dashboard Backend

A Node.js + Express backend for a finance dashboard. It uses **SQLite** for storage, **JWT** for authentication, **role-based access control** for authorization, **Zod** for validation, and **bcryptjs** for password hashing.

## Tech Stack

- **Node.js / Express** – HTTP API server
- **better-sqlite3** – synchronous SQLite database driver
- **jsonwebtoken** – JWT creation and verification
- **cookie-parser** – reads auth cookie from incoming requests
- **bcryptjs** – hashes passwords and compares login passwords
- **zod** – request body validation
- **dotenv** – loads environment variables
- **nodemon** – development auto-restart

## Folder Structure

```txt
src/
  app.js
  controllers/
    authController.js
    dashboardController.js
    recordsController.js
    userController.js
  db/
    database.js
    seed.js
  middleware/
    authMiddleware.js
    roleMiddleware.js
  routes/
    authRoutes.js
    dashboardRoutes.js
    recordsRoutes.js
    usersRoutes.js
  utils/
    generateTokenAndSetCookies.js
```

## Environment Variables

Create a `.env` file with:

```env
PORT=3000
JWT_KEY=your_secret_jwt_key
```

## Setup

```bash
npm install
npm run seed
npm run dev
```

- `npm run seed` creates the default admin user if it does not already exist.
- `npm run dev` starts the server with nodemon.

## Database

The app uses a local SQLite database file named `finance.db`.

### Tables

#### `Users`
Stores app users.

- `id` – primary key
- `name` – user name
- `email` – unique email
- `password` – hashed password
- `role` – `viewer`, `analyst`, or `admin`
- `status` – `active` or `inactive`
- `createdAt` – timestamp

#### `Finance_Records`
Stores income/expense records.

- `id` – primary key
- `amount` – positive number
- `type` – `income` or `expense`
- `category` – category name
- `date` – stored as ISO-like text (`YYYY-MM-DD`)
- `notes` – optional notes
- `createdBy` – user id
- `deletedAt` – soft-delete timestamp
- `createdAt` – timestamp
- `updatedAt` – timestamp

### SQLite configuration used

- `journal_mode = WAL` for better concurrency/performance
- `foreign_keys = ON` to enforce references

## Authentication Flow

1. User logs in with email and password.
2. Password is checked using `bcrypt.compare()`.
3. A JWT is created with `jsonwebtoken.sign()`.
4. The token is saved in an **HTTP-only cookie** named `jwt`.
5. Protected routes read the token from either:
   - `Cookie: jwt=...`
   - `Authorization: Bearer <token>`

## Authorization / Roles

The app uses three roles:

- **viewer** – lowest access
- **analyst** – medium access
- **admin** – highest access

The role middleware compares the user's role against the minimum role required by a route.

## API Routes

Base URL prefix used by the app:

- `/api/auth`
- `/api/users`
- `/api/records`
- `/api/dashboard`

---

## Auth Routes

### `POST /api/auth/login`
Logs in a user.

**Body**
```json
{
  "email": "admin@gmail.com",
  "password": "admin@123"
}
```

**What it does**
- Validates the body with Zod
- Finds the user by email
- Compares password with bcrypt
- Rejects inactive users
- Generates JWT and sets it in a cookie
- Returns basic user info

**Success response**
```json
{
  "message": "Logged in Successfully!!",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@gmail.com",
    "role": "admin"
  }
}
```

**Techniques used**
- Zod validation for safe input checking
- bcrypt password comparison
- JWT cookie auth
- HTTP-only cookie to reduce XSS exposure

---

### `POST /api/auth/logout`
Logs out the user.

**What it does**
- Clears the `jwt` cookie by setting it to an empty value with a very short expiry

**Success response**
```json
{
  "message": "Logged out successfully"
}
```

**Techniques used**
- Cookie invalidation for session logout

---

## Users Routes

All `/api/users` routes require:
- authentication
- `admin` role

That protection is applied at router level with:
```js
router.use(authMiddleware, roleAccess('admin'));
```

### `GET /api/users`
Returns all users.

**What it does**
- Reads users from the `Users` table
- Returns selected fields only

**Response shape**
```json
[
  {
    "id": 1,
    "name": "Admin",
    "email": "admin@gmail.com",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-04-06 10:00:00"
  }
]
```

**Techniques used**
- Direct SQL query
- Field projection to avoid returning password hashes

---

### `POST /api/users`
Creates a new user.

**Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "viewer"
}
```

**What it does**
- Validates input with Zod
- Hashes password with bcrypt
- Checks for duplicate email
- Inserts the user into SQLite
- Returns the created user without password

**Success response**
```json
{
  "message": "New user Created!",
  "user": {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "viewer",
    "status": "active"
  }
}
```

**Techniques used**
- Password hashing with bcrypt
- Duplicate-check before insert
- Zod enum validation for role

---

### `PATCH /api/users/:id`
Updates a user.

**Body examples**
```json
{ "name": "John Updated" }
```

```json
{ "role": "analyst", "status": "inactive" }
```

**What it does**
- Validates user id
- Requires at least one of: `name`, `role`, `status`
- Checks that the user exists
- Updates only provided fields
- Returns updated user data

**Success response**
```json
{
  "message": "User data updated successfully",
  "user": {
    "id": 2,
    "name": "John Updated",
    "email": "john@example.com",
    "role": "analyst",
    "status": "inactive"
  }
}
```

**Techniques used**
- Partial schema validation
- Dynamic SQL update building
- Runtime existence check

**Current code note**
- The update logic has a typo in the `status` branch: it uses `status.push(...)` instead of adding to the update field array. That should be fixed in code for status updates to work correctly.

---

## Records Routes

All `/api/records` routes require authentication.

### `POST /api/records`
Creates a finance record.

**Required role:** `admin`

**Body**
```json
{
  "amount": 2500,
  "type": "income",
  "category": "Salary",
  "date": "06-04-2026",
  "notes": "April salary"
}
```

**What it does**
- Validates the body with Zod
- Requires `amount > 0`
- Requires `type` to be `income` or `expense`
- Requires date in `DD-MM-YYYY` format
- Converts date to `YYYY-MM-DD` before storing
- Saves `createdBy` from the authenticated user
- Returns the inserted record

**Success response**
```json
{
  "message": "Record added successfully!!",
  "record": {
    "id": 1,
    "amount": 2500,
    "type": "income",
    "category": "Salary",
    "date": "2026-04-06",
    "notes": "April salary",
    "createdBy": 1,
    "deletedAt": null,
    "createdAt": "2026-04-06 10:00:00",
    "updatedAt": "2026-04-06 10:00:00"
  }
}
```

**Techniques used**
- Zod validation
- Date normalization before persistence
- Foreign key relation through `createdBy`

---

### `GET /api/records`
Fetches records with filters and pagination.

**Required role:** `viewer`

**Query params**
- `type` = `income` or `expense`
- `category` = category name
- `from` = start date
- `to` = end date
- `page` = page number, default `1`
- `limit` = page size, default `20`, max `100`

**Example**
```bash
/api/records?type=expense&category=Food&page=1&limit=10
```

**What it does**
- Builds SQL conditions dynamically from the query params
- Excludes soft-deleted records (`deletedAt IS NULL`)
- Joins `Users` to show the creator name
- Returns pagination metadata

**Success response shape**
```json
{
  "message": "Records found successfully",
  "record": [
    {
      "id": 1,
      "amount": 2500,
      "type": "income",
      "category": "Salary",
      "date": "2026-04-06",
      "notes": "April salary",
      "createdBy": 1,
      "deletedAt": null,
      "createdAt": "2026-04-06 10:00:00",
      "updatedAt": "2026-04-06 10:00:00",
      "createdByName": "Admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

**Techniques used**
- Dynamic SQL WHERE clause building
- Pagination with `LIMIT` and `OFFSET`
- Soft-delete filtering
- SQL join for creator name

**Current code note**
- The current implementation returns HTTP **401** on success. That looks like an accidental status-code bug in the controller. The documented response body above reflects the actual payload shape.

---

### `PATCH /api/records/:id`
Updates a record.

**Required role:** `admin`

**Body example**
```json
{
  "amount": 3000,
  "notes": "Updated salary"
}
```

**What it does**
- Validates record id
- Checks that the record exists and is not deleted
- Accepts partial updates with Zod
- Updates only the provided fields
- Refreshes `updatedAt`
- Returns the updated record

**Success response**
```json
{
  "message": "Record updated Successfully!!",
  "record": {
    "id": 1,
    "amount": 3000,
    "type": "income",
    "category": "Salary",
    "date": "2026-04-06",
    "notes": "Updated salary",
    "createdBy": 1,
    "deletedAt": null,
    "createdAt": "2026-04-06 10:00:00",
    "updatedAt": "2026-04-06 10:05:00"
  }
}
```

**Techniques used**
- Partial schema validation
- Dynamic field list generation for update queries
- Record existence check before update

**Current code note**
- The update code stores the date value as received, so if the API receives a `DD-MM-YYYY` string, it should be normalized before saving for consistency.

---

### `DELETE /api/records/:id`
Soft-deletes a record.

**Required role:** `admin`

**What it does**
- Validates the record id
- Checks that the record exists and is not already deleted
- Sets `deletedAt = datetime('now')`
- Returns the record after deletion

**Success response**
```json
{
  "message": "Record Deleted sucssefully",
  "record": {
    "id": 1,
    "deletedAt": "2026-04-06 10:10:00"
  }
}
```

**Techniques used**
- Soft delete instead of hard delete
- Re-checking record existence before update

---

## Dashboard Routes

All `/api/dashboard` routes require authentication.

### `GET /api/dashboard/summary`
Returns a dashboard summary.

**Required role:** `viewer`

**What it does**
- Calculates total income
- Calculates total expenses
- Calculates net balance
- Counts total active records
- Groups records by category and type
- Returns the latest 10 records with creator name

**Success response shape**
```json
{
  "message": "Record Summary Generated!",
  "summary": {
    "total": {
      "totalIncome": 0,
      "totalExpenses": 0,
      "netBalance": 0,
      "totalRecords": 0
    },
    "byCategory": [],
    "recent": []
  }
}
```

**Techniques used**
- Aggregate SQL (`SUM`, `COUNT`)
- Conditional aggregation for income vs expense
- Grouping by category and type
- Join for recent record creator names
- Excludes soft-deleted rows

---

### `GET /api/dashboard/trend?period=monthly|weekly`
Returns time-series trend data.

**Required role:** `analyst`

**Query param**
- `period` = `monthly` or `weekly`

**What it does**
- Validates the `period` query param
- Uses SQLite `strftime()` to group records by time bucket
- Returns up to 12 periods of trend data

**Success response shape**
```json
{
  "message": "Record Trend Generated!",
  "trend": {
    "period": "monthly",
    "trends": []
  }
}
```

**Techniques used**
- Time-based grouping in SQL
- Dynamic date formatting depending on period
- Aggregation for income, expenses, and net values

---

## Middleware Explained

### `authMiddleware`
- Reads JWT from cookie or Bearer header
- Verifies token using `JWT_KEY`
- Loads the user from the database
- Attaches the user object to `req.user`
- Blocks requests without a valid token

### `roleAccess(minRole)`
- Compares the current user's role with the minimum required role
- Allows route access only if the role level is high enough

## Utilities

### `generateTokenAndSetCookies(userId, res)`
- Signs a JWT with `userId`
- Expires in `7d`
- Stores the token in an HTTP-only cookie named `jwt`
- Uses `sameSite: "none"` and `secure: true`

## Seed User

The seed script creates one admin user if it does not already exist:

- **Email:** `admin@gmail.com`
- **Password:** `admin@123`

## Important Implementation Notes

- This project uses **soft delete** for finance records.
- Passwords are never stored in plain text; they are hashed with bcrypt.
- Some routes rely on authenticated `req.user` data supplied by the auth middleware.
- SQLite queries are written with `better-sqlite3`, so database calls are synchronous.
- The code contains a few minor issues in the current implementation, but the README above documents the behavior as written.

## Example cURL Requests

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin@123"}'
```

### Add Record
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_TOKEN" \
  -d '{"amount":500,"type":"expense","category":"Food","date":"06-04-2026","notes":"Lunch"}'
```

### Get Records
```bash
curl "http://localhost:3000/api/records?page=1&limit=10" \
  -H "Cookie: jwt=YOUR_TOKEN"
```

### Dashboard Summary
```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Cookie: jwt=YOUR_TOKEN"
```

## License

This project currently has no explicit license in the repository.
