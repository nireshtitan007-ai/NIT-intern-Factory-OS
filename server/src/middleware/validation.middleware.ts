import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: ' + err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          details: err.errors
        });
        return;
      }
      res.status(400).json({ success: false, error: err.message || 'Invalid request body' });
    }
  };
};
