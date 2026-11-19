import express from 'express';
import { usuarios } from './routes/usuarios';
import { webhookPagamento } from './routes/webhookPagamento';
const app = express();
app.use(express.json());
app.use('/usuarios', usuarios);
app.post('/webhook/pagamento', webhookPagamento);
app.listen(3000);
