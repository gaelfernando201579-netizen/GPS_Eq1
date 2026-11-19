
import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ComentarioEntrega({
  pedidoId,
  comentarioInicial = '',
  otros = [],
  onGuardado = () => {},
  permitir = true
}) {
  const [texto, setTexto] = useState(comentarioInicial || '');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('exito');

  const guardar = async () => {
    if (guardando) return;

    setGuardando(true);
    setMensaje('');

    try {
      const token = localStorage.getItem('campy_token');

      if (!token) {
        throw new Error('Inicia sesión para comentar.');
      }

      const r = await fetch(
        `${API_URL}/api/pedidos/${pedidoId}/comentario-entrega`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            comentario: texto.trim()
          })
        }
      );

      const datos = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo guardar el comentario.'
        );
      }

      setTipoMensaje('exito');
      setMensaje('Tu comentario de entrega se guardó correctamente.');

      onGuardado();

    } catch (e) {
      setTipoMensaje('error');
      setMensaje(
        e.message || 'Ocurrió un error al guardar el comentario.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section
      className="rounded-2xl bg-white border border-blue-100 p-4 space-y-3 shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >

      {/* Encabezado */}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0A3895"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>

        <div>
          <h4 className="font-black text-xs text-[#0A3895]">
            Comentarios de la entrega
          </h4>

          <p className="text-[10px] text-gray-500 mt-0.5">
            Indicaciones y mensajes relacionados con el pedido.
          </p>
        </div>
      </div>

      {/* Comentarios de otros usuarios */}

      {otros.filter((o) => o.texto).length > 0 && (
        <div className="space-y-2">
          {otros
            .filter((o) => o.texto)
            .map((o, i) => (
              <div
                key={i}
                className="rounded-xl bg-blue-50/60 border border-blue-100 p-3"
              >
                <div className="flex items-start gap-2">

                  <div className="w-7 h-7 rounded-lg bg-white border border-blue-100 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0A3895"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-[#0A3895]">
                      {o.nombre}
                    </p>

                    <p className="text-xs text-gray-700 leading-relaxed mt-1 break-words">
                      {o.texto}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Formulario de comentario */}

      {permitir && (
        <div className="space-y-2">

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Escribe indicaciones para la entrega..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 outline-none resize-none transition-colors focus:border-[#0A3895] focus:bg-white"
          />

          <div className="flex items-center justify-between gap-2">

            <span className="text-[10px] text-gray-400 font-medium">
              {texto.length}/500 caracteres
            </span>

            <button
              type="button"
              disabled={guardando}
              onClick={guardar}
              className="rounded-xl bg-[#0A3895] hover:bg-[#082c78] text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {guardando ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <path d="M17 21v-8H7v8" />
                    <path d="M7 3v5h8" />
                  </svg>

                  Guardar comentario
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notificaciones CAMPY */}

      {mensaje && (
        <div
          role={tipoMensaje === 'error' ? 'alert' : 'status'}
          className={`campy-comentario-notificacion flex items-start gap-3 rounded-2xl border p-3 shadow-sm animate-[campy-notificacion-entrada_0.3s_ease-out] ${
            tipoMensaje === 'exito'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >

          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              tipoMensaje === 'exito'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {tipoMensaje === 'exito' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m8 12 2.5 2.5L16 9" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`text-xs font-black ${
                tipoMensaje === 'exito'
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}
            >
              {tipoMensaje === 'exito'
                ? 'Comentario guardado'
                : 'No se pudo guardar'}
            </p>

            <p className="text-[11px] text-gray-600 leading-relaxed mt-1">
              {mensaje}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMensaje('')}
            aria-label="Cerrar notificación"
            className="text-gray-400 hover:text-gray-700 text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}
