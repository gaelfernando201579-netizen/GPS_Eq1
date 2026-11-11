export async function generarDistribuciones(client,pago) {
 const registros=[['Vendedor',pago.vendedor_id,pago.importe_vendedor],['Campy',null,pago.comision_total]];
 if(pago.repartidor_id&&Number(pago.tarifa_entrega)>0)registros.push(['Repartidor',pago.repartidor_id,pago.tarifa_entrega]);
 for(const [tipo,id,importe] of registros){
  await client.query(`INSERT INTO public.distribuciones_pago(pago_id,destinatario_id,tipo,importe) VALUES($1,$2,$3,$4) ON CONFLICT(pago_id,tipo) DO NOTHING`,[pago.id,id,tipo,importe]);
 }
}
