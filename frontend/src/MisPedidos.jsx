
import React, { useState } from 'react';
import logoCampy from './assets/logo.png';
import PagoComprador from './PagoComprador.jsx';

const ETAPAS = [
  { clave: 'En preparación', etiqueta: 'Preparando', icono: '👨‍🍳' },
  { clave: 'En camino', etiqueta: 'En Camino', icono: '🛵' },
  { clave: 'En el punto de entrega', etiqueta: 'En el Lugar', icono: '📍' },
  { clave: 'Entregado', etiqueta: 'Entregado', icono: '✓' }
];

const MisPedidos = ({
  irAInicio,
  irAPerfil,
  pedidosVendedor = [],
  cargandoPedidos = false,
  errorPedidos = '',
  cambiarEstadoPedido,
  usuarioId
}) => {

  const [errorConfirmacion, setErrorConfirmacion] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);

  // Nuevos estados para el sistema de calificaciones
  const [modalCalificacion, setModalCalificacion] = useState(null);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [calificadosLocal, setCalificadosLocal] = useState({}); // Para ocultar el botón tras calificar

  const confirmarPedidoRecibido = async (id) => {
    setErrorConfirmacion('');
    setConfirmandoId(id);
    try {
      await cambiarEstadoPedido(id, 'Entregado');
    } catch (error) {
      setErrorConfirmacion(error.message || 'No se pudo confirmar la recepción.');
    } finally {
      setConfirmandoId(null);
    }
  };

  const obtenerIndiceEtapa = (estado) => {
    if (estado === 'Pendiente') return -1;
    if (estado === 'En preparación' || estado === 'Aceptado') return 0;
    if (estado === 'En camino') return 1;
    if (estado === 'En el punto de entrega') return 2;
    if (estado === 'Entregado') return 3;
    return 0;
  };

  const enviarCalificacion = async (e) => {
    e.preventDefault();
    setEnviandoCalificacion(true);

    // Aquí tu equipo de backend conectará el endpoint (ej. POST /api/calificaciones)
    // Simularemos el guardado por 1 segundo para la prueba de diseño
    setTimeout(() => {
      setCalificadosLocal(prev => ({ ...prev, [modalCalificacion]: true }));
      setModalCalificacion(null);
      setEstrellas(5);
      setComentario('');
      setEnviandoCalificacion(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-white relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">

        <div className="bg-[#0A3895] pt-6 pb-8 px-6 rounded-b-[40px] relative z-0 shrink-0">
          <div className="flex justify-between items-center text-white">
            <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
            <img src={logoCampy} alt="Logo" className="w-12 h-auto drop-shadow-md" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 px-5 pt-4 hide-scrollbar">
          <h2 className="font-black text-xl mb-4 text-gray-900 tracking-wide uppercase">Mis Pedidos</h2>

          {cargandoPedidos && <p className="text-center text-gray-500 text-sm mb-3">Consultando pedidos en Supabase...</p>}
          {errorPedidos && <p role="alert" className="text-red-600 text-sm mb-3">{errorPedidos}</p>}
          {errorConfirmacion && <p role="alert" className="text-red-600 text-sm mb-3">{errorConfirmacion}</p>}
          {!cargandoPedidos && !errorPedidos && pedidosVendedor.length === 0 && (
            <div className="text-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <span className="text-4xl mb-2 block">🛒</span>
              <p className="text-gray-500 font-bold">Aún no tienes pedidos activos</p>
              <p className="text-gray-400 text-xs mt-1">Ve al inicio para agregar productos.</p>
            </div>
          )}

          {pedidosVendedor.map((entrega) => {
            const indiceActual = obtenerIndiceEtapa(entrega.estado);
            const estaCancelado = entrega.estado === 'Cancelado';
            const estaEnElPunto = entrega.estado === 'En el punto de entrega';
            const estaEntregado = entrega.estado === 'Entregado';

            return (
              <div
                key={entrega.id}
                className={`border-2 rounded-3xl p-4 shadow-sm relative mb-6 bg-white ${
                  estaCancelado
                    ? 'border-red-300 bg-red-50/30'
                    : estaEnElPunto
                    ? 'border-[#22C55E]'
                    : estaEntregado
                    ? 'border-gray-200 opacity-90'
                    : 'border-[#FF8C00]'
                }`}
              >
                {/* Cabecera del estado */}
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 ${
                      estaCancelado
                        ? 'bg-red-600'
                        : estaEnElPunto || estaEntregado
                        ? 'bg-[#22C55E]'
                        : entrega.estado === 'Pendiente'
                        ? 'bg-amber-500'
                        : 'bg-[#FF8C00]'
                    }`}
                  >
                    <span>{estaCancelado ? '✕' : estaEnElPunto ? '📍' : '⚡'}</span>
                    {entrega.estado === 'Pendiente'
                      ? 'Esperando confirmación del vendedor'
                      : entrega.estado}
                  </span>
                  <span className="text-gray-400 text-[10px] font-bold">Pedido #{entrega.id}</span>
                </div>

                {/* Métodos de pago: transferencia y tarjetas */}
                <PagoComprador
                  usuarioId={usuarioId}
                  pedidoId={entrega.id}
                  total={entrega.total}
                  cancelado={estaCancelado}
                />

                {/* Alerta destacada cuando ya llegaron al punto de encuentro */}
                {estaEnElPunto && (
                  <div className="bg-green-50 border-2 border-[#22C55E] rounded-2xl p-3 mb-3 animate-pulse">
                    <p className="text-xs font-black text-green-800">
                      📍 ¡Tu pedido ya está en la dirección señalizada!
                    </p>
                    <p className="text-[11px] text-green-700 mt-0.5">
                      Acércate a <span className="font-bold">{entrega.puntoEntrega}</span> para recibir tus productos.
                    </p>
                  </div>
                )}

                {/* Nota si fue cancelado */}
                {estaCancelado && (
                  <div className="bg-white border border-red-200 rounded-2xl p-3 mb-3 text-xs text-red-700">
                    <p className="font-black uppercase text-[10px] mb-0.5">Motivo de cancelación del vendedor:</p>
                    <p className="italic">"{entrega.notaCancelacion || 'Pedido cancelado'}"</p>
                  </div>
                )}

                {/* Productos del pedido */}
                <div className="flex flex-col gap-2.5 mb-3">
                  {entrega.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0 border border-gray-200 overflow-hidden">
                        {item.imagen ? (
                          <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                        ) : (
                          'IMG'
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-xs text-gray-800 leading-tight">
                          <span className="text-[#FF8C00]">{item.cantidad}x</span> {item.nombre}
                        </h3>
                        <p className="text-gray-400 text-[10px] mt-0.5">{entrega.tienda || 'Vendedor ITO'}</p>
                      </div>
                      <span className="text-gray-800 font-black text-xs px-2">
                        ${(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 my-2.5 pt-2.5 flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Total del Pedido</span>
                  <span className="text-[#FF8C00] font-black text-lg">${Number(entrega.total).toFixed(2)}</span>
                </div>

                {/* Información de entrega y repartidor */}
                {!estaCancelado && (
                  <div className="bg-[#F4F7FD] rounded-2xl p-3 mb-4 border border-blue-100 text-[11px] text-gray-700">
                    <p>
                      📍 <span className="font-bold">Punto de entrega acordado:</span>{' '}
                      <span className="font-black text-[#0A3895]">{entrega.puntoEntrega}</span>
                    </p>
                    <p className="mt-1">
                      {entrega.requiereRepartidor ? (
                        <>
                          🛵 <span className="font-bold">Repartidor:</span>{' '}
                          {entrega.repartidorAsignado || 'Asignando repartidor del campus...'}
                        </>
                      ) : (
                        <>
                          🚶‍♂️ <span className="font-bold">Modalidad:</span> El vendedor te entregará personalmente
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Barra de progreso de estados para el comprador */}
                {!estaCancelado && (
                  <div className="flex justify-between items-center relative mb-5 px-2 mt-2">
                    <div className="absolute top-3 left-6 right-6 h-1 bg-gray-200 z-0"></div>
                    <div
                      className="absolute top-3 left-6 h-1 bg-[#FF8C00] z-0 transition-all duration-300"
                      style={{
                        width:
                          indiceActual <= 0
                            ? '0%'
                            : indiceActual === 1
                            ? '33%'
                            : indiceActual === 2
                            ? '66%'
                            : '88%'
                      }}
                    ></div>

                    {ETAPAS.map((etapa, i) => {
                      const completada = i <= indiceActual;
                      return (
                        <div key={etapa.clave} className="flex flex-col items-center z-10 gap-1 w-14">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                              completada
                                ? 'bg-[#FF8C00] text-white border-[#FF8C00] shadow-sm'
                                : 'bg-white text-gray-300 border-gray-200'
                            }`}
                          >
                            {etapa.icono}
                          </div>
                          <span
                            className={`text-[8px] font-black uppercase text-center leading-tight ${
                              completada ? 'text-gray-800' : 'text-gray-400'
                            }`}
                          >
                            {etapa.etiqueta}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* BOTÓN PARA CONFIRMAR RECEPCIÓN */}
                {estaEnElPunto && !estaCancelado && !estaEntregado && (
                  <button
                    onClick={() => confirmarPedidoRecibido(entrega.id)}
                    disabled={confirmandoId === entrega.id}
                    className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-xs py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {confirmandoId === entrega.id ? 'Guardando recepción...' : 'Confirmar que ya recibí mi pedido'}
                  </button>
                )}

                {/* SECCIÓN DE CALIFICACIÓN (Solo visible si ya se entregó) */}
                {estaEntregado && !estaCancelado && (
                  <div className="mt-2 pt-4 border-t border-gray-100">
                    {calificadosLocal[entrega.id] ? (
                      <p className="text-center text-xs font-bold text-[#22C55E] bg-green-50 py-2 rounded-xl border border-green-100">
                        ¡Gracias por tu calificación! ⭐
                      </p>
                    ) : (
                      <button
                        onClick={() => setModalCalificacion(entrega.id)}
                        className="w-full bg-white border-2 border-[#0A3895] text-[#0A3895] hover:bg-blue-50 font-black text-xs py-3 rounded-xl shadow-sm transition-colors active:scale-95"
                      >
                        ⭐ Calificar Producto y Entrega
                      </button>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 py-2 flex justify-between items-end pb-6 z-20">
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1" onClick={irAInicio}><span className="text-2xl mb-1">🏠</span></div>
          <div className="flex flex-col items-center">
            <div className="bg-[#0A3895] w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5 border-4 border-white text-white text-xl">🛍️</div>
            <span className="text-[#0A3895] text-[10px] font-bold mt-1">Pedidos</span>
          </div>
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1 hover:opacity-80" onClick={irAPerfil}><span className="text-2xl mb-1">👤</span></div>
        </div>

        {/* MODAL DE CALIFICACIONES FLOTANTE */}
        {modalCalificacion && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !enviandoCalificacion && setModalCalificacion(null)}></div>
            <div className="bg-white w-full rounded-t-[30px] p-6 pb-8 relative z-10 animate-[slideUp_0.3s_ease-out]">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h2 className="text-lg font-black text-[#0A3895] text-center mb-1">Califica tu pedido</h2>
              <p className="text-xs text-gray-500 text-center mb-5">¿Qué te pareció el producto y el servicio?</p>

              <form onSubmit={enviarCalificacion} className="flex flex-col gap-4">
                <div className="flex justify-center gap-3 mb-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEstrellas(num)}
                      className={`text-4xl transition-transform hover:scale-110 active:scale-90 ${estrellas >= num ? 'text-[#FF8C00]' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="¡Estuvo delicioso! El vendedor fue muy amable... (Opcional)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:border-[#0A3895] resize-none h-24"
                ></textarea>

                <button
                  type="submit"
                  disabled={enviandoCalificacion}
                  className="w-full bg-[#0A3895] hover:bg-[#082b75] text-white font-black text-sm py-4 rounded-2xl shadow-lg mt-2 disabled:opacity-50 transition-colors"
                >
                  {enviandoCalificacion ? 'Guardando calificación...' : 'Enviar Calificación'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MisPedidos;
