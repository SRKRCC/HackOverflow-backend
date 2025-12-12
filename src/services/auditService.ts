import type { AuditLogEntry, AuditContext, LogLevel, EventType, ActionType } from '../types/audit.js';
import type { Request } from 'express';
import crypto from 'crypto';

class AuditService {
  private service: string;
  private env: string;
  private enableConsoleOutput: boolean;
  private enableFileOutput: boolean;
  private enableCloudWatch: boolean;

  constructor() {
    this.service = 'hackoverflow-backend';
    this.env = process.env.NODE_ENV || 'development';
    this.enableConsoleOutput = process.env.AUDIT_CONSOLE === 'true' || this.env === 'development';
    this.enableFileOutput = process.env.AUDIT_FILE === 'true' || false;
    this.enableCloudWatch = process.env.AUDIT_CLOUDWATCH === 'true' || false;
  }

  generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  extractContext(req: Request): AuditContext {
    return {
      request_id: req.headers['x-request-id'] as string || this.generateRequestId(),
      user_id: (req as any).user?.id || (req as any).user?.scc_id,
      team_id: (req as any).team?.id,
      ip: req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] as string
    };
  }

  private createLogEntry(
    level: LogLevel,
    event_type: EventType,
    action: ActionType,
    message: string,
    context?: Partial<AuditContext>,
    resource?: string,
    status_code?: number,
    meta?: Record<string, any>
  ): AuditLogEntry {
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0] || '';

    const entry: AuditLogEntry = {
      timestamp,
      date,
      service: this.service,
      env: this.env,
      level,
      event_type,
      action,
      message,
    };

    if (context?.request_id) entry.request_id = context.request_id;
    if (context?.user_id) entry.user_id = context.user_id;
    if (context?.team_id) entry.team_id = context.team_id;
    if (resource) entry.resource = resource;
    if (status_code !== undefined) entry.status_code = status_code;
    if (context?.ip) entry.ip = context.ip;
    if (meta) entry.meta = meta;

    return entry;
  }

  private async outputLog(entry: AuditLogEntry): Promise<void> {
    const logString = JSON.stringify(entry);

    if (this.enableConsoleOutput) {
      const colorMap = {
        INFO: '\x1b[36m',    // Cyan
        WARN: '\x1b[33m',    // Yellow
        ERROR: '\x1b[31m',   // Red
        DEBUG: '\x1b[35m'    // Magenta
      };
      const color = colorMap[entry.level] || '\x1b[0m';
      console.log(`${color}[AUDIT]${'\x1b[0m'} ${logString}`);
    }

    // CloudWatch output (production)
    if (this.enableCloudWatch) {
      // TODO: Send to CloudWatch Logs
      // Could use aws-sdk or winston-cloudwatch
    }
  }


  async logAuth(
    action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT_SUCCESS',
    context: Partial<AuditContext>,
    resource: string,
    status_code: number,
    meta?: Record<string, any>
  ): Promise<void> {
    const event_type: EventType = action.includes('LOGIN') ? 'USER_LOGIN' : 'USER_LOGOUT';
    const level: LogLevel = action.includes('FAILED') ? 'WARN' : 'INFO';
    const message = `User ${action.toLowerCase().replace('_', ' ')} on ${resource}`;

    const entry = this.createLogEntry(
      level,
      event_type,
      action,
      message,
      context,
      resource,
      status_code,
      meta
    );

    await this.outputLog(entry);
  }


  async logTeamAuth(
    action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT_SUCCESS',
    context: Partial<AuditContext>,
    resource: string,
    status_code: number,
    meta?: Record<string, any>
  ): Promise<void> {
    const event_type: EventType = action.includes('LOGIN') ? 'TEAM_LOGIN' : 'TEAM_LOGOUT';
    const level: LogLevel = action.includes('FAILED') ? 'WARN' : 'INFO';
    const message = `Team ${action.toLowerCase().replace('_', ' ')} on ${resource}`;

    const entry = this.createLogEntry(
      level,
      event_type,
      action,
      message,
      context,
      resource,
      status_code,
      meta
    );

    await this.outputLog(entry);
  }

  async logRegistration(
    action: 'REGISTER_ATTEMPT' | 'REGISTER_SUCCESS' | 'REGISTER_FAILED',
    type: 'USER_REGISTRATION' | 'TEAM_REGISTRATION',
    context: Partial<AuditContext>,
    resource: string,
    status_code: number,
    meta?: Record<string, any>
  ): Promise<void> {
    const level: LogLevel = action === 'REGISTER_FAILED' ? 'ERROR' : 'INFO';
    const message = `${type.toLowerCase().replace('_', ' ')} ${action.toLowerCase().replace('_', ' ')}`;

    const entry = this.createLogEntry(
      level,
      type,
      action,
      message,
      context,
      resource,
      status_code,
      meta
    );

    await this.outputLog(entry);
  }

  async logTask(
    action: 'SUBMIT_TASK' | 'APPROVE_TASK' | 'REJECT_TASK',
    context: Partial<AuditContext>,
    resource: string,
    status_code: number,
    meta?: Record<string, any>
  ): Promise<void> {
    const event_type: EventType = action === 'SUBMIT_TASK' ? 'TASK_SUBMISSION' : 
                                 action === 'APPROVE_TASK' ? 'TASK_APPROVAL' : 'TASK_REJECTION';
    const message = `Task ${action.toLowerCase().replace('_', ' ')}`;

    const entry = this.createLogEntry(
      'INFO',
      event_type,
      action,
      message,
      context,
      resource,
      status_code,
      meta
    );

    await this.outputLog(entry);
  }


  async logAdmin(
    action: ActionType,
    context: Partial<AuditContext>,
    resource: string,
    status_code: number,
    message: string,
    meta?: Record<string, any>
  ): Promise<void> {
    const entry = this.createLogEntry(
      'INFO',
      'ADMIN_ACTION',
      action,
      message,
      context,
      resource,
      status_code,
      meta
    );

    await this.outputLog(entry);
  }

  async logEmail(
    action: 'SEND_EMAIL',
    success: boolean,
    context: Partial<AuditContext>,
    recipient: string,
    subject: string,
    meta?: Record<string, any>
  ): Promise<void> {
    const event_type: EventType = success ? 'EMAIL_SENT' : 'EMAIL_FAILED';
    const level: LogLevel = success ? 'INFO' : 'ERROR';
    const message = `Email ${success ? 'sent to' : 'failed to send to'} ${recipient}: ${subject}`;
    const finalMeta = { ...meta, recipient, subject };

    const entry = this.createLogEntry(
      level,
      event_type,
      action,
      message,
      context,
      undefined,
      success ? 200 : 500,
      finalMeta
    );

    await this.outputLog(entry);
  }

  async logSecurity(
    action: 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY',
    context: Partial<AuditContext>,
    resource: string,
    message: string,
    meta?: Record<string, any>
  ): Promise<void> {
    const entry = this.createLogEntry(
      'WARN',
      'SECURITY_EVENT',
      action,
      message,
      context,
      resource,
      403,
      meta
    );

    await this.outputLog(entry);
  }

  async logError(
    error: Error,
    context: Partial<AuditContext>,
    resource?: string,
    meta?: Record<string, any>
  ): Promise<void> {
    const finalMeta = { 
      ...meta, 
      error_name: error.name,
      error_stack: error.stack
    };

    const entry = this.createLogEntry(
      'ERROR',
      'SYSTEM_ERROR',
      'VIEW_DATA',
      error.message,
      context,
      resource,
      500,
      finalMeta
    );

    await this.outputLog(entry);
  }
}

export const auditService = new AuditService();
export default auditService;