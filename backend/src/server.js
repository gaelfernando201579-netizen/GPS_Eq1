import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const puerto = Number(process.env.PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '100kb' }));

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = url && clave && !url.includes('TU-PROYECTO')
  ? createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, servicio: 'Campy API', supabaseConfigurado: Boolean(supabase) });
});

app.get('/api/productos', async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Configura backend/.env' });
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('id_producto,id_vendedor,id_categoria,nombre,descripcion,precio,cantidad_disponible,imagen_url,estado')
      .eq('estado', 'Aprobado')
      .order('id_producto', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error consultando productos:', error.message);
    res.status(500).json({ error: 'No se pudieron consultar los productos. Revisa RLS, columnas y la clave publicable.' });
  }
});

app.get('/api/categorias', async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Configura backend/.env' });
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('id_categoria,nombre')
      .order('id_categoria', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error consultando categorias:', error.message);
    res.status(500).json({ error: 'No se pudieron consultar las categorias. Revisa RLS.' });
  }
});

app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.path}` }));

app.listen(puerto, () => {
  console.log(`Campy API disponible en http://localhost:${puerto}`);
});
