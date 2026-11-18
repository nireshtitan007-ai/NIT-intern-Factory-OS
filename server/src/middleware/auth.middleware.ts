import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'zenlyft_production_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username, 
      role: user.role, 
      tenantId: user.tenantId 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const authenticate = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required. No Bearer token provided.' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; tenantId: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, error: 'User account not found.' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ success: false, error: 'User account has been deactivated by administrator.' });
      return;
    }

    if (user.isLocked) {
      res.status(403).json({ success: false, error: 'Account is locked due to security policy. Contact administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }
};

export const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        error: `Access denied. Role '${req.user.role}' is not authorized for this action. Required: [${roles.join(', ')}]` 
      });
      return;
    }

    next();
  };
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    res.status(403).json({ 
      success: false, 
      error: 'Access denied: Admin Control Centre is restricted to authorized Administrators only.' 
    });
    return;
  }

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    // Admins and Owners have universal permissions
    if (req.user.role === 'admin' || req.user.role === 'owner') {
      next();
      return;
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      res.status(403).json({ 
        success: false, 
        error: `Access denied. Missing required permission '${permission}'.` 
      });
      return;
    }

    next();
  };
};

