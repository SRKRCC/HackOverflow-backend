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
  - `generateUniqueSccId()`: Creates sequential team IDs like `SCC001`, `SCC002`
  - `generatePassword()`: Generates secure base64url passwords
- **Security**: Ensures SCC ID uniqueness via database checks with sequential numbering

#### 3. Image Upload & Cloudinary Integration
- **Middleware**: `imageUploadMiddleware` for handling file uploads
- **Validation**: Only allows JPEG, PNG, WEBP images (max 5MB)
- **Storage**: Uploads to Cloudinary with automatic optimization (400x400px)
- **URL Injection**: Stores Cloudinary URLs in profile_image fields
- **Flexible**: Supports both JSON-only and multipart/form-data requests

#### 4. Test Endpoint
- **Endpoint**: `GET /api/registerTeam/test`
- **Purpose**: Verify route mounting and basic functionality
- **Response**: Returns "Register route working"

### Technical Implementation

#### Registration Logic
```typescript
// Register team with lead, members, and problem statement
export async function registerTeam(req: Request, res: Response) {
  // Extract data from request body
  // Validate team title and required fields
  // Check email uniqueness across database and payload
  // Handle problem statement (existing ID or create new)
  // Generate sequential SCC credentials
  // Create team and all members in transaction
  // Return full team with Cloudinary URLs and relations
}
```

#### New Request Structure
```json
{
  "data": {
    "team": { 
      "title": "Team Alpha",
      "gallery_images": ["url1", "url2"] 
    },
    "lead": { 
      "name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "college_name": "ABC University",
      "department": "Computer Science",
      "year_of_study": 3,
      "location": "City"
    },
    "members": [
      {
        "name": "Jane Smith",
        "email": "jane@example.com", 
        "phone_number": "+0987654321",
        "college_name": "ABC University"
      }
    ],
    "problemStatement": { "id": 1 }
  }
}
```

#### Request Validation
- **Required Fields**: name, email, phone_number, college_name for lead; title for team
- **Email Checks**: Duplicate prevention within payload and database
- **Problem Statement**: Create new or link existing by ID
- **Image Validation**: JPEG/PNG/WEBP only, max 5MB per file

#### Database Operations
- **Sequential SCC IDs**: Finds highest existing SCC ID and increments (SCC001, SCC002, etc.)
- **Prisma Transactions**: Ensures atomicity of team and member creation
- **Relations**: Properly links team, members, and problem statements via foreign keys
- **Error Handling**: Handles unique constraint violations and validation errors

#### Image Processing Flow
1. **Upload**: Multer receives multipart/form-data with image files
2. **Validation**: Checks file types (JPEG/PNG/WEBP) and sizes (max 5MB)
3. **Cloudinary**: Uploads to cloud storage with automatic optimization
4. **URL Injection**: Stores returned Cloudinary URLs in request body
5. **Database**: Saves Cloudinary URLs in profile_image fields

### Usage Instructions

#### Testing the Registration API
```bash
# Test route verification
GET http://localhost:3001/api/registerTeam/test

# Register new team (JSON only - no images)
POST http://localhost:3001/api/registerTeam
Content-Type: application/json

{
  "data": {
    "team": { "title": "Team Alpha" },
    "lead": {
      "name": "Team Leader",
      "email": "leader@example.com",
      "phone_number": "9876543210",
      "college_name": "College Name"
    },
    "members": [
      {
        "name": "Member 1",
        "email": "member1@example.com",
        "phone_number": "1234567890",
        "college_name": "College Name"
      }
    ],
    "problemStatement": { "id": 1 }
  }
}

# Register new team (with images)
POST http://localhost:3001/api/registerTeam
Content-Type: multipart/form-data

Form data:
- data: '{"data": {"team": {"title": "Team Alpha"}, "lead": {...}, "members": [...], "problemStatement": {"id": 1}}}'
- leadImage: [file upload for lead profile image]
- memberImages: [file uploads for member profile images in order]
```

#### Environment Variables Required
```bash
# Add to .env file
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key  
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
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

