# HackOverflow Backend

A Node.js/Express backend application for HackOverflow with Prisma ORM and PostgreSQL database.

## Prerequisites

- Node.js (v16 or higher)
- npm
- PostgreSQL database

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The project uses a `.env` file for configuration. The following environment variables are required:

```env
PORT=3000
DATABASE_URL="your-database-connection-string"
```

### 4. Database Setup

#### Generate Prisma Client

```bash
npx prisma generate --no-engine
```

#### Push Database Schema

```bash
npm run db:push
```

This will create all the necessary tables in your database based on the Prisma schema.

#### Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

### 5. Run the Application

#### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reloading enabled.

#### Production Build

```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run db:push` - Push database schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 🚀 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require authentication via JWT tokens set as cookies (`admin_token` or `team_token`).

---

## 🔐 Authentication Routes (`/auth`)

### Login
**POST** `/api/auth/login`

Authenticate users (admin or team) and receive JWT token.

**Request Body:**
```json
{
  "role": "admin" | "team",
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "message": "admin login successful",
  "role": "admin" | "team",
  "userID": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing required fields or invalid credentials
- `500` - Internal server error

---

## 📊 Leaderboard Routes (`/leaderboards`)

### Get Leaderboard
**GET** `/api/leaderboards`

Retrieve cached leaderboard data with team rankings.

**Success Response (200):**
```json
[
  {
    "teamId": 1,
    "teamName": "Green Farmers",
    "totalPoints": 150,
    "completedTasks": 3,
    "rank": 1
  }
]
```

---

## 📝 Task Routes (`/tasks`) - Admin Only

> 🔒 All task routes require admin authentication

### Create Task
**POST** `/api/tasks`

Create a new task and assign to a team.

**Request Body:**
```json
{
  "title": "Complete Frontend Design",
  "description": "Design the main dashboard",
  "difficulty": "medium",
  "round_num": 1,
  "points": 50,
  "teamId": 1
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "title": "Complete Frontend Design",
  "description": "Design the main dashboard",
  "difficulty": "medium",
  "round_num": 1,
  "points": 50,
  "status": "Pending",
  "completed": false,
  "in_review": false,
  "timestamp": "2025-10-13T10:30:00.000Z",
  "teamId": 1
}
```

### Get All Tasks
**GET** `/api/tasks`

Retrieve all tasks across teams.

**Success Response (200):**
```json
[
  {
    "id": 1,
    "title": "Complete Frontend Design",
    "status": "Pending",
    "team": {
      "id": 1,
      "title": "Green Farmers"
    }
  }
]
```

### Get Task by ID
**GET** `/api/tasks/:id`

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Complete Frontend Design",
  "description": "Design the main dashboard",
  "difficulty": "medium",
  "round_num": 1,
  "points": 50,
  "status": "Pending",
  "completed": false,
  "in_review": false,
  "timestamp": "2025-10-13T10:30:00.000Z",
  "teamId": 1,
  "team": {
    "id": 1,
    "title": "Green Farmers"
  }
}
```

### Update Task
**PUT** `/api/tasks/:id`

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "points": 75
}
```

### Delete Task
**DELETE** `/api/tasks/:id`

**Success Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

### Complete Task (Admin Review)
**POST** `/api/tasks/:id/complete`

Mark task as completed after admin review.

**Request Body:**
```json
{
  "reviewNotes": "Great work on the implementation"
}
```

---

## 📋 Problem Statement Routes (`/problem-statements`)

### Upload CSV (Admin Only)
**POST** `/api/problem-statements/csv`

> 🔒 Requires admin authentication

Upload problem statements via CSV file.

**Request:** Multipart form data with `csv-file` field

**Success Response (200):**
```json
{
  "message": "CSV uploaded and processed successfully",
  "count": 5
}
```

### Get Problem Statements (Team Only)
**GET** `/api/problem-statements`

> 🔒 Requires team authentication

**Success Response (200):**
```json
[
  {
    "id": 1,
    "psId": "HO2K25001",
    "title": "AI-powered Crop Monitoring",
    "description": "Build an AI system to detect crop diseases from images.",
    "category": "Agriculture",
    "tags": ["AI", "Machine Learning", "Agriculture"]
  }
]
```

### Get Problem Statement by ID (Team Only)
**GET** `/api/problem-statements/:id`

> 🔒 Requires team authentication

### Update Problem Statement (Admin Only)
**PUT** `/api/problem-statements/:id`

> 🔒 Requires admin authentication

### Delete Problem Statement (Admin Only)
**DELETE** `/api/problem-statements/:id`

> 🔒 Requires admin authentication

---

## 👥 Team Routes (`/teams`) - Team Only

> 🔒 All team routes require team authentication and valid teamId

### Get Team Details
**GET** `/api/teams/:teamId`

**Success Response (200):**
```json
{
  "id": 1,
  "scc_id": "SCC001",
  "title": "Green Farmers",
  "problem_statement": {
    "id": 1,
    "title": "AI-powered Crop Monitoring",
    "description": "Build an AI system..."
  },
  "gallery_images": ["https://example.com/img1.png"],
  "team_members": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "department": "CSE"
    }
  ]
}
```

### Get Team Tasks
**GET** `/api/teams/:teamId/tasks`

**Success Response (200):**
```json
[
  {
    "id": 1,
    "title": "Complete Frontend Design",
    "difficulty": "medium",
    "points": 50,
    "status": "Pending",
    "completed": false,
    "in_review": false,
    "round_num": 1
  }
]
```

### Get Specific Team Task
**GET** `/api/teams/:teamId/tasks/:id`

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Complete Frontend Design",
  "description": "Design the main dashboard",
  "difficulty": "medium",
  "points": 50,
  "status": "Pending",
  "completed": false,
  "in_review": false,
  "round_num": 1,
  "timestamp": "2025-10-13T10:30:00.000Z",
  "teamNotes": null,
  "reviewNotes": null
}
```

### Submit Task for Review
**POST** `/api/teams/:teamId/tasks/:id/submit`

**Request Body:**
```json
{
  "teamNotes": "Completed the task as per requirements. Added responsive design and animations."
}
```

**Success Response (200):**
```json
{
  "message": "Task submitted for review successfully",
  "task": {
    "id": 1,
    "status": "InReview",
    "in_review": true,
    "teamNotes": "Completed the task as per requirements..."
  }
}
```

---

## 📱 Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## 🔑 Authentication Headers

For requests requiring authentication, include the JWT token:

```javascript
// Cookie-based (automatic)
// Cookies: admin_token=<jwt_token> or team_token=<jwt_token>

// Or header-based
headers: {
  'Authorization': 'Bearer <jwt_token>'
}
```

---

## 📝 Notes

- **Caching**: Leaderboard data is cached for 5 minutes
- **File Uploads**: Only CSV files accepted for problem statements
- **Task Status**: `Pending` → `InReview` → `Completed`
- **Security**: All admin routes require admin authentication
- **Team Routes**: Require valid team authentication and teamId validation

## Project Structure

```
server/
├── src/
│   ├── controllers/     # Route controllers
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   └── server.ts       # Main server file
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── seed.ts         # Database seeding script
│   └── migrations/     # Database migrations
├── lib/
│   └── generated/      # Generated Prisma client
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM and database toolkit
- **PostgreSQL** - Database
- **Node Cache** - In-memory caching
- **ESLint** - Code linting

## Development Notes

- The application uses ES modules (`"type": "module"` in package.json)
- TypeScript compilation target is ESNext
- Database queries are optimized with Prisma
- Leaderboard data is cached for 5 minutes
- Hot reloading is enabled in development mode

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` in `.env` file
2. **Database connection error**: Verify `DATABASE_URL` in `.env` file
3. **Prisma client not found**: Run `npx prisma generate`
4. **Build errors**: Ensure all dependencies are installed with `npm install`

### Database Issues

If you encounter database-related errors:

```bash
# Reset database
npm run db:push

# Regenerate Prisma client
npx prisma generate

# View database in browser
npx prisma studio
```

### Testing and Validation

#### Cache Testing
- **Performance**: First API call fetches from DB, subsequent calls use cache
- **Auto-refresh**: Monitor console logs for cache update timestamps
- **Edge Cases**: Test with teams having 0 tasks or 0 points

#### Data Validation
- **Prisma Studio**: Visual inspection of seeded data
- **API Response**: Verify correct sorting and point calculations
- **Console Logs**: Check for cache update confirmations

