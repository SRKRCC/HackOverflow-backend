export interface Member {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  profile_image?: string | null;
  department?: string | null;
  college_name: string;
  year_of_study?: number | null;
  location?: string | null;
  attendance: number;

  // Relations
  teamId?: number | null;
  team?: Team | null;
}

// Import Team at bottom to avoid circular dependency issues
import type { Team } from "./Team.js";
