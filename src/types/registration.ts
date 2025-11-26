export interface MemberRegistrationData {
  name: string;
  email: string;
  phone: string;
  collegeName: string;
  department: string;
  yearOfStudy: number;
  location: string;
  tShirtSize: string;
  photo: any; // File object/path - will be handled as Express.Multer.File
}

export interface ProblemStatementData {
  id?: string;
  psId?: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  isCustom: boolean;
}

export interface PaymentData {
  totalMembers: number;
  amountPerHead: number;
  totalAmount: number;
}

export interface TeamRegistrationRequest {
  teamName: string;
  lead: MemberRegistrationData;
  members: MemberRegistrationData[];
  problemStatement: ProblemStatementData;
  payment: PaymentData;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface RegistrationResponse {
  success: boolean;
  teamId?: number;
  sccId?: string;
  message: string;
  errors?: ValidationError[];
}