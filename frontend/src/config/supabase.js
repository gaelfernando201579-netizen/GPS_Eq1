import { createClient } from '@supabase/supabase-js';

// Intentamos leer las variables de entorno reales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si NO existen (estás probando en localhost sin el .env), usamos unas falsas para que Vite no se rompa
const finalUrl = supabaseUrl || 'https://tu-proyecto-desarrollo.supabase.co';
const finalKey = supabaseAnonKey || 'clave-falsa-de-desarrollo-solo-para-renderizar-la-ui';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en frontend. Usando claves de respaldo para desarrollo.');
}

// Inicializamos el cliente. En producción usará las reales, en tu PC usará las falsas.
export const supabase = createClient(finalUrl, finalKey);