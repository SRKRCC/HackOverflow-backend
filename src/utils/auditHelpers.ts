import { auditService } from '../services/auditService.js';
import type { Request } from 'express';


export const logEmailEvent = async (
  success: boolean,
  recipient: string,
  subject: string,
  context?: any,
  meta?: Record<string, any>
): Promise<void> => {
  await auditService.logEmail(
    'SEND_EMAIL',
    success,
    context || {},
    recipient,
    subject,
    meta
  );
};


export const logTaskDecision = async (
  action: 'APPROVE_TASK' | 'REJECT_TASK',
  req: Request,
  taskId: string,
  meta?: Record<string, any>
): Promise<void> => {
  const context = auditService.extractContext(req);
  
  await auditService.logTask(
    action,
    context,
    `/admin/tasks/${taskId}`,
    200,
    {
      task_id: taskId,
      ...meta
    }
  );
};


export const logPaymentEvent = async (
  teamId: string,
  verified: boolean,
  context?: any,
  meta?: Record<string, any>
): Promise<void> => {
  const action = verified ? 'VERIFY_PAYMENT' : 'VERIFY_PAYMENT';
  const message = `Payment ${verified ? 'verified' : 'verification failed'} for team ${teamId}`;
  
  const entry = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    service: process.env.SERVICE_NAME || 'hackoverflow-backend',
    env: process.env.NODE_ENV || 'development',
    level: verified ? 'INFO' : 'WARN' as any,
    event_type: 'PAYMENT_VERIFICATION' as any,
    action: action as any,
    message,
    team_id: teamId,
    status_code: verified ? 200 : 400,
    ...context,
    meta: meta || {}
  };
  
  console.log('[AUDIT]', JSON.stringify(entry));
};


export const logSecurityEvent = async (
  event: 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY',
  req: Request,
  message: string,
  meta?: Record<string, any>
): Promise<void> => {
  const context = auditService.extractContext(req);
  
  await auditService.logSecurity(
    event,
    context,
    req.path,
    message,
    {
      method: req.method,
      query: req.query,
      ...meta
    }
  );
};


export const logFileEvent = async (
  req: Request,
  filename: string,
  success: boolean,
  meta?: Record<string, any>
): Promise<void> => {
  const context = auditService.extractContext(req);
  
  const entry = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    service: process.env.SERVICE_NAME || 'hackoverflow-backend',
    env: process.env.NODE_ENV || 'development',
    level: success ? 'INFO' : 'ERROR' as any,
    event_type: 'FILE_UPLOAD' as any,
    action: 'UPLOAD_FILE' as any,
    message: `File ${success ? 'uploaded' : 'upload failed'}: ${filename}`,
    resource: req.path,
    status_code: success ? 200 : 500,
    ...context,
    meta: {
      filename,
      ...meta
    }
  };
  
  console.log('[AUDIT]', JSON.stringify(entry));
};

export const createAuditContext = (req: Request, additionalData?: Record<string, any>) => {
  return {
    ...auditService.extractContext(req),
    ...additionalData
  };
};