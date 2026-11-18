import { randomUUID } from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { pool } from '../config/db.js';
import { validarImagen } from '../middleware/uploadMiddleware.js';

export const cargarFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req,file,cb) => cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype))
}).single('foto');

export async function subirFotoProducto(req,res) {
  const usuario=Number(req.usuario?.id);
  try {
    const rol=await pool.query(`SELECT 1 FROM public.usuario_roles ur JOIN public.roles r ON r.id_rol=ur.id_rol
      WHERE ur.id_usuario=$1 AND LOWER(TRIM(r.nombre))='vendedor'`,[usuario]);
    if(!rol.rowCount)return res.status(403).json({mensaje:'Solo vendedores autorizados pueden subir fotografías.'});
    const urlBase=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
    const clave=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!urlBase||!clave)return res.status(503).json({mensaje:'Falta configurar Storage en el backend.'});
    const imagen=await validarImagen(req.file);
    const webp=await sharp(imagen.buffer).resize({width:1200,withoutEnlargement:true}).webp({quality:82}).toBuffer();
    const ruta=`fotos/${usuario}/${randomUUID()}.webp`;
    const r=await fetch(`${urlBase}/storage/v1/object/products/${ruta}`,{
      method:'POST',headers:{Authorization:`Bearer ${clave}`,apikey:clave,'Content-Type':'image/webp','x-upsert':'false'},
      body:webp
    });
    if(!r.ok){const fallo=await r.text();console.error('Storage:',r.status,fallo);return res.status(502).json({mensaje:'No se pudo guardar la foto en Storage. Revisa que exista el bucket products.'});}
    res.status(201).json({imagen_url:`${urlBase}/storage/v1/object/public/products/${ruta}`});
  }catch(e){console.error('Subiendo foto de producto:',e);res.status(e.status||400).json({mensaje:e.message||'No se pudo subir la foto.'});}
}
