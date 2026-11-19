import type { Request, Response } from 'express';
import { pool } from '../db';
export async function webhookPagamento(req: Request, res: Response) {
  await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2', ['PAGO', req.body.pedidoId]);
  res.sendStatus(200);
}
