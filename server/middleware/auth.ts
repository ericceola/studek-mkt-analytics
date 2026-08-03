import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import { env } from '../config.js';
import { rows } from '../db.js';

export type AuthUser = { id: number; email: string; role: string; accessProfileId: number|null; permissions: string[] };
export type AuthRequest = Request & { user?: AuthUser };
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Autenticação necessária.' });
  try {
    const claims=jwt.verify(token, env.JWT_SECRET) as {id:number};
    const users=await rows<(RowDataPacket&{id:number;email:string;role:string;access_profile_id:number|null;permissions:string|null})[]>(`SELECT u.id,u.email,u.role,u.access_profile_id,GROUP_CONCAT(app.screen_key) permissions FROM users u LEFT JOIN access_profiles ap ON ap.id=u.access_profile_id AND ap.is_active=1 LEFT JOIN access_profile_permissions app ON app.access_profile_id=ap.id WHERE u.id=? AND u.is_active=1 GROUP BY u.id`,[claims.id]);
    const user=users[0];if(!user)return res.status(401).json({message:'Usuário inativo ou não encontrado.'});
    req.user={id:Number(user.id),email:user.email,role:user.role,accessProfileId:user.access_profile_id?Number(user.access_profile_id):null,permissions:user.role==='admin'?[]:String(user.permissions||'').split(',').filter(Boolean)};next();
  }
  catch { res.status(401).json({ message: 'Sessão inválida ou expirada.' }); }
}
