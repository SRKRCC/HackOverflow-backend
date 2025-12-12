import type { LogLevel, EventType, ActionType } from '../types/audit.js';
import type { Request } from 'express';
import { audit } from './auditLogger.js';
import crypto from 'crypto';

interface AuditContext {
  request_id?: string;
  user_id?: string;
  team_id?: string;
  ip?: string;
  user_agent?: string;
}

class AuditService {
  private service: string;
  private env: string;

  constructor() {
    this.service = 'hackoverflow-backend';
    this.env = process.env.NODE_ENV || 'production';
  }

  generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  extractContext(req: Request): AuditContext {
    const context: AuditContext = {
      request_id: req.headers['x-request-id'] as string || this.generateRequestId(),
      user_id: (req as any).user?.id || (req as any).user?.scc_id,
      team_id: (req as any).team?.id,
      ip: req.ip || req.socket.remoteAddress || (req.headers['x-forwarded-for'] as string)
    };
    
    if (req.headers['user-agent']) {
      context.user_agent = req.headers['user-agent'];
    }
    
    return context;
  }

  private async outputLog(entry: any): Promise<void> {
    try {
      // Send to S3 via Firehose
      await audit(entry);
    } catch (error) {
      // Fallback to console in case S3 fails
      console.error('[AUDIT ERROR]', error);
      console.log('[AUDIT FALLBACK]', JSON.stringify(entry));
    }
  }

  private buildEntry(
    level: LogLevel,
    event_type: EventType,
    action: ActionType,
    message: string,
    context?: Partial<AuditContext>,
    resource?: string,
    status_code?: number,
    meta?: Record<string, any>
  ): any {
    const entry: any = {
      service: this.service,
      env: this.env,
      level,
      event_type,
      action,
      message
    };

    if (context?.request_id !== undefined) entry.request_id = context.request_id;
    if (context?.user_id !== undefined) entry.user_id = context.user_id;
    if (context?.team_id !== undefined) entry.team_id = context.team_id;
    if (resource !== undefined) entry.resource = resource;
    if (status_code !== undefined) entry.status_code = status_code;
    if (context?.ip !== undefined) entry.ip = context.ip;
    if (context?.user_agent !== undefined) entry.user_agent = context.user_agent;
    if (meta !== undefined) entry.meta = meta;

    return entry;
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

    const entry = this.buildEntry(level, event_type, action, message, context, resource, status_code, meta);
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

    const entry = this.buildEntry(level, event_type, action, message, context, resource, status_code, meta);
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

    const entry = this.buildEntry(level, type, action, message, context, resource, status_code, meta);
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

    const entry = this.buildEntry('INFO', event_type, action, message, context, resource, status_code, meta);
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
    const entry = this.buildEntry('INFO', 'ADMIN_ACTION', action, message, context, resource, status_code, meta);
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

    const entry = this.buildEntry(level, event_type, action, message, context, undefined, success ? 200 : 500, finalMeta);
    await this.outputLog(entry);
  }

  async logSecurity(
    action: 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY',
    context: Partial<AuditContext>,
    resource: string,
    message: string,
    meta?: Record<string, any>
  ): Promise<void> {
    const entry = this.buildEntry('WARN', 'SECURITY_EVENT', action, message, context, resource, 403, meta);
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

    const entry = this.buildEntry('ERROR', 'SYSTEM_ERROR', 'VIEW_DATA', error.message, context, resource, 500, finalMeta);
    await this.outputLog(entry);
  }
}

export const auditService = new AuditService();
export default auditService;