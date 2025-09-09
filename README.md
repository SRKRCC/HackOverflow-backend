# HackOverflow Backend

## My Contributions

### Task 2: Implement Team Registration API

### Features Implemented

#### 1. Team Registration API
- **Endpoint**: `POST /api/registerTeam`
- **Functionality**: Registers a team with lead, members, and problem statement
- **Validation**: Email uniqueness, required fields, duplicate email checks
- **Credentials**: Auto-generates unique `scc_id` and secure `scc_password`
- **Transactions**: Uses Prisma transactions for data consistency

#### 2. Registration Utilities
- **File**: `src/utils/registration.ts`
- **Functions**:
  - `generateUniqueSccId()`: Creates unique team IDs like `SCC-A1B2C3`
  - `generatePassword()`: Generates secure base64url passwords
- **Security**: Ensures SCC ID uniqueness via database checks

#### 3. Test Endpoint
- **Endpoint**: `GET /api/registerTeam/test`
- **Purpose**: Verify route mounting and basic functionality
- **Response**: Returns "Register route working"

### Technical Implementation

#### Registration Logic
```typescript
// Register team with lead, members, and problem statement
export async function registerTeam(req: Request, res: Response) {
  // Validate required fields
  // Check email uniqueness
  // Create/link problem statement
  // Generate SCC credentials
  // Create team and members in transaction
  // Return full team object
}
```

#### Request Validation
- **Required Fields**: name, email, phone_number, college_name for lead
- **Email Checks**: Duplicate prevention within payload and database
- **Problem Statement**: Create new or link existing by ID

#### Database Operations
- **Prisma Transactions**: Ensures atomicity of team and member creation
- **Relations**: Properly links team, members, and problem statements
- **Error Handling**: Handles unique constraint violations and validation errors

### Usage Instructions

#### Testing the Registration API
```bash
# Test route verification
GET http://localhost:3001/api/registerTeam/test

# Register new team
POST http://localhost:3001/api/registerTeam
Content-Type: application/json

{
  "lead": {
    "name": "Team Leader",
    "email": "leader@example.com",
    "phone_number": "9876543210",
    "college_name": "College Name",
    "team_title": "Team Name"
  },
  "members": [...],
  "problemStatement": {...}
}
```

### Task 1: Implement Leaderboard API with Caching

### Features Implemented

#### 1. Leaderboard API with Caching
- **Endpoint**: `GET /api/leaderboard`
- **Functionality**: Returns teams sorted by total points in descending order
- **Caching**: In-memory cache using `node-cache` with 5-minute TTL
- **Auto-refresh**: Cache updates automatically every 5 minutes via `setInterval`
- **Fallback**: If cache is empty, fetches fresh data from database

#### 2. Database Seeding Script
- **File**: `prisma/seed.ts`
- **Purpose**: Populates database with sample data for testing
- **Data Included**:
  - 2 Problem Statements (AI/ML and Sustainability categories)
  - 3 Teams (Alpha, Beta, Gamma) with varying task counts
  - Tasks with different point values (including 0 points edge case)
  - Team Gamma with no tasks (edge case for 0 total points)
  - Sample Members assigned to teams
- **Execution**: `npm run db:seed`

#### 3. Configuration and Dependency Management
- **Dependencies Added**:
  - `node-cache`: For in-memory caching
  - `@types/node-cache`: TypeScript types
  - `tsx`: For running TypeScript in ES modules
  - `@types/node`: Node.js type definitions
- **Scripts Updated**:
  - `dev`: Fixed to use `tsx` for proper ES module support
  - `db:seed`: Added for running seeding script
- **TypeScript Configuration**:
  - Updated `tsconfig.json` to include `prisma/**/*.ts`
  - Changed `rootDir` to support files outside `src/`
  - Removed `prisma` from exclude to enable type checking

### Technical Implementation

#### Leaderboard Logic
```typescript
// Fetch and cache leaderboard data
export const fetchLeaderboard = async (): Promise<void> => {
  const teams = await prisma.team.findMany({
    include: { tasks: true },
  });
  
  const leaderboard = teams.map(team => ({
    id: team.id,
    title: team.title,
    totalPoints: team.tasks.reduce((sum, task) => sum + task.points, 0),
  }));
  
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  cache.set('leaderboard', leaderboard);
};
```

#### Cache Management
- **Initialization**: Cache populated on server startup
- **Periodic Refresh**: Every 5 minutes using `setInterval`
- **TTL**: 5 minutes (300 seconds)
- **Logging**: Console logs for cache updates with timestamps

#### Database Schema Integration
- **Prisma Query**: Efficiently fetches teams with related tasks
- **Point Calculation**: Aggregates task points per team
- **Sorting**: Descending order by total points
- **Edge Cases**: Handles teams with no tasks (0 points)

### Usage Instructions

#### Running the Server
```bash
npm run dev
```
- Server starts on port 3001
- Cache initializes automatically
- Console shows cache update timestamps

#### Testing the Leaderboard API
```bash
# Test the API endpoint
curl http://localhost:3001/api/leaderboards

# Expected response format:
[
  {"id": 1, "title": "Team Alpha", "totalPoints": 45},
  {"id": 2, "title": "Team Beta", "totalPoints": 35},
  {"id": 3, "title": "Team Gamma", "totalPoints": 0}
]
```

#### Database Seeding
```bash
# Populate database with sample data
npm run db:seed

# Verify data with Prisma Studio
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

