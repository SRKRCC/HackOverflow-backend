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

## API Endpoints

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Create a new member
- `GET /api/members/:id` - Get member by ID
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Leaderboard
- `GET /api/leaderboards` - Get leaderboard with caching

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

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

