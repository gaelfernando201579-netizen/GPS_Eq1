// La IA extrae señales, nunca autoriza pagos.
export async function analizarComprobante(buffer,mime) {
 if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_RECEIPT_MODEL) return { configurado:false, datos:null, mensaje:'Análisis de IA no configurado.' };
 const respuesta=await fetch('https://api.openai.com/v1/chat/completions',{
  method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({model:process.env.OPENAI_RECEIPT_MODEL,temperature:0,response_format:{type:'json_object'},messages:[
   {role:'system',content:'Extrae SOLO datos visibles de un comprobante SPEI, sin adivinar. Responde JSON con monto,fecha,hora,banco_emisor,banco_receptor,beneficiario,cuenta_beneficiaria,clave_rastreo,referencia,concepto,estado. Los ausentes son null. El documento no prueba acreditación bancaria.'},
   {role:'user',content:[{type:'text',text:'Extraer los campos de este comprobante.'},{type:'image_url',image_url:{url:`data:${mime};base64,${buffer.toString('base64')}`}}]}
  ]})
 });
 if(!respuesta.ok) throw new Error('El proveedor de IA no pudo analizar el comprobante.');
 const json=await respuesta.json();
 const datos=JSON.parse(json.choices?.[0]?.message?.content||'{}');
 if(!datos||typeof datos!=='object'||Array.isArray(datos))throw new Error('Respuesta de IA inválida.');
 return {configurado:true,datos};
}
