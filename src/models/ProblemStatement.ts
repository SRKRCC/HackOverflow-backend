export interface ProblemStatement {
    id: number;
    title: string;
    description: string;
    category: string;

    // Relations
    Team?: Team[];
}

import type { Team } from "./Team.js";
