import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conexión e inicialización de la Base de Datos
initDB();

// Endpoints API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/pedidos', orderRoutes);
app.use('/api/usuarios', userRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Servidor API de Campy App corriendo correctamente');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});