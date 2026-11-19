import React, { useState } from 'react';
import logoCampy from './assets/logo.png';
import ComentarioEntrega from './ComentarioEntrega.jsx';

const REQUISITOS_PASSWORD_REPARTIDOR = [
  { texto: 'Mínimo 8 caracteres', cumple: valor => valor.length >= 8 },
  { texto: 'Máximo 10 caracteres', cumple: valor => valor.length <= 10 },
  { texto: 'Una mayúscula', cumple: valor => /[A-Z]/.test(valor) },
  { texto: 'Una minúscula', cumple: valor => /[a-z]/.test(valor) },
  { texto: 'Un número', cumple: valor => /[0-9]/.test(valor) },
  { texto: 'Un símbolo (! @ # $ %)', cumple: valor => /[^A-Za-z0-9\s]/.test(valor) },
  { texto: 'Sin espacios', cumple: valor => !/\s/.test(valor) }
];

function OjoPasswordRepartidor({ visible }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 4.2 10 7-.2 1.1-1.4 3-3 4.4"/><path d="M6.6 6.6C4.4 8 2.6 10 2 12c.7 2.8 5 7 10 7 1.4 0 2.7-.3 4-.8"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const PanelRepartidor = ({
  usuario,
  pedidos = [],
  tomarPedidoRepartidor,
  cambiarEstadoPedido,
  cancelarEntregaRepartidor,
  volverAModoCliente,
  cerrarSesion,
  errorPedidos = '',
  refrescarPedidos = () => {}
}) => {
  // 'disponibles' (bolsa Uber) | 'activos' (mis entregas aceptadas)
  const [tabActiva, setTabActiva] = useState('disponibles');
  const [errorAccion, setErrorAccion] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [entregaACancelar, setEntregaACancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelandoEntrega, setCancelandoEntrega] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verPasswordActual, setVerPasswordActual] = useState(false);
  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');
  const [exitoPassword, setExitoPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const abrirCambioPassword = () => {
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setErrorPassword('');
    setExitoPassword('');
    setVerPasswordActual(false);
    setVerNuevaPassword(false);
    setVerConfirmarPassword(false);
    setModalPasswordAbierto(true);
  };

  const guardarCambioPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');
    setExitoPassword('');

    if (!passwordActual) {
      setErrorPassword('Ingresa tu contraseña actual.');
      return;
    }
    if (!REQUISITOS_PASSWORD_REPARTIDOR.every(regla => regla.cumple(nuevaPassword))) {
      setErrorPassword(nuevaPassword.length > 10
        ? 'La contraseña no puede tener más de 10 caracteres.'
        : 'La nueva contraseña debe cumplir todos los requisitos.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (nuevaPassword === passwordActual) {
      setErrorPassword('La nueva contraseña debe ser diferente de la actual.');
      return;
    }

    setGuardandoPassword(true);
    try {
      const token = localStorage.getItem('campy_token');
      if (!token) throw new Error('Inicia sesión nuevamente para cambiar tu contraseña.');

      const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/cambiar-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passwordActual, nuevaPassword, confirmarPassword })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo actualizar la contraseña.');

      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setExitoPassword(datos.mensaje || '¡Tu contraseña se actualizó correctamente!');
    } catch (error) {
      setErrorPassword(error.message || 'No fue posible actualizar la contraseña.');
    } finally {
      setGuardandoPassword(false);
    }
  };


  const nombreRepartidor = usuario?.datosRepartidor?.nombre || usuario?.nombre || 'Repartidor ITO';

  // Pedidos que un vendedor solicitó con repartidor y nadie ha tomado aún
  const pedidosDisponibles = pedidos.filter(
    (p) => p.requiereRepartidor && !p.repartidorId && p.estado !== 'Cancelado' && p.estado !== 'Entregado'
  );

  // Pedidos que este repartidor ya aceptó llevar
  const misEntregas = pedidos.filter(
    (p) => p.requiereRepartidor && !!p.repartidorId
  );

  const entregasPendientesCount = misEntregas.filter((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length;

  const aceptarViaje = async (pedidoId) => {
    setErrorAccion('');
    try {
      await tomarPedidoRepartidor(pedidoId);
      setTabActiva('activos');
    } catch (error) {
      setErrorAccion(error.message || 'No fue posible aceptar el reparto.');
    }
  };

  const actualizar = async () => {
    setActualizando(true);
    setErrorAccion('');
    try {
      await refrescarPedidos();
    } catch (error) {
      setErrorAccion(error.message || 'No se pudieron actualizar los repartos.');
    } finally {
      setActualizando(false);
    }
  };

  const avanzar = async (id, estado) => {
    setErrorAccion('');
    try {
      await cambiarEstadoPedido(id, estado);
    } catch (error) {
      setErrorAccion(error.message || 'No se pudo actualizar el reparto.');
    }
  };

  const confirmarCancelacionEntrega = async (e) => {
    e.preventDefault();
    if (!entregaACancelar || cancelandoEntrega) return;
    setErrorAccion('');
    setCancelandoEntrega(true);
    try {
      await cancelarEntregaRepartidor(entregaACancelar.id, motivoCancelacion.trim());
      setEntregaACancelar(null);
      setMotivoCancelacion('');
      setTabActiva('disponibles');
    } catch (error) {
      setErrorAccion(error.message || 'No se pudo liberar la entrega.');
    } finally {
      setCancelandoEntrega(false);
    }
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
          {(errorAccion || errorPedidos) && (
            <p role="alert" className="text-xs font-bold text-red-600 mb-3">{errorAccion || errorPedidos}</p>
          )}
          
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

          <button type="button" onClick={volverAModoCliente}
            className="w-full bg-[#0A3895] text-white font-black rounded-2xl py-3.5 mb-5 shadow-lg border-2 border-white text-xs">
            🛒 Regresar al catálogo de comprador
          </button>

          <button
            type="button"
            onClick={abrirCambioPassword}
            className="w-full bg-white border border-gray-200 text-[#0A3895] font-bold text-xs py-3.5 rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mb-5"
          >
            <span aria-hidden="true">🔒</span> Cambiar contraseña
          </button>

          {/* ================= PESTAÑA 1: BOLSA DE PEDIDOS DISPONIBLES (ESTILO UBER) ================= */}
          {tabActiva === 'disponibles' && (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">
                  Solicitudes de Vendedores ({pedidosDisponibles.length})
                </h3>
                <button type="button" onClick={actualizar} disabled={actualizando}
                  className="text-[10px] font-bold text-[#0A3895] bg-blue-50 px-2.5 py-1 rounded-full">
                  {actualizando ? 'Actualizando...' : 'Actualizar'}
                </button>
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
                          📦 Solicitud de entrega ({ped.estadoReparto})
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
                    onClick={() => { setTabActiva('disponibles'); actualizar(); }}
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

                        {!entregado && ped.estado !== 'Cancelado' && (
                          <div className="mb-3">
                            <ComentarioEntrega pedidoId={ped.id} comentarioInicial={ped.comentarioEntregaRepartidor}
                              otros={[{nombre:'Comprador',texto:ped.comentarioEntregaComprador},{nombre:'Vendedor',texto:ped.comentarioEntregaVendedor}]}
                              onGuardado={actualizar}/>
                          </div>
                        )}
                        {!entregado ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-gray-600">Etapa: {ped.estadoReparto}</p>
                            {ped.estadoReparto === 'Repartidor llegó' && (
                              <button type="button" onClick={() => avanzar(ped.id, 'Recibí pedido')}
                                className="w-full bg-[#0A3895] text-white font-bold py-3 rounded-xl">
                                Recibí el pedido (aún no salgo)
                              </button>
                            )}
                            {ped.estadoReparto === 'Recibido' && (
                              <button type="button" onClick={() => avanzar(ped.id, 'En camino')}
                                className="w-full bg-[#FF8C00] text-white font-bold py-3 rounded-xl">
                                Confirmar: voy en camino
                              </button>
                            )}
                            {ped.estadoReparto === 'En camino' && (
                              <button type="button" onClick={() => avanzar(ped.id, 'En el punto de entrega')}
                                className="w-full bg-[#0A3895] text-white font-bold py-3 rounded-xl">
                                Llegué al punto de entrega
                              </button>
                            )}
                            {ped.estadoReparto === 'En el punto de entrega' && (
                              <button type="button" onClick={() => avanzar(ped.id, 'Entregado')}
                                className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-xl">
                                Marcar como entregado
                              </button>
                            )}
                            {['Aceptado', 'Listo', 'Repartidor llegó'].includes(ped.estadoReparto) && (
                              <button
                                type="button"
                                onClick={() => { setEntregaACancelar(ped); setMotivoCancelacion(''); setErrorAccion(''); }}
                                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 hover:bg-red-100"
                              >
                                Cancelar mi entrega y liberar pedido
                              </button>
                            )}
                            {['Buscando repartidor', 'Aceptado', 'Listo'].includes(ped.estadoReparto) && (
                              <p className="text-xs text-gray-600">Espera a que el vendedor tenga el pedido listo y confirme tu llegada.</p>
                            )}
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

        {/* CAMBIAR CONTRASEÑA DEL REPARTIDOR */}
        {modalPasswordAbierto && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
            <div className="w-full max-h-[92%] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[#0A3895]">Cambiar contraseña</h2>
                <button type="button" aria-label="Cerrar" onClick={() => setModalPasswordAbierto(false)} className="px-2 font-bold text-gray-500">✕</button>
              </div>

              <form onSubmit={guardarCambioPassword} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña actual</label>
                  <div className="relative">
                    <input type={verPasswordActual ? 'text' : 'password'} value={passwordActual} onChange={e => setPasswordActual(e.target.value)} autoComplete="current-password"
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3895]" required />
                    <button type="button" aria-label={verPasswordActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                      onClick={() => setVerPasswordActual(v => !v)} className="absolute inset-y-0 right-2 px-2 text-gray-500">
                      <OjoPasswordRepartidor visible={verPasswordActual} />
                    </button>
                  </div>
                </div>

                <div id="requisitos-password-repartidor" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                  <p className="text-xs font-bold text-[#0A3895] mb-2">Tu nueva contraseña debe cumplir con:</p>
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {REQUISITOS_PASSWORD_REPARTIDOR.map(regla => {
                      const cumple = nuevaPassword.length > 0 && regla.cumple(nuevaPassword);
                      return (
                        <li key={regla.texto} className={`text-[10px] flex items-start gap-1.5 ${cumple ? 'text-green-700' : 'text-slate-600'}`}>
                          <span aria-hidden="true" className="font-black">{cumple ? '✓' : '○'}</span>{regla.texto}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input type={verNuevaPassword ? 'text' : 'password'} value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} autoComplete="new-password"
                      aria-describedby="requisitos-password-repartidor"
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3895]" required />
                    <button type="button" aria-label={verNuevaPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                      onClick={() => setVerNuevaPassword(v => !v)} className="absolute inset-y-0 right-2 px-2 text-gray-500">
                      <OjoPasswordRepartidor visible={verNuevaPassword} />
                    </button>
                  </div>
                  {nuevaPassword.length > 10 && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-red-700">La contraseña no puede tener más de 10 caracteres.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirmar nueva contraseña</label>
                  <div className="relative">
                    <input type={verConfirmarPassword ? 'text' : 'password'} value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} autoComplete="new-password"
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3895]" required />
                    <button type="button" aria-label={verConfirmarPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      onClick={() => setVerConfirmarPassword(v => !v)} className="absolute inset-y-0 right-2 px-2 text-gray-500">
                      <OjoPasswordRepartidor visible={verConfirmarPassword} />
                    </button>
                  </div>
                  {confirmarPassword.length > 0 && (
                    <p role="status" className={`mt-1 text-xs font-semibold ${nuevaPassword === confirmarPassword ? 'text-green-700' : 'text-amber-700'}`}>
                      {nuevaPassword === confirmarPassword ? '✓ Las contraseñas coinciden.' : 'Las contraseñas todavía no coinciden.'}
                    </p>
                  )}
                </div>

                {errorPassword && <p role="alert" className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-700">{errorPassword}</p>}
                {exitoPassword && <p role="status" className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs font-semibold text-green-700">{exitoPassword}</p>}

                <button type="submit" disabled={guardandoPassword} className="w-full rounded-xl bg-[#0A3895] py-3 text-xs font-black text-white disabled:opacity-50">
                  {guardandoPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </div>
          </div>
        )}

        {entregaACancelar && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
            <form onSubmit={confirmarCancelacionEntrega} className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">!</div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Cancelar mi entrega</h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">Pedido #{entregaACancelar.id}. Se liberará para que otro repartidor lo pueda tomar. El pedido del comprador seguirá activo.</p>
                </div>
              </div>
              <label htmlFor="motivo-cancelacion-repartidor" className="mb-1 block text-xs font-bold text-gray-700">Motivo de la cancelación</label>
              <textarea id="motivo-cancelacion-repartidor" value={motivoCancelacion} onChange={(e) => setMotivoCancelacion(e.target.value)}
                minLength={8} maxLength={500} required rows={3} disabled={cancelandoEntrega}
                placeholder="Explica por qué ya no podrás realizar esta entrega..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 outline-none focus:border-red-400" />
              <p className="mt-1 text-right text-[10px] text-gray-400">{motivoCancelacion.length}/500</p>
              {errorAccion && <p role="alert" className="mb-2 text-xs text-red-700">{errorAccion}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={cancelandoEntrega} onClick={() => { setEntregaACancelar(null); setErrorAccion(''); }}
                  className="flex-1 rounded-xl bg-gray-100 py-3 text-xs font-bold text-gray-700">Volver</button>
                <button type="submit" disabled={cancelandoEntrega || motivoCancelacion.trim().length < 8}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-black text-white disabled:opacity-50">
                  {cancelandoEntrega ? 'Liberando...' : 'Confirmar cancelación'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MENÚ INFERIOR EXCLUSIVO DEL REPARTIDOR */}
        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.06)] px-12 py-2 flex justify-around items-end pb-5 z-20">
          <button
            type="button"
            onClick={() => { setTabActiva('disponibles'); actualizar(); }}
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
            onClick={() => { setTabActiva('activos'); actualizar(); }}
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