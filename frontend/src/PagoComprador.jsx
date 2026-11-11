
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
  const [comprobante, setComprobante] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');

  const archivoInput = useRef(null);

  useEffect(() => {
    const actualizar = () => {
      setTarjetas(obtenerTarjetas(usuarioId));
    };

    actualizar();

    window.addEventListener(
      'campy-tarjetas-actualizadas',
      actualizar
    );

    return () => {
      window.removeEventListener(
        'campy-tarjetas-actualizadas',
        actualizar
      );
    };
  }, [usuarioId]);

  useEffect(() => {
    setMetodo('');
    setTarjetaSeleccionada('');
    setComprobante(null);
    setAgregando(false);
    setMensaje('');
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
          <div className="grid grid-cols-2 gap-2">

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

          </div>

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
                  alGuardar={t => {
                    setTarjetas(obtenerTarjetas(usuarioId));
                    setTarjetaSeleccionada(t.id);
                    setAgregando(false);
                    setMensaje('Tarjeta agregada correctamente.');
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

              <button
                type="button"
                disabled={!tarjetaSeleccionada}
                onClick={() =>
                  setMensaje(
                    'Operación de prueba completada. No se realizó ningún cargo bancario ni se actualizó el pago en Supabase.'
                  )
                }
                className="w-full rounded-xl bg-[#FF8C00] text-white font-bold py-3 disabled:opacity-40"
              >
                Pagar {dinero(total)}
              </button>

            </div>
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
