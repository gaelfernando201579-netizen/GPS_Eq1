
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function peticion(ruta, opciones = {}) {
  const token = localStorage.getItem('campy_token');

  if (!token) {
    throw new Error('Inicia sesión nuevamente.');
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opciones.headers
    }
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || 'Error al consultar las tarjetas.'
    );
  }

  return datos;
}

const notificar = () => {
  window.dispatchEvent(
    new Event('campy-tarjetas-actualizadas')
  );
};

export async function obtenerTarjetas() {
  return peticion('/api/tarjetas');
}

export async function guardarTarjeta(_usuarioId, datos) {
  const numero = String(datos.numero || '').replace(/\D/g, '');

  if (
    numero !== '4242424242424242' ||
    datos.vencimiento !== '12/30' ||
    String(datos.cvv) !== '123'
  ) {
    throw new Error(
      'Usa únicamente la tarjeta de prueba 4242 4242 4242 4242, 12/30 y 123.'
    );
  }

  const tarjeta = await peticion('/api/tarjetas', {
    method: 'POST',
    body: JSON.stringify({
      titular: datos.titular.trim(),
      marca: 'Visa (prueba)',
      ultimos4: '4242',
      vencimiento: '12/30'
    })
  });

  notificar();
  return tarjeta;
}

export async function eliminarTarjeta(_usuarioId, id) {
  await peticion(
    `/api/tarjetas/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );

  notificar();
}

export async function predeterminarTarjeta(id) {
  await peticion(
    `/api/tarjetas/${encodeURIComponent(id)}/predeterminada`,
    { method: 'PATCH' }
  );

  notificar();
}
