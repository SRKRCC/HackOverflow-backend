import type { Request, Response, NextFunction } from 'express';

interface ValidationError {
  field: string;
  message: string;
}

const ALLOWED_TEAM_FIELDS = ['title', 'ps_id', 'gallery_images'];
const ALLOWED_MEMBER_FIELDS = [
  'name', 'email', 'phone_number', 'department', 'college_name',
  'year_of_study', 'location', 'tShirtSize', 'attendance'
];

const VALID_TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const filterAllowedFields = (body: any, allowedFields: string[]): any => {
  const filtered: any = {};
  for (const field of allowedFields) {
    if (body.hasOwnProperty(field)) {
      filtered[field] = body[field];
    }
  }
  return filtered;
};

export const validateTeamFields = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (data.hasOwnProperty('title')) {
    if (typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters long' });
    }
  }

  if (data.hasOwnProperty('ps_id')) {
    if (typeof data.ps_id !== 'number' || !Number.isInteger(data.ps_id) || data.ps_id <= 0) {
      errors.push({ field: 'ps_id', message: 'Problem statement ID must be a positive integer' });
    }
  }

  if (data.hasOwnProperty('paymentVerified')) {
    if (typeof data.paymentVerified !== 'boolean') {
      errors.push({ field: 'paymentVerified', message: 'Payment verified must be a boolean' });
    }
  }

  if (data.hasOwnProperty('gallery_images')) {
    if (!Array.isArray(data.gallery_images)) {
      errors.push({ field: 'gallery_images', message: 'Gallery images must be an array' });
    } else {
      for (let i = 0; i < data.gallery_images.length; i++) {
        if (typeof data.gallery_images[i] !== 'string') {
          errors.push({ field: 'gallery_images', message: `Gallery image at index ${i} must be a string` });
          break;
        }
      }
    }
  }

  return errors;
};

export const validateMemberFields = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;

  if (data.hasOwnProperty('name')) {
    if (typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    }
  }

  if (data.hasOwnProperty('email')) {
    if (typeof data.email !== 'string' || !emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Valid email address is required' });
    }
  }

  if (data.hasOwnProperty('phone_number')) {
    if (typeof data.phone_number !== 'string' || !phoneRegex.test(data.phone_number)) {
      errors.push({ field: 'phone_number', message: 'Valid phone number is required (10 digits starting with 6-9, optionally with +91)' });
    }
  }

  if (data.hasOwnProperty('department')) {
    if (typeof data.department !== 'string' || data.department.trim().length === 0) {
      errors.push({ field: 'department', message: 'Department is required' });
    }
  }

  if (data.hasOwnProperty('college_name')) {
    if (typeof data.college_name !== 'string' || data.college_name.trim().length < 3) {
      errors.push({ field: 'college_name', message: 'College name must be at least 3 characters long' });
    }
  }

  if (data.hasOwnProperty('year_of_study')) {
    if (typeof data.year_of_study !== 'number' || !Number.isInteger(data.year_of_study) || data.year_of_study < 1 || data.year_of_study > 4) {
      errors.push({ field: 'year_of_study', message: 'Year of study must be between 1-4' });
    }
  }

  if (data.hasOwnProperty('location')) {
    if (typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push({ field: 'location', message: 'Location is required' });
    }
  }

  if (data.hasOwnProperty('tShirtSize')) {
    if (typeof data.tShirtSize !== 'string' || !VALID_TSHIRT_SIZES.includes(data.tShirtSize)) {
      errors.push({ field: 'tShirtSize', message: 'T-shirt size must be one of: XS, S, M, L, XL, XXL' });
    }
  }

  if (data.hasOwnProperty('attendance')) {
    if (typeof data.attendance !== 'number' || !Number.isInteger(data.attendance) || data.attendance < 0) {
      errors.push({ field: 'attendance', message: 'Attendance must be a non-negative integer' });
    }
  }

  return errors;
};

export const validateTeamPatchRequest = (req: Request, res: Response, next: NextFunction): void => {
  const filteredData = filterAllowedFields(req.body, ALLOWED_TEAM_FIELDS);
  
  if (Object.keys(filteredData).length === 0) {
    res.status(400).json({
      success: false,
      message: 'No valid fields provided for update'
    });
    return;
  }

  const errors = validateTeamFields(filteredData);
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  req.body = filteredData;
  next();
};

export const validateMemberPatchRequest = (req: Request, res: Response, next: NextFunction): void => {
  const filteredData = filterAllowedFields(req.body, ALLOWED_MEMBER_FIELDS);
  
  if (Object.keys(filteredData).length === 0) {
    res.status(400).json({
      success: false,
      message: 'No valid fields provided for update'
    });
    return;
  }

  const errors = validateMemberFields(filteredData);
  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
  }

  req.body = filteredData;
  next();
};