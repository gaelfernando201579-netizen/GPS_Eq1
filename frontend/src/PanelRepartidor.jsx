import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const PanelRepartidor = ({
  usuario,
  pedidos = [],
  tomarPedidoRepartidor,
  cambiarEstadoPedido,
  volverAModoCliente,
  cerrarSesion
}) => {
  // 'disponibles' (bolsa Uber) | 'activos' (mis entregas aceptadas)
  const [tabActiva, setTabActiva] = useState('disponibles');

  const nombreRepartidor = usuario?.datosRepartidor?.nombre || usuario?.nombre || 'Repartidor ITO';

  // Pedidos que un vendedor solicitó con repartidor y nadie ha tomado aún
  const pedidosDisponibles = pedidos.filter(
    (p) => p.requiereRepartidor && !p.repartidorAsignado && p.estado !== 'Cancelado' && p.estado !== 'Entregado'
  );

  // Pedidos que este repartidor ya aceptó llevar
  const misEntregas = pedidos.filter(
    (p) => p.requiereRepartidor && p.repartidorAsignado
  );

  const entregasPendientesCount = misEntregas.filter((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length;

  const aceptarViaje = (pedidoId) => {
    tomarPedidoRepartidor(pedidoId, nombreRepartidor);
    setTabActiva('activos');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        {/* ENCABEZADO AZUL CON DISTINTIVO DE REPARTIDOR */}
        <div className="bg-[#0A3895] pt-6 pb-14 px-6 relative z-0 shrink-0">
          <div className="flex justify-between items-center text-white mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
                <span className="bg-[#22C55E] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  Modo Repartidor
                </span>
              </div>
              <p className="text-white/80 text-[11px] mt-0.5 font-medium">
                {tabActiva === 'disponibles' ? 'Pedidos disponibles para recolectar' : 'Mis entregas en curso'}
              </p>
            </div>
            <img src={logoCampy} alt="Logo" className="w-12 h-auto drop-shadow-md" />
          </div>

          <div className="absolute -bottom-1 left-0 w-full">
            <svg viewBox="0 0 1440 320" className="w-full h-auto">
              <path fill="#F9FAFB" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,176C672,181,768,139,864,117.3C960,96,1056,96,1152,112C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto pb-32 px-5 z-10 -mt-2 hide-scrollbar">
          
          {/* Ficha rápida del repartidor */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 text-[#22C55E] rounded-2xl flex items-center justify-center text-2xl border border-green-100">
                🛵
              </div>
              <div>
                <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  En línea • ID {usuario?.datosRepartidor?.identificacion || 'ITO'}
                </span>
                <h2 className="font-black text-sm text-gray-900 mt-0.5">{nombreRepartidor}</h2>
                <p className="text-[10px] text-gray-500">
                  Medio: <span className="font-bold text-gray-700">{usuario?.datosRepartidor?.medio || 'A pie dentro del campus'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ================= PESTAÑA 1: BOLSA DE PEDIDOS DISPONIBLES (ESTILO UBER) ================= */}
          {tabActiva === 'disponibles' && (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">
                  Solicitudes de Vendedores ({pedidosDisponibles.length})
                </h3>
                <span className="text-[10px] font-bold text-[#FF8C00] bg-orange-50 px-2.5 py-1 rounded-full">
                  ⚡ En vivo
                </span>
              </div>

              {pedidosDisponibles.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border-2 border-dashed border-gray-200 mb-6">
                  <span className="text-4xl block mb-2">📡</span>
                  <p className="font-black text-sm text-gray-800">Buscando envíos cercanos...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cuando un vendedor acepte un pedido y solicite un repartidor, aparecerá aquí con los puntos de recolección y entrega.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mb-6">
                  {pedidosDisponibles.map((ped) => (
                    <div key={ped.id} className="bg-white rounded-3xl p-4 shadow-sm border-2 border-[#22C55E] relative overflow-hidden">
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                          📦 Listo para recoger ({ped.estado})
                        </span>
                        <span className="text-xs font-black text-[#22C55E]">
                          + ${Number(ped.comisionRepartidor || 10).toFixed(2)} ganancia
                        </span>
                      </div>

                      {/* Ruta estilo Uber: Punto A (Recoger) -> Punto B (Dejar) */}
                      <div className="bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-100 flex flex-col gap-2.5">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#0A3895] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            A
                          </span>
                          <div>
                            <p className="text-[9px] font-black uppercase text-gray-400">Pasar a recoger con Vendedor:</p>
                            <p className="text-xs font-black text-gray-800">{ped.lugarRecoleccion}</p>
                            <p className="text-[10px] text-gray-500">{ped.tienda || 'Vendedor Campus'}</p>
                          </div>
                        </div>

                        <div className="border-l-2 border-dashed border-gray-300 h-3 ml-2.5"></div>

                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#FF8C00] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            B
                          </span>
                          <div>
                            <p className="text-[9px] font-black uppercase text-gray-400">Entregar al Comprador en:</p>
                            <p className="text-xs font-black text-gray-800">{ped.puntoEntrega}</p>
                            <p className="text-[10px] text-gray-500">Recibe: {ped.compradorNombre}</p>
                          </div>
                        </div>
                      </div>

                      {/* Detalle económico indicado por el vendedor */}
                      <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-3 mb-3 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-500">Costo del producto</p>
                          <p className="text-[11px] text-gray-600">
                            {ped.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                          </p>
                        </div>
                        <span className="text-base font-black text-[#FF8C00]">
                          ${Number(ped.costoProductoRepartidor || ped.total).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => aceptarViaje(ped.id)}
                        className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-md transition-transform active:scale-95"
                      >
                        Aceptar Viaje e Ir a Recoger ➔
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2.5 mt-4">
                <button
                  onClick={volverAModoCliente}
                  className="w-full bg-white border border-gray-200 text-gray-600 font-bold text-xs py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  🛒 Volver al catálogo como Comprador
                </button>
                <button
                  onClick={cerrarSesion}
                  className="w-full bg-[#FFF0F0] text-[#FF4D4D] font-bold text-xs py-3.5 rounded-2xl hover:bg-[#FFE5E5] transition-colors border border-[#FFE5E5]"
                >
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}

          {/* ================= PESTAÑA 2: MIS ENTREGAS ACTIVAS ================= */}
          {tabActiva === 'activos' && (
            <>
              <div className="mb-4">
                <h3 className="font-black text-base text-gray-900 uppercase tracking-wide">
                  Mis Entregas Asignadas
                </h3>
                <p className="text-xs text-gray-500">
                  Actualiza el estado para que el comprador sepa cuando ya vayas en camino o hayas llegado al punto.
                </p>
              </div>

              {misEntregas.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border border-gray-100">
                  <span className="text-4xl block mb-2">🛵</span>
                  <p className="font-bold text-sm text-gray-700">No has tomado ningún pedido todavía</p>
                  <button
                    onClick={() => setTabActiva('disponibles')}
                    className="mt-3 bg-[#0A3895] text-white font-bold text-xs px-4 py-2.5 rounded-xl"
                  >
                    Ver pedidos disponibles
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {misEntregas.map((ped) => {
                    const entregado = ped.estado === 'Entregado';
                    return (
                      <div key={ped.id} className="bg-white rounded-3xl p-4 shadow-sm border-2 border-[#0A3895]">
                        <div className="flex justify-between items-center mb-3">
                          <span className="bg-[#0A3895] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                            {ped.estado}
                          </span>
                          <span className="text-[11px] font-bold text-gray-400">Pedido #{ped.id}</span>
                        </div>

                        <div className="bg-[#F4F7FD] rounded-2xl p-3 mb-3 border border-blue-100 text-xs flex flex-col gap-1.5">
                          <p>🏪 <span className="font-bold text-gray-700">Recoger en:</span> <span className="font-black text-[#0A3895]">{ped.lugarRecoleccion}</span></p>
                          <p>📍 <span className="font-bold text-gray-700">Dejar en:</span> <span className="font-black text-[#FF8C00]">{ped.puntoEntrega}</span></p>
                          <p>👤 <span className="font-bold text-gray-700">Cliente:</span> {ped.compradorNombre}</p>
                          <p>💵 <span className="font-bold text-gray-700">Costo del producto:</span> <span className="font-black">${Number(ped.costoProductoRepartidor || ped.total).toFixed(2)}</span></p>
                        </div>

                        {!entregado ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-black uppercase text-gray-400">Actualizar estado al comprador:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => cambiarEstadoPedido(ped.id, 'En camino')}
                                className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                                  ped.estado === 'En camino'
                                    ? 'bg-[#FF8C00] text-white border-[#FF8C00]'
                                    : 'bg-orange-50 text-[#FF8C00] border-orange-200'
                                }`}
                              >
                                🛵 Ya voy en camino
                              </button>
                              <button
                                onClick={() => cambiarEstadoPedido(ped.id, 'En el punto de entrega')}
                                className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all ${
                                  ped.estado === 'En el punto de entrega'
                                    ? 'bg-[#0A3895] text-white border-[#0A3895]'
                                    : 'bg-blue-50 text-[#0A3895] border-blue-200'
                                }`}
                              >
                                📍 Ya estoy en el punto
                              </button>
                            </div>
                            <button
                              onClick={() => cambiarEstadoPedido(ped.id, 'Entregado')}
                              className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs py-3 rounded-xl shadow-md mt-1"
                            >
                              ✓ Confirmar Pedido Entregado
                            </button>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-3 rounded-xl text-center">
                            ✅ Entrega completada con éxito
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* MENÚ INFERIOR EXCLUSIVO DEL REPARTIDOR */}
        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.06)] px-12 py-2 flex justify-around items-end pb-5 z-20">
          <button
            type="button"
            onClick={() => setTabActiva('disponibles')}
            className="flex flex-col items-center cursor-pointer relative"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                tabActiva === 'disponibles'
                  ? 'bg-[#0A3895] shadow-lg -mt-5 border-4 border-white text-white text-xl'
                  : 'text-gray-400 text-2xl'
              }`}
            >
              📡
            </div>
            {pedidosDisponibles.length > 0 && (
              <span className="absolute -top-2 right-2 bg-[#22C55E] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {pedidosDisponibles.length}
              </span>
            )}
            <span className={`text-[10px] font-bold mt-1 ${tabActiva === 'disponibles' ? 'text-[#0A3895]' : 'text-gray-400'}`}>
              Disponibles
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('activos')}
            className="flex flex-col items-center cursor-pointer relative"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                tabActiva === 'activos'
                  ? 'bg-[#0A3895] shadow-lg -mt-5 border-4 border-white text-white text-xl'
                  : 'text-gray-400 text-2xl'
              }`}
            >
              🛵
            </div>
            {entregasPendientesCount > 0 && (
              <span className="absolute -top-2 right-2 bg-[#FF8C00] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {entregasPendientesCount}
              </span>
            )}
            <span className={`text-[10px] font-bold mt-1 ${tabActiva === 'activos' ? 'text-[#0A3895]' : 'text-gray-400'}`}>
              Mis Entregas
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PanelRepartidor;