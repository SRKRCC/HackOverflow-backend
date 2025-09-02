export interface Team {
    id: number;
    scc_id?: string | null;
    scc_password?: string | null;
    title: string;
    ps_id: number;
    gallery_images: string[];

    // Relations
    team_members?: Member[];
    tasks?: Task[];
    problem_statement?: ProblemStatement;
}

import type { Member } from "./Member.js";
import type { Task } from "./Task.js";
import type { ProblemStatement } from "./ProblemStatement.js";
