export interface ProblemStatement {
    id: number;
    psId: string;
    title: string;
    description: string;
    category: string;
    tags: string[];

    // Relations
    Team?: Team[];
}

import type { Team } from "./Team.js";
