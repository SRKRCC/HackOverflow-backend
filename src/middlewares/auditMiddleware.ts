import type { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService.js';

export const auditRequestId = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = auditService.generateRequestId();
  }
  next();
};

export const auditAuth = (type: 'user' | 'team' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json;
    const context = auditService.extractContext(req);
    
    res.json = function(this: Response, body: any) {
      const success = body.success === true;
      const action = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
      
      if (type === 'team') {
        auditService.logTeamAuth(
          action,
          { ...context, team_id: body.teamId || body.team?.id },
          req.path,
          res.statusCode,
          { login_method: 'credentials' }
        ).catch(console.error);
      } else {
        auditService.logAuth(
          action,
          { ...context, user_id: body.userId || body.user?.id },
          req.path,
          res.statusCode,
          { login_method: 'credentials', user_type: type }
        ).catch(console.error);
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};


export const auditRegistration = (type: 'user' | 'team') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json;
    const context = auditService.extractContext(req);
    
    res.json = function(this: Response, body: any) {
      const success = body.success === true;
      const action = success ? 'REGISTER_SUCCESS' : 'REGISTER_FAILED';
      const event_type = type === 'team' ? 'TEAM_REGISTRATION' : 'USER_REGISTRATION';
      
      auditService.logRegistration(
        action,
        event_type,
        { 
          ...context, 
          user_id: body.userId || body.user?.id,
          team_id: body.teamId || body.team?.id 
        },
        req.path,
        res.statusCode,
        {
          team_name: req.body.teamName,
          member_count: req.body.members?.length,
          problem_statement: req.body.problemStatement?.psId
        }
      ).catch(console.error);
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};


export const auditTaskSubmission = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;
  const context = auditService.extractContext(req);
  
  res.json = function(this: Response, body: any) {
    const success = body.success === true;
    
    if (success) {
      auditService.logTask(
        'SUBMIT_TASK',
        context,
        `${req.path}`,
        res.statusCode,
        {
          task_id: req.params.id,
          submission_type: req.body.type || 'unknown'
        }
      ).catch(console.error);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};


export const auditAdminAction = (action: string, description: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = auditService.extractContext(req);
    
    auditService.logAdmin(
      'MODIFY_DATA' as any,
      context,
      req.path,
      res.statusCode || 200,
      `Admin ${description}: ${action}`,
      {
        action,
        target_id: req.params.id,
        request_body: req.body
      }
    ).catch(console.error);
    
    next();
  };
};


export const auditErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const context = auditService.extractContext(req);
  
  auditService.logError(
    error,
    context,
    req.path,
    {
      method: req.method,
      query: req.query,
      params: req.params
    }
  ).catch(console.error);
  
  next(error);
};