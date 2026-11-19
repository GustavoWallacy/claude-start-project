import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
export function exigirLogin(req: Request, res: Response, next: NextFunction) {
  try { jwt.verify(String(req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET!); next(); }
  catch { res.sendStatus(401); }
}
