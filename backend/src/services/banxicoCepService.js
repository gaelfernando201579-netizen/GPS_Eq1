// No hay API automatizada de Banxico asumida. La consulta manual está en https://www.banxico.org.mx/cep/
export async function verificarCep() {
 return { disponible:false, confirmado:false, estado:'Pendiente_confirmacion_bancaria',
  mensaje:'Sin integración bancaria autorizada. Revise el CEP y confirme la acreditación con evidencia bancaria por un medio externo.' };
}
