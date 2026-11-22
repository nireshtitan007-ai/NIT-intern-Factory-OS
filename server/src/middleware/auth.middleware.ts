import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required in production mode.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'zenlyft_dev_secret_key_change_in_production_2026';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tenantId?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  owner: ['*'],
  salesman: [
    'customers:read',
    'products:read',
    'orders:read',
    'orders:create',
    'invoices:read',
    'invoices:pdf',
    'payments:create'
  ],
  sales_manager: [
    'customers:read',
    'products:read',
    'orders:read',
    'orders:create',
    'orders:approve',
    'invoices:read',
    'invoices:pdf',
    'payments:create',
    'reports:read'
  ],
  production: [
    'products:read',
    'raw_materials:read',
    'boms:read',
    'inventory:read',
    'production:read',
    'production:create',
    'production:costs'
  ],
  inventory: [
    'products:read',
    'raw_materials:read',
    'boms:read',
    'inventory:read',
    'purchases:read',
    'purchases:create',
    'orders:read',
    'orders:dispatch'
  ],
  purchase: [
    'products:read',
    'raw_materials:read',
    'boms:read',
    'inventory:read',
    'purchases:read',
    'purchases:create'
  ],
  accountant: [
    'customers:read',
    'products:read',
    'raw_materials:read',
    'inventory:read',
    'purchases:read',
    'orders:read',
    'orders:approve',
    'orders:reject',
    'orders:dispatch',
    'invoices:read',
    'invoices:pdf',
    'payments:read',
    'payments:create',
    'reports:read'
  ],
  auditor: [
    '*:read'
  ]
};

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
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required. No Bearer token or token query param provided.' 
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; tenantId: string; role: string };

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

    // Strict Auditor check: Auditor cannot mutate any data
    if (user.role === 'auditor') {
      const method = req.method.toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        res.status(403).json({
          success: false,
          error: 'Access denied: Auditor role is strictly read-only and cannot perform data mutations.'
        });
        return;
      }
    }

    req.user = user;
    req.tenantId = user.tenantId;
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

    const userRole = req.user.role;

    // Admins and Owners have universal access
    if (userRole === 'admin' || userRole === 'owner') {
      next();
      return;
    }

    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    const userPerms = req.user.permissions || [];
    const allPerms = [...rolePerms, ...userPerms];

    // Check wildcard match
    if (allPerms.includes('*')) {
      next();
      return;
    }

    // Read wildcard check (e.g., auditor with *:read)
    if (permission.endsWith(':read') && allPerms.includes('*:read')) {
      next();
      return;
    }

    if (!allPerms.includes(permission)) {
      res.status(403).json({ 
        success: false, 
        error: `Access denied. Missing required permission '${permission}' for role '${userRole}'.` 
      });
      return;
    }

    next();
  };
};

export const requireNonProduction = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_BENCHMARK_SEED !== 'true') {
    res.status(403).json({
      success: false,
      error: 'Benchmark resetting and seeding is disabled in production environment.'
    });
    return;
  }
  next();
};
