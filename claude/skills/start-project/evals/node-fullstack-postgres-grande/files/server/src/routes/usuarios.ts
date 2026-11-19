import { Router } from 'express';
import { pool } from '../db';
import { exigirLogin } from '../middleware/auth';
export const usuarios = Router();
usuarios.get('/:id', exigirLogin, async (req, res) => {
  const r = await pool.query('SELECT id, nome, email FROM usuarios WHERE id = $1', [req.params.id]);
  res.json(r.rows[0]);
});
