import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

import FormularioTarjetaDemo from './FormularioTarjetaDemo.jsx';
import {
  obtenerTarjetas,
  eliminarTarjeta
} from './tarjetasDemo.js';


const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const BLOQUES_HORA = ['08-10', '10-12', '12-14', '14-16', '16-18'];

const MiPerfil = ({
  usuario,
  setUsuario,
  registrarComoVendedor,
  solicitudVendedor,
  irAPanelModerador,
  registrarComoRepartidor,
  irAPanelVendedor,
  irAPanelRepartidor,
  irAInicio,
  irAPedidos,
  cerrarSesion
}) => {
  const [modalActivo, setModalActivo] = useState(null);


const usuarioTarjetas = usuario?.id_usuario || usuario?.correo;

const [metodoPago, setMetodoPago] = useState('efectivo');
const [agregarTarjeta, setAgregarTarjeta] = useState(false);

const [tarjetas, setTarjetas] = useState(() =>
  obtenerTarjetas(usuarioTarjetas)
);

const [tarjetaElegida, setTarjetaElegida] = useState('');

const actualizarTarjetas = () => {
  setTarjetas(obtenerTarjetas(usuarioTarjetas));
};


  // Estados para editar perfil básico de comprador
  const [nombreEdit, setNombreEdit] = useState(usuario?.nombre || 'Cintia Yadai Salinas Montesinos');
  const [carreraEdit, setCarreraEdit] = useState(usuario?.carrera || 'Ing. Sistemas Computacionales');
  const [telefonoEdit, setTelefonoEdit] = useState(usuario?.telefono || '');

  // Estados para Alta de Vendedor
  const [idControl, setIdControl] = useState(usuario?.datosVendedor?.identificacion || '');
  const [nombreVendedor, setNombreVendedor] = useState(usuario?.datosVendedor?.nombre || usuario?.nombre || '');
  const [giroVenta, setGiroVenta] = useState(usuario?.datosVendedor?.queVende || '');
  const [ubicacionBase, setUbicacionBase] = useState(usuario?.datosVendedor?.ubicacion || 'Edificio L');
  const [matrizHorario, setMatrizHorario] = useState(usuario?.datosVendedor?.matrizHorario || { LUN_10_12: true, MIE_10_12: true, VIE_10_12: true });
  const [notaHorario, setNotaHorario] = useState(usuario?.datosVendedor?.notaHorario || '');
  const [errorHorario, setErrorHorario] = useState('');
  const [errorSolicitud, setErrorSolicitud] = useState('');
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  // Estados para Alta de Repartidor
  const [idControlRep, setIdControlRep] = useState(usuario?.datosRepartidor?.identificacion || '');
  const [nombreRep, setNombreRep] = useState(usuario?.datosRepartidor?.nombre || usuario?.nombre || '');
  const [medioRep, setMedioRep] = useState(usuario?.datosRepartidor?.medio || 'A pie (Campus ITO)');
  const [zonasRep, setZonasRep] = useState(usuario?.datosRepartidor?.zonas || 'Todos los edificios y canchas');

  const alternarCeldaHorario = (dia, bloque) => {
    const clave = `${dia}_${bloque}`;
    setErrorHorario('');
    setMatrizHorario((prev) => {
      const copia = { ...prev };
      if (copia[clave]) {
        delete copia[clave];
      } else {
        copia[clave] = true;
      }
      return copia;
    });
  };

  const formatearResumenHorario = (matriz) => {
    const claves = Object.keys(matriz || {});
    if (claves.length === 0) return 'Horario flexible';
    const porDia = {};
    claves.forEach((k) => {
      const [d, b] = k.split('_');
      if (!porDia[d]) porDia[d] = [];
      porDia[d].push(b);
    });
    return Object.entries(porDia)
      .map(([d, bloques]) => `${d} (${bloques.join(', ')}h)`)
      .join(' • ');
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setUsuario((prev) => ({
      ...prev,
      nombre: nombreEdit,
      carrera: carreraEdit,
      telefono: telefonoEdit
    }));
    setModalActivo(null);
  };

  const manejarAltaVendedor = async (e) => {
    e.preventDefault();
    if (Object.keys(matrizHorario).length === 0) {
      setErrorHorario('Selecciona al menos un bloque en la caja de horarios.');
      return;
    }

    const resumen = formatearResumenHorario(matrizHorario);
    const horariosTexto = notaHorario.trim() ? `${resumen} — Nota: ${notaHorario.trim()}` : resumen;

    setErrorSolicitud('');
    setEnviandoSolicitud(true);
    try {
      await registrarComoVendedor({
        identificacion: idControl.trim(),
        nombre: nombreVendedor.trim(),
        queVende: giroVenta.trim(),
        ubicacion: ubicacionBase.trim(),
        matrizHorario,
        notaHorario: notaHorario.trim(),
        horarios: horariosTexto
      });
      setModalActivo(null);
    } catch (error) {
      setErrorSolicitud(error.message || 'No fue posible enviar tu solicitud.');
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const manejarAltaRepartidor = async (e) => {
    e.preventDefault();
    await registrarComoRepartidor({
      identificacion: idControlRep.trim(),
      nombre: nombreRep.trim(),
      medio: medioRep,
      zonas: zonasRep.trim()
    });
    setModalActivo(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        {/* ENCABEZADO AZUL CON ONDAS */}
        <div className="bg-[#0A3895] pt-6 pb-16 px-6 relative z-0 shrink-0">
          <div className="flex justify-between items-center text-white mb-4">
            <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
            <img src={logoCampy} alt="Logo" className="w-12 h-auto drop-shadow-md" />
          </div>
          <h2 className="text-white font-black text-2xl tracking-wide uppercase">Mi Cuenta</h2>
          
          <div className="absolute -bottom-1 left-0 w-full">
            <svg viewBox="0 0 1440 320" className="w-full h-auto">
              <path fill="#F9FAFB" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,176C672,181,768,139,864,117.3C960,96,1056,96,1152,112C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* CONTENIDO DE CLIENTE */}
        <div className="flex-1 overflow-y-auto pb-32 px-5 z-10 -mt-2 hide-scrollbar">
          
          <div className="bg-gradient-to-br from-[#E0F2FE] to-[#D1FAE5] rounded-3xl p-5 shadow-sm border border-blue-100 mb-5 relative overflow-hidden">
            <div className="flex gap-4 items-center relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white">
                👩🏻‍💻
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#0A3895] text-white">
                  Vista Cliente
                </span>
                <h3 className="font-black text-[15px] text-gray-900 leading-tight mt-1">
                  {usuario?.nombre}
                </h3>
                <p className="text-gray-600 text-xs mt-0.5 font-medium">{usuario?.carrera}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-5">
            <button onClick={() => setModalActivo('editar')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-lg">👤</div>
                <span className="font-bold text-gray-700 text-sm">Editar Perfil</span>
              </div>
              <span className="text-gray-300 font-bold">➔</span>
            </button>

            <button onClick={() => setModalActivo('pago')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-lg">💳</div>
                <span className="font-bold text-gray-700 text-sm">Métodos de Pago</span>
              </div>
              <span className="text-gray-300 font-bold">➔</span>
            </button>

            <button onClick={() => setModalActivo('direcciones')} className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-lg">📍</div>
                <span className="font-bold text-gray-700 text-sm">Mis Puntos de Entrega ITO</span>
              </div>
              <span className="text-gray-300 font-bold">➔</span>
            </button>
          </div>

          {usuario?.esModerador && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#0A3895] mb-4">
              <span className="text-[#0A3895] font-black text-xs">MODERACIÓN CAMPY</span>
              <p className="text-gray-600 text-xs mt-2 mb-3">Revisa y aprueba o rechaza solicitudes para vender.</p>
              <button onClick={irAPanelModerador} className="w-full bg-[#0A3895] text-white font-black text-xs py-3.5 rounded-2xl">
                Ir al Panel de Moderador ➔
              </button>
            </div>
          )}

          {/* APARTADO 1: MODO VENDEDOR */}
          {!usuario?.esVendedor ? (
            solicitudVendedor?.estado === 'Pendiente' ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 mb-4">
                <h4 className="font-black text-amber-900">Solicitud de vendedor pendiente</h4>
                <p className="text-sm text-amber-800 mt-2">Tu solicitud fue enviada a moderación. Te avisaremos aquí si fue aprobada o rechazada.</p>
              </div>
            ) : solicitudVendedor?.estado === 'Rechazada' ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5 mb-4">
                <h4 className="font-black text-red-700">Solicitud rechazada</h4>
                <p className="text-sm text-gray-700 mt-2">Tu solicitud para vender no fue aprobada.</p>
                {solicitudVendedor.comentario_revision && (
                  <p className="text-sm text-red-800 mt-2">Motivo: {solicitudVendedor.comentario_revision}</p>
                )}
                <button onClick={() => { setErrorSolicitud(''); setModalActivo('altaVendedor'); }}
                  className="w-full bg-[#0A3895] text-white rounded-2xl py-3 font-bold text-xs mt-4">
                  Enviar una nueva solicitud
                </button>
              </div>
            ) : (
            <div className="bg-gradient-to-r from-[#0A3895] to-[#1e4eb8] rounded-3xl p-5 text-white shadow-lg mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="bg-[#FF8C00] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    Comunidad Emprendedora ITO
                  </span>
                  <h4 className="font-black text-base mt-2">¿Interesado en ser vendedor?</h4>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    Completa tu registro y selecciona tus horarios para abrir tu propio menú de vendedor.
                  </p>
                </div>
                <span className="text-3xl">🏪</span>
              </div>
              <button
                onClick={() => setModalActivo('altaVendedor')}
                className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-md mt-4 transition-transform active:scale-95"
              >
                Darme de alta como vendedor
              </button>
            </div>
            )
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#FF8C00] mb-4">
              <span className="bg-orange-100 text-[#FF8C00] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Cuenta de Vendedor Activa
              </span>
              <h4 className="font-black text-base text-gray-900 mt-1">
                {usuario.datosVendedor?.nombre}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">
                Administra tus productos y gestiona tus pedidos por cumplir.
              </p>
              <button
                onClick={irAPanelVendedor}
                className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-xs uppercase py-3.5 rounded-2xl shadow-md transition-transform active:scale-95"
              >
                Ir a mi Menú de Vendedor ➔
              </button>
            </div>
          )}

          {/* APARTADO 2: MODO REPARTIDOR (ESTILO UBER CAMPUS) */}
          {!usuario?.esRepartidor ? (
            <div className="bg-gradient-to-r from-[#15803d] to-[#22C55E] rounded-3xl p-5 text-white shadow-lg mb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    Repartidores Campus ITO
                  </span>
                  <h4 className="font-black text-base mt-2">¿Quieres ser repartidor?</h4>
                  <p className="text-xs text-white/90 mt-1 leading-relaxed">
                    Gana dinero extra en tus horas libres llevando pedidos de los vendedores hasta el salón o edificio del comprador.
                  </p>
                </div>
                <span className="text-3xl">🛵</span>
              </div>
              <button
                onClick={() => setModalActivo('altaRepartidor')}
                className="w-full bg-white text-[#15803d] hover:bg-gray-50 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-md mt-4 transition-transform active:scale-95"
              >
                Darme de alta como repartidor
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-[#22C55E] mb-5">
              <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Cuenta de Repartidor Activa
              </span>
              <h4 className="font-black text-base text-gray-900 mt-1">
                {usuario.datosRepartidor?.nombre}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">
                Revisa los pedidos disponibles de los vendedores para recolectar y entregar.
              </p>
              <button
                onClick={irAPanelRepartidor}
                className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase py-3.5 rounded-2xl shadow-md transition-transform active:scale-95"
              >
                Ir a mi Menú de Repartidor ➔
              </button>
            </div>
          )}

          <button 
            onClick={cerrarSesion}
            className="w-full bg-[#FFF0F0] text-[#FF4D4D] font-bold text-sm py-4 rounded-2xl flex justify-center items-center gap-2 hover:bg-[#FFE5E5] transition-colors border border-[#FFE5E5]"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Barra inferior de Cliente */}
        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 py-2 flex justify-between items-end pb-6 z-20">
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1" onClick={irAInicio}>
            <span className="text-2xl mb-1">🏠</span>
          </div>
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1" onClick={irAPedidos}>
            <span className="text-2xl mb-1">🛍️</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-[#0A3895] w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5 border-4 border-white text-white text-xl">
              👤
            </div>
            <span className="text-[#0A3895] text-[10px] font-bold mt-1">Perfil</span>
          </div>
        </div>

        {modalActivo && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setModalActivo(null)}></div>
        )}

        {/* MODAL: ALTA DE VENDEDOR */}
        {modalActivo === 'altaVendedor' && (
          <div className="absolute bottom-0 left-0 w-full max-h-[92%] overflow-y-auto bg-white rounded-t-[30px] p-5 pb-8 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
            <h2 className="text-lg font-black text-[#0A3895]">Alta de Vendedor</h2>
            <p className="text-[11px] text-gray-500 mb-3">
              Tu solicitud se enviará a un moderador. Solo podrás acceder al panel de vendedor cuando sea aprobada.
            </p>

            <form onSubmit={manejarAltaVendedor} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">No. Control / ID ITO</label>
                  <input
                    type="text"
                    value={idControl}
                    onChange={(e) => setIdControl(e.target.value)}
                    placeholder="Ej. 22160989"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Nombre o Tienda</label>
                  <input
                    type="text"
                    value={nombreVendedor}
                    onChange={(e) => setNombreVendedor(e.target.value)}
                    placeholder="Ej. Carlos Yahel"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">¿Qué vendes?</label>
                  <input
                    type="text"
                    value={giroVenta}
                    onChange={(e) => setGiroVenta(e.target.value)}
                    placeholder="Ej. Postres Caseros"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-1">Ubicación en Campus</label>
                  <input
                    type="text"
                    value={ubicacionBase}
                    onChange={(e) => setUbicacionBase(e.target.value)}
                    placeholder="Ej. Edificio L"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#F4F7FD] border border-blue-100 rounded-2xl p-3 shadow-inner">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-black text-[#0A3895] uppercase tracking-wider">
                    📅 Organizador de Horarios
                  </span>
                  <span className="text-[9px] text-orange-600 font-bold">
                    Toca tus horas de venta
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center items-center bg-white p-1.5 rounded-xl border border-gray-200">
                  <div className="text-[8px] font-black text-gray-400">HORA</div>
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="text-[9px] font-black text-[#0A3895] py-0.5 bg-blue-50/70 rounded">
                      {dia}
                    </div>
                  ))}

                  {BLOQUES_HORA.map((bloque) => (
                    <React.Fragment key={bloque}>
                      <div className="text-[8px] font-bold text-gray-500 py-1">{bloque}</div>
                      {DIAS_SEMANA.map((dia) => {
                        const clave = `${dia}_${bloque}`;
                        const seleccionado = !!matrizHorario[clave];
                        return (
                          <button
                            type="button"
                            key={clave}
                            onClick={() => alternarCeldaHorario(dia, bloque)}
                            className={`h-6 rounded border text-[9px] font-black transition-all flex items-center justify-center ${
                              seleccionado
                                ? 'bg-[#FF8C00] text-white border-[#FF8C00] shadow-xs scale-95'
                                : 'bg-gray-50 text-transparent border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            ✓
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-gray-200">
                  <span className="text-[9px] font-black text-[#0A3895] uppercase shrink-0">NOTAS:</span>
                  <input
                    type="text"
                    value={notaHorario}
                    onChange={(e) => setNotaHorario(e.target.value)}
                    placeholder="Ej. Entregas entre cambios de clase..."
                    className="w-full text-[11px] text-gray-700 outline-none bg-transparent border-b border-dashed border-gray-200 pb-0.5"
                  />
                </div>

                {errorHorario && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{errorHorario}</p>
                )}
              </div>

              {errorSolicitud && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded-xl p-2">{errorSolicitud}</p>}
              <button
                  disabled={enviandoSolicitud}
                type="submit"
                className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg mt-1 active:scale-95 transition-transform"
              >
                {enviandoSolicitud ? 'Enviando solicitud...' : 'Enviar solicitud para aprobación ➔'}
              </button>
            </form>
          </div>
        )}

        {/* MODAL NUEVO: ALTA DE REPARTIDOR */}
        {modalActivo === 'altaRepartidor' && (
          <div className="absolute bottom-0 left-0 w-full max-h-[90%] overflow-y-auto bg-white rounded-t-[30px] p-6 pb-9 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
            <h2 className="text-lg font-black text-[#15803d]">Alta de Repartidor Campus</h2>
            <p className="text-xs text-gray-500 mb-4">
              Regístrate para ver los pedidos que los vendedores necesitan enviar dentro del ITO.
            </p>

            <form onSubmit={manejarAltaRepartidor} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">No. Control / Identificación ITO</label>
                <input
                  type="text"
                  value={idControlRep}
                  onChange={(e) => setIdControlRep(e.target.value)}
                  placeholder="Ej. 22160989"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#22C55E]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Tu Nombre Completo</label>
                <input
                  type="text"
                  value={nombreRep}
                  onChange={(e) => setNombreRep(e.target.value)}
                  placeholder="Ej. Carlos Yahel"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#22C55E]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Modalidad de entrega en campus</label>
                <select
                  value={medioRep}
                  onChange={(e) => setMedioRep(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#22C55E]"
                >
                  <option value="A pie (Dentro del Campus ITO)">A pie (Dentro del Campus ITO)</option>
                  <option value="Bicicleta / Patín">Bicicleta / Patín</option>
                  <option value="Motocicleta (Accesos y Alrededores)">Motocicleta (Accesos y Alrededores)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Edificios o Zonas que cubres</label>
                <input
                  type="text"
                  value={zonasRep}
                  onChange={(e) => setZonasRep(e.target.value)}
                  placeholder="Ej. Edificio L, Biblioteca, Canchas, Kiosco..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#22C55E]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg mt-2 active:scale-95 transition-transform"
              >
                Abrir Menú de Repartidor ➔
              </button>
            </form>
          </div>
        )}

        {/* MODAL: EDITAR PERFIL */}
        {modalActivo === 'editar' && (
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-[#0A3895] mb-6">Editar Perfil</h2>
            <form onSubmit={guardarPerfil} className="flex flex-col gap-4">
              <input type="text" value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
              <input type="text" value={carreraEdit} onChange={(e) => setCarreraEdit(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 outline-none focus:border-blue-500" />
              <input type="tel" value={telefonoEdit} onChange={(e) => setTelefonoEdit(e.target.value)} placeholder="Número de teléfono" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500" />
              <button type="submit" className="w-full bg-[#0A3895] text-white font-bold py-4 rounded-xl shadow-lg mt-2 active:scale-95 transition-transform">Guardar Cambios</button>
            </form>
          </div>
        )}

        {/* MODAL: MÉTODOS DE PAGO */}
        
{/* MODAL: MÉTODOS DE PAGO */}
{modalActivo === 'pago' && (
  <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/30">

    <div className="w-full max-h-[88%] overflow-y-auto bg-white rounded-t-[30px] p-6 pb-10 animate-[slideUp_0.3s_ease-out]">

      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

      <h2 className="text-xl font-black text-[#FF8C00] mb-6">
        Métodos de Pago
      </h2>

      <div className="flex flex-col gap-3">

        {[
          [
            'efectivo',
            '💵',
            'Efectivo contra entrega',
            'Paga directamente en el campus'
          ],
          [
            'transferencia',
            '📱',
            'Transferencia / SPEI',
            'Usa tu app bancaria'
          ],
          [
            'tarjeta',
            '💳',
            'Tarjeta bancaria',
            'Selecciona o agrega una tarjeta'
          ]
        ].map(([valor, icono, titulo, descripcion]) => (
          <label
            key={valor}
            className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer ${
              metodoPago === valor
                ? 'border-[#FF8C00] bg-orange-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex gap-3 items-center">

              <span className="text-2xl">
                {icono}
              </span>

              <div>
                <p className="font-bold text-gray-800 text-sm">
                  {titulo}
                </p>

                <p className="text-[10px] text-gray-500">
                  {descripcion}
                </p>
              </div>

            </div>

            <input
              type="radio"
              name="pago"
              checked={metodoPago === valor}
              onChange={() => {
                setMetodoPago(valor);
                actualizarTarjetas();
              }}
              className="w-5 h-5 accent-[#FF8C00]"
            />
          </label>
        ))}

        {metodoPago === 'tarjeta' && (
          <div className="space-y-3">

            {tarjetas.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-xl border p-3 text-xs"
              >
                <input
                  type="radio"
                  name="tarjeta-guardada"
                  checked={tarjetaElegida === t.id}
                  onChange={() => setTarjetaElegida(t.id)}
                />

                <span className="flex-1">
                  {t.marca} •••• {t.ultimos4} · {t.titular}
                </span>

                <button
                  type="button"
                  className="text-red-600"
                  onClick={() => {
                    eliminarTarjeta(usuarioTarjetas, t.id);
                    actualizarTarjetas();

                    if (tarjetaElegida === t.id) {
                      setTarjetaElegida('');
                    }
                  }}
                >
                  Quitar
                </button>
              </div>
            ))}

            {agregarTarjeta ? (
              <FormularioTarjetaDemo
                usuarioId={usuarioTarjetas}
                alGuardar={t => {
                  actualizarTarjetas();
                  setTarjetaElegida(t.id);
                  setAgregarTarjeta(false);
                }}
                alCancelar={() => setAgregarTarjeta(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAgregarTarjeta(true)}
                className="w-full border-2 border-dashed rounded-xl p-3 text-[#0A3895] font-bold text-sm"
              >
                + Agregar nueva tarjeta
              </button>
            )}

          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (
              metodoPago === 'tarjeta' &&
              !tarjetaElegida
            ) {
              setAgregarTarjeta(true);
              return;
            }

            setModalActivo(null);
          }}
          className="w-full bg-[#FF8C00] text-white font-bold py-4 rounded-xl shadow-lg mt-4"
        >
          Confirmar Método
        </button>

        <button
          type="button"
          onClick={() => setModalActivo(null)}
          className="text-gray-500 text-sm"
        >
          Cerrar
        </button>

      </div>
    </div>
  </div>
)}


        {/* MODAL: DIRECCIONES */}
        {modalActivo === 'direcciones' && (
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-[#22C55E] mb-6">Mis Direcciones en ITO</h2>
            <div className="flex flex-col gap-3 mb-6">
              <div className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm border-l-4 border-l-[#22C55E]">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Edificio L - Salón L3</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Clases de 10:00 AM a 12:00 PM</p>
                </div>
                <button className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>
              <div className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Biblioteca Central</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Mesas de estudio planta baja</p>
                </div>
                <button className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>
            </div>
            <button onClick={() => setModalActivo(null)} className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-transform">
              Listo
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MiPerfil;