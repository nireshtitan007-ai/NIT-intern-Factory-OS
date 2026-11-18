import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * Standard Employee User Login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ success: false, error: 'Username and password are required.' });
        return;
      }

      const user = await User.findOne({ username: username.toLowerCase().trim() });
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid username or password.' });
        return;
      }

      if (!user.active) {
        res.status(403).json({ success: false, error: 'Account has been deactivated. Contact Administrator.' });
        return;
      }

      if (user.isLocked) {
        res.status(403).json({ success: false, error: 'Account is locked due to repeated failed logins.' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) {
          user.isLocked = true;
        }
        await user.save();

        await AuditLog.create({
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: user._id.toString(),
          performedBy: user.username,
          role: user.role,
          details: { reason: 'Incorrect password', failedAttempts: user.failedLoginAttempts }
        });

        res.status(401).json({ success: false, error: 'Invalid username or password.' });
        return;
      }

      // Success: Reset failed attempts, update stats
      user.failedLoginAttempts = 0;
      user.loginCount += 1;
      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(user);

      await AuditLog.create({
        action: 'LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user._id.toString(),
        performedBy: user.username,
        role: user.role,
        details: { loginCount: user.loginCount, ip: req.ip }
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department,
          branch: user.branch,
          permissions: user.permissions
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Dedicated Admin Login (Strictly verifies Admin/Owner role)
   */
  static async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ success: false, error: 'Admin username and password are required.' });
        return;
      }

      const user = await User.findOne({ username: username.toLowerCase().trim() });
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        return;
      }

      if (user.role !== 'admin' && user.role !== 'owner') {
        res.status(403).json({ 
          success: false, 
          error: `Access Denied: Account '${user.username}' has role '${user.role}' and is not authorized to access the Admin Control Centre. Please use the Employee User Login.` 
        });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        return;
      }

      user.loginCount += 1;
      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(user);

      await AuditLog.create({
        action: 'ADMIN_LOGIN_SUCCESS',
        entityType: 'User',
        entityId: user._id.toString(),
        performedBy: user.username,
        role: user.role,
        details: { type: 'ADMIN_CONTROL_CENTRE_ACCESS' }
      });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department,
          branch: user.branch,
          permissions: user.permissions
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Return profile of authenticated user
   */
  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department,
        branch: req.user.branch,
        permissions: req.user.permissions
      }
    });
  }

  /**
   * Admin: List all registered company users
   */
  static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin: Create new user account with role & permissions
   */
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, password, name, role, department, branch, phone, permissions } = req.body;
      if (!username || !password || !name || !role) {
        res.status(400).json({ success: false, error: 'Username, password, name and role are required.' });
        return;
      }

      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) {
        res.status(400).json({ success: false, error: `Username '${username}' is already taken.` });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new User({
        username: username.toLowerCase().trim(),
        passwordHash,
        name,
        role,
        department: department || 'Operations',
        branch: branch || 'Main Plant - Tiruchirappalli',
        phone,
        permissions: permissions || [],
        active: true
      });

      await newUser.save();

      await AuditLog.create({
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newUser._id.toString(),
        performedBy: req.user?.username || 'ADMIN',
        role: req.user?.role || 'admin',
        details: { username: newUser.username, role: newUser.role, department: newUser.department }
      });

      res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          department: newUser.department,
          branch: newUser.branch,
          permissions: newUser.permissions
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin: Activate/Deactivate user account
   */
  static async toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body;

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      user.active = active;
      if (active) user.isLocked = false;
      await user.save();

      await AuditLog.create({
        action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: user._id.toString(),
        performedBy: req.user?.username || 'ADMIN',
        role: req.user?.role || 'admin',
        details: { username: user.username, newActiveState: active }
      });

      res.json({ success: true, message: `User ${user.username} is now ${active ? 'Active' : 'Deactivated'}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Admin: Reset password
   */
  static async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      await user.save();

      await AuditLog.create({
        action: 'PASSWORD_RESET',
        entityType: 'User',
        entityId: user._id.toString(),
        performedBy: req.user?.username || 'ADMIN',
        role: req.user?.role || 'admin',
        details: { username: user.username }
      });

      res.json({ success: true, message: `Password reset successfully for ${user.username}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

