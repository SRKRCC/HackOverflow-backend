export interface Task {
    id: number;
    title: string;
    description?: string | null;
    difficulty?: "easy" | "medium" | "hard" | null;
    round_num: number;
    points: number;
    completed: boolean;
    in_review: boolean;
    timestamp: Date;

    // Relation
    teamId: number;
    team?: Team;
}

// Import Team at bottom
import type { Team } from "./Team.js";