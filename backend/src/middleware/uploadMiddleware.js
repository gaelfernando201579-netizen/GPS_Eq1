import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
export const cargarComprobante=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(_req,file,cb)=>{
 cb(null,/\.(jpe?g|png|webp)$/i.test(file.originalname)&&['image/jpeg','image/png','image/webp'].includes(file.mimetype));
}}).single('comprobante');
export async function validarImagen(file) {
 if(!file)throw Object.assign(new Error('Selecciona una imagen JPG, PNG o WEBP de máximo 5 MB.'),{status:400});
 const tipo=await fileTypeFromBuffer(file.buffer);
 if(!tipo||!['image/jpeg','image/png','image/webp'].includes(tipo.mime)||file.mimetype!==tipo.mime)throw Object.assign(new Error('Formato real de imagen no permitido.'),{status:400});
 try { const info=await sharp(file.buffer,{limitInputPixels:25000000}).metadata();if(!info.width||!info.height||info.pages>1)throw new Error('Dimensiones inválidas');
  const limpio=await sharp(file.buffer,{limitInputPixels:25000000}).rotate().toBuffer();return {buffer:limpio,mime:tipo.mime};
 }catch{throw Object.assign(new Error('Imagen corrupta o inválida.'),{status:400});}
}
