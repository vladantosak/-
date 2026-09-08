import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';
let resolvedJwtSecret = process.env.JWT_SECRET;

if (!resolvedJwtSecret) {
  if (isProduction) {
    console.error(
      'CRITICAL SECURITY ERROR: process.env.JWT_SECRET is not defined in production environment! Aborting startup.'
    );
    throw new Error(
      'JWT_SECRET must be explicitly provided in production mode. Refusing to start with insecure fallback.'
    );
  } else {
    resolvedJwtSecret = 'pmr_dev_secret_insecure_development_only_2026';
    console.warn(
      '[SECURITY WARNING] JWT_SECRET is not set in environment. Using insecure development default. NEVER deploy this to production!'
    );
  }
}

const JWT_SECRET: string = resolvedJwtSecret;

export interface AuthUser {
  id: string;
  phone: string;
  role: 'user' | 'master' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (err) {
    return null;
  }
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация (отсутствует Bearer токен)' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Недействительный или истекший сессионный токен' });
  }

  req.user = user;
  next();
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права Администратора ПМР.' });
    }
    next();
  });
};
