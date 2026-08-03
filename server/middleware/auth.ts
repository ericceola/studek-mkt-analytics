import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config.js';

export type AuthRequest = Request & { user?: { id: number; email: string; role: string } };
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Autenticação necessária.' });
  try { req.user = jwt.verify(token, env.JWT_SECRET) as AuthRequest['user']; next(); }
  catch { res.status(401).json({ message: 'Sessão inválida ou expirada.' }); }
}
