
const clave = (usuarioId) =>
  `campy_tarjetas_prueba_${String(usuarioId || 'sin_cuenta')}`;

export function obtenerTarjetas(usuarioId) {
  if (!usuarioId) return [];

  try {
    const datos = JSON.parse(
      localStorage.getItem(clave(usuarioId)) || '[]'
    );

    return Array.isArray(datos)
      ? datos.filter(t => t && t.id && t.ultimos4)
      : [];
  } catch {
    return [];
  }
}

export function guardarTarjeta(usuarioId, datos) {
  if (!usuarioId) {
    throw new Error('Inicia sesión para agregar una tarjeta.');
  }

  const numero = String(datos.numero || '').replace(/\D/g, '');
  const vencimiento = String(datos.vencimiento || '');
  const titular = String(datos.titular || '').trim();

  if (
    numero !== '4242424242424242' ||
    vencimiento !== '12/30' ||
    String(datos.cvv) !== '123'
  ) {
    throw new Error(
      'Utiliza la tarjeta de prueba 4242 4242 4242 4242, 12/30 y 123.'
    );
  }

  if (!titular) {
    throw new Error('Escribe el nombre del titular.');
  }

  const tarjeta = {
    id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    titular: titular.slice(0, 80),
    vencimiento,
    ultimos4: numero.slice(-4),
    marca: 'Visa (prueba)'
  };

  const tarjetas = [
    ...obtenerTarjetas(usuarioId),
    tarjeta
  ];

  localStorage.setItem(
    clave(usuarioId),
    JSON.stringify(tarjetas)
  );

  window.dispatchEvent(
    new CustomEvent('campy-tarjetas-actualizadas')
  );

  return tarjeta;
}

export function eliminarTarjeta(usuarioId, id) {
  const tarjetas = obtenerTarjetas(usuarioId).filter(
    t => t.id !== id
  );

  localStorage.setItem(
    clave(usuarioId),
    JSON.stringify(tarjetas)
  );

  window.dispatchEvent(
    new CustomEvent('campy-tarjetas-actualizadas')
  );
}
