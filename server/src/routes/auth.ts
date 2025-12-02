import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(registerSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validate(loginSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await AuthService.getUserById(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
router.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, avatarUrl } = req.body;
    const user = await AuthService.updateProfile(req.user!.userId, {
      firstName,
      lastName,
      avatarUrl,
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated',
    });
  })
);

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    await AuthService.changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

export default router;
