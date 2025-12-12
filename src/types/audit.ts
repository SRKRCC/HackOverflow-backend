export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type EventType = 
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTRATION'
  | 'TEAM_REGISTRATION'
  | 'TEAM_LOGIN'
  | 'TEAM_LOGOUT'
  | 'TASK_SUBMISSION'
  | 'TASK_APPROVAL'
  | 'TASK_REJECTION'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'ADMIN_ACTION'
  | 'API_REQUEST'
  | 'DATABASE_QUERY'
  | 'EMAIL_SENT'
  | 'EMAIL_FAILED'
  | 'PAYMENT_VERIFICATION'
  | 'FILE_UPLOAD'
  | 'DATA_ACCESS'
  | 'SECURITY_EVENT'
  | 'SYSTEM_ERROR';

export type ActionType =
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED'
  | 'LOGOUT_SUCCESS'
  | 'REGISTER_ATTEMPT'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'SUBMIT_TASK'
  | 'APPROVE_TASK'
  | 'REJECT_TASK'
  | 'CREATE_TEAM'
  | 'UPDATE_TEAM'
  | 'DELETE_TEAM'
  | 'VIEW_DATA'
  | 'MODIFY_DATA'
  | 'DELETE_DATA'
  | 'UPLOAD_FILE'
  | 'DOWNLOAD_FILE'
  | 'SEND_EMAIL'
  | 'VERIFY_PAYMENT'
  | 'UNAUTHORIZED_ACCESS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY';

export interface AuditLogEntry {
  timestamp: string;
  date: string;
  service: string;
  env: string;
  level: LogLevel;
  event_type: EventType;
  action: ActionType;
  message: string;

  request_id?: string;
  user_id?: string;
  team_id?: string;
  resource?: string;
  status_code?: number;
  
  ip?: string;
  
  meta?: {
    [key: string]: any;
  };
}

export interface AuditContext {
  request_id?: string;
  user_id?: string;
  team_id?: string;
  ip?: string;
}