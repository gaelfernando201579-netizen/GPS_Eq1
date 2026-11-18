
import { useEffect, useRef, useState } from 'react';
import FormularioTarjetaDemo from './FormularioTarjetaDemo.jsx';
import { obtenerTarjetas } from './tarjetasDemo.js';

const BANCO = {
  banco: 'Banco CAMPY (pruebas)',
  titular: 'CAMPY CAMPUS DELIVERY',
  clabe: '000000000000000000'
};

const dinero = monto =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(Number(monto) || 0);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function consultarMetodoPago(pedidoId, metodo = 'GET', datos = null) {
  const token = localStorage.getItem('campy_token');
  if (!token) throw new Error('Inicia sesión para gestionar el pago.');

  const respuesta = await fetch(`${API_URL}/api/pedidos/${pedidoId}/metodo-pago`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(datos ? { 'Content-Type': 'application/json' } : {})
    },
    ...(datos ? { body: JSON.stringify(datos) } : {})
  });
  const contenido = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(contenido.mensaje || 'No se pudo consultar el método de pago.');
  return contenido;
}

export default function PagoComprador({
  pedidoId,
  total,
  cancelado = false,
  usuarioId
}) {
  const [metodo, setMetodo] = useState('');
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [guardandoMetodo, setGuardandoMetodo] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');

  const archivoInput = useRef(null);

  useEffect(() => {
    let vigente = true;
    const actualizar = async () => {
      try {
        const lista = await obtenerTarjetas(usuarioId);
        if (!vigente) return;
        setTarjetas(lista);
        setTarjetaSeleccionada(anterior =>
          lista.some(t => t.id === anterior)
            ? anterior
            : (lista.find(t => t.predeterminada)?.id || '')
        );
      } catch (error) {
        if (vigente) setMensaje(error.message);
      }
    };

    actualizar();
    window.addEventListener('campy-tarjetas-actualizadas', actualizar);
    return () => {
      vigente = false;
      window.removeEventListener('campy-tarjetas-actualizadas', actualizar);
    };
  }, [usuarioId]);

  useEffect(() => {
    let vigente = true;
    setMetodo('');
    setComprobante(null);
    setAgregando(false);
    setMensaje('');

    const cargarSeleccion = async () => {
      try {
        const guardado = await consultarMetodoPago(pedidoId);
        if (!vigente) return;
        setMetodo((guardado.metodo || '').toLowerCase());
        if (guardado.idTarjeta) setTarjetaSeleccionada(guardado.idTarjeta);
      } catch (error) {
        if (vigente) setMensaje(error.message);
      }
    };
    if (pedidoId) cargarSeleccion();
    return () => { vigente = false; };
  }, [pedidoId]);

  useEffect(() => {
    if (!comprobante) {
      setVistaPrevia('');
      return;
    }

    const url = URL.createObjectURL(comprobante);
    setVistaPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [comprobante]);

  const guardarMetodoPago = async () => {
    if (metodo === 'tarjeta' && !tarjetaSeleccionada) {
      setMensaje('Selecciona una tarjeta de prueba antes de guardar.');
      return;
    }

    setGuardandoMetodo(true);
    setMensaje('');
    try {
      const guardado = await consultarMetodoPago(pedidoId, 'PUT', {
        metodo,
        idTarjeta: metodo === 'tarjeta' ? tarjetaSeleccionada : null
      });
      setMensaje(guardado.mensaje);
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setGuardandoMetodo(false);
    }
  };

  const seleccionarArchivo = e => {
    const file = e.target.files?.[0];
    setMensaje('');

    if (!file) return;

    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMensaje(
        'Selecciona un comprobante JPG, PNG o WEBP de máximo 5 MB.'
      );

      setComprobante(null);
      e.target.value = '';
      return;
    }

    setComprobante(file);
  };

  return (
    <section className="mt-3 mb-3 rounded-2xl border border-blue-200 bg-[#F4F7FD] p-3 text-sm text-gray-800">

      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <h3 className="font-black text-[#0A3895]">
            Método de pago
          </h3>

          <p className="text-xs text-gray-500">
            Pedido #{pedidoId}
          </p>
        </div>

        <strong className="text-[#FF8C00]">
          {dinero(total)}
        </strong>
      </div>

      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
        Entorno de pruebas: no ingreses datos bancarios reales
        ni transfieras dinero.
      </p>

      {cancelado ? (
        <p className="text-red-700">
          Este pedido fue cancelado.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">

            <button
              type="button"
              aria-pressed={metodo === 'transferencia'}
              onClick={() => {
                setMetodo('transferencia');
                setMensaje('');
              }}
              className={`rounded-xl border-2 p-3 text-xs font-bold ${
                metodo === 'transferencia'
                  ? 'border-[#0A3895] bg-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              Transferencia
            </button>

            <button
              type="button"
              aria-pressed={metodo === 'tarjeta'}
              onClick={() => {
                setMetodo('tarjeta');
                setMensaje('');
              }}
              className={`rounded-xl border-2 p-3 text-xs font-bold ${
                metodo === 'tarjeta'
                  ? 'border-[#0A3895] bg-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              Tarjeta
            </button>

<button
  type="button"
  aria-pressed={metodo === 'efectivo'}
  onClick={() => {
    setMetodo('efectivo');
    setMensaje('');
  }}
  className={`rounded-xl border-2 p-3 text-xs font-bold ${
    metodo === 'efectivo'
      ? 'border-[#0A3895] bg-white'
      : 'border-gray-200 bg-white'
  }`}
>
  Efectivo
</button>


          </div>

{metodo === 'efectivo' && (
  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
    <h4 className="font-bold text-green-700 mb-2">
      Pago en efectivo
    </h4>

    <p className="text-xs text-gray-700">
      Pagarás ${Number(total).toFixed(2)} MXN en efectivo
      cuando recibas tu pedido.
    </p>

    <p className="text-xs text-gray-500 mt-2">
      No necesitas registrar una tarjeta ni subir
      un comprobante de transferencia.
    </p>

    <p className="text-xs font-bold text-green-700 mt-3">
      Método de pago seleccionado: Efectivo
    </p>
  </div>
)}


          {metodo === 'transferencia' && (
            
            <div className="mt-3 bg-white rounded-xl p-3 space-y-2 text-xs">

              <h4 className="font-bold text-[#0A3895]">
                Datos para transferencia
              </h4>

              <p>
                Banco: <strong>{BANCO.banco}</strong>
              </p>

              <p>
                Titular: <strong>{BANCO.titular}</strong>
              </p>

              <p>
                CLABE: <strong>{BANCO.clabe}</strong>
                <button type="button" className="ml-2 rounded-lg bg-blue-100 text-blue-800 px-2 py-1 text-[10px] font-bold"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(BANCO.clabe); setMensaje('Número de transferencia copiado.'); }
                    catch { setMensaje('Selecciona el número para copiarlo.'); }
                  }}>Copiar</button>
              </p>

              <p>
                Monto: <strong>{dinero(total)}</strong>
              </p>

              <p>
                Concepto: <strong>CAMPY-{pedidoId}</strong>
              </p>

              <p className="text-amber-800">
                Cuenta ficticia: no realices transferencias.
              </p>

              <input
                ref={archivoInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={seleccionarArchivo}
                className="hidden"
                aria-label="Seleccionar comprobante"
              />

              <button
                type="button"
                onClick={() => archivoInput.current?.click()}
                className="w-full rounded-xl bg-[#0A3895] text-white font-bold py-3"
              >
                Subir comprobante de pago
              </button>

              {comprobante && (
                <div className="space-y-2">
                  <p className="break-all">
                    {comprobante.name}
                  </p>

                  {vistaPrevia && (
                    <img
                      src={vistaPrevia}
                      alt="Vista previa del comprobante"
                      className="max-h-44 w-full object-contain"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setMensaje(
                        'Comprobante preparado para revisión. El envío al servidor todavía no está habilitado.'
                      )
                    }
                    className="w-full rounded-xl bg-[#FF8C00] text-white font-bold py-3"
                  >
                    Continuar con comprobante
                  </button>
                </div>
              )}

            </div>
          )}

          {metodo === 'tarjeta' && (
            <div className="mt-3 space-y-3">

              <p className="font-bold text-[#0A3895]">
                Selecciona una tarjeta
              </p>

              {tarjetas.length ? (
                tarjetas.map(t => (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2 border rounded-xl bg-white p-3 ${
                      tarjetaSeleccionada === t.id
                        ? 'border-[#FF8C00]'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`tarjeta_${pedidoId}`}
                      checked={tarjetaSeleccionada === t.id}
                      onChange={() =>
                        setTarjetaSeleccionada(t.id)
                      }
                    />

                    <span className="text-xs">
                      {t.marca} •••• {t.ultimos4}

                      <span className="block text-gray-500">
                        {t.titular} · {t.vencimiento}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-gray-500">
                  Todavía no tienes tarjetas de prueba agregadas.
                </p>
              )}

              {agregando ? (
                <FormularioTarjetaDemo
                  usuarioId={usuarioId}
                  alCancelar={() => setAgregando(false)}
                  alGuardar={async t => {
                    const lista = await obtenerTarjetas(usuarioId);
                    setTarjetas(lista);
                    setTarjetaSeleccionada(t.id);
                    setAgregando(false);
                    setMensaje('Tarjeta de prueba guardada correctamente.');
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAgregando(true)}
                  className="w-full rounded-xl border-2 border-dashed bg-white p-3 text-[#0A3895] font-bold text-xs"
                >
                  + Agregar nueva tarjeta
                </button>
              )}

              <p className="text-xs text-gray-500">
                La tarjeta de prueba solo identifica el método elegido.
                No se ejecuta ningún cargo bancario.
              </p>

            </div>
          )}

          {metodo && (
            <button
              type="button"
              disabled={guardandoMetodo || (metodo === 'tarjeta' && !tarjetaSeleccionada)}
              onClick={guardarMetodoPago}
              className="mt-3 w-full rounded-xl bg-[#FF8C00] text-white font-bold py-3 disabled:opacity-50"
            >
              {guardandoMetodo ? 'Guardando método de pago...' : 'Guardar método de pago'}
            </button>
          )}

          {mensaje && (
            <p
              role="status"
              className="mt-3 p-2 rounded-lg bg-blue-50 text-xs text-[#0A3895]"
            >
              {mensaje}
            </p>
          )}

        </>
      )}
    </section>
  );
}
