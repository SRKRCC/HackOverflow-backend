export enum TaskStatus {
    Pending = "pending",
    InReview = "in_review",
    Completed = "completed",
}

export interface Task {
    id: number;
    title: string;
    description?: string | null;
    difficulty?: "easy" | "medium" | "hard" | null;
    round_num: number;
    points: number;
    status: TaskStatus;
    completed: boolean;
    teamNotes?: string;
    reviewNotes?: string;
    timestamp: Date;

    // Relation
    teamId: number;
    team?: Team;
}

// Import Team at bottom
import type { Team } from "./Team.js";