import React, { useState } from 'react';
import logoCampy from './assets/logo.png';
import NavegacionComprador from './NavegacionComprador.jsx';
import { EDIFICIOS_ITO } from './ubicacionesITO.js';

import FormularioTarjetaDemo from './FormularioTarjetaDemo.jsx';
import {
  obtenerTarjetas,
  eliminarTarjeta,
  predeterminarTarjeta
} from './tarjetasDemo.js';


const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const BLOQUES_HORA = Array.from({length:11},(_,i)=>`${String(i+7).padStart(2,'0')}-${String(i+8).padStart(2,'0')}`);

const REGLAS_PASSWORD_PERFIL = [
  { texto: 'Mínimo 8 caracteres', cumple: valor => valor.length >= 8 },
  { texto: 'Máximo 10 caracteres', cumple: valor => valor.length <= 10 },
  { texto: 'Una mayúscula', cumple: valor => /[A-Z]/.test(valor) },
  { texto: 'Una minúscula', cumple: valor => /[a-z]/.test(valor) },
  { texto: 'Un número', cumple: valor => /[0-9]/.test(valor) },
  { texto: 'Un símbolo (! @ # $ %)', cumple: valor => /[^A-Za-z0-9\s]/.test(valor) },
  { texto: 'Sin espacios', cumple: valor => !/\s/.test(valor) }
];

function OjoPasswordPerfil({ visible }) {
  return visible ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 4.2 10 7-.2 1.1-1.4 3-3 4.4" /><path d="M6.6 6.6C4.4 8 2.6 10 2 12c.7 2.8 5 7 10 7 1.4 0 2.7-.3 4-.8" />
    </svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}


const MiPerfil = ({
  usuario,
  setUsuario,
  registrarComoVendedor,
  solicitudVendedor,
  irAPanelModerador,
  registrarComoRepartidor,
  token,
  irAPanelVendedor,
  irAPanelRepartidor,
  irAInicio,
  irAPedidos,
  cerrarSesion
}) => {
  const [modalActivo, setModalActivo] = useState(null);
  const [solicitudRepartidor, setSolicitudRepartidor] = useState(null);
  const [errorRepartidor, setErrorRepartidor] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPasswordNueva, setConfirmarPasswordNueva] = useState('');
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
  const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false);
  const [mostrarConfirmacionNueva, setMostrarConfirmacionNueva] = useState(false);
  const [errorPasswordPerfil, setErrorPasswordPerfil] = useState('');
  const [exitoPasswordPerfil, setExitoPasswordPerfil] = useState('');
  const [guardandoPasswordPerfil, setGuardandoPasswordPerfil] = useState(false);

  const abrirCambioPassword = () => {
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmarPasswordNueva('');
    setErrorPasswordPerfil('');
    setExitoPasswordPerfil('');
    setMostrarPasswordActual(false);
    setMostrarPasswordNueva(false);
    setMostrarConfirmacionNueva(false);
    setModalActivo('cambiarPassword');
  };

  const guardarCambioPassword = async (e) => {
    e.preventDefault();
    setErrorPasswordPerfil('');
    setExitoPasswordPerfil('');
    if (!passwordActual) return setErrorPasswordPerfil('Ingresa tu contraseña actual.');
    if (!REGLAS_PASSWORD_PERFIL.every(regla => regla.cumple(nuevaPassword))) {
      return setErrorPasswordPerfil('La nueva contraseña no cumple todos los requisitos.');
    }
    if (nuevaPassword !== confirmarPasswordNueva) {
      return setErrorPasswordPerfil('Las contraseñas nuevas no coinciden.');
    }
    if (passwordActual === nuevaPassword) {
      return setErrorPasswordPerfil('La nueva contraseña debe ser diferente de la actual.');
    }
    setGuardandoPasswordPerfil(true);
    try {
      const sesion = localStorage.getItem('campy_token') || token;
      if (!sesion) throw new Error('Inicia sesión nuevamente para cambiar tu contraseña.');
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/cambiar-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion}` },
        body: JSON.stringify({ passwordActual, nuevaPassword, confirmarPassword: confirmarPasswordNueva })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo actualizar la contraseña.');
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPasswordNueva('');
      setExitoPasswordPerfil(datos.mensaje || 'Contraseña actualizada correctamente.');
    } catch (error) {
      setErrorPasswordPerfil(error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardandoPasswordPerfil(false);
    }
  };

  React.useEffect(() => {
    if (!token) return;
    let activo=true;
    const consultar=async()=>{
      try {
        const r=await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/solicitudes-repartidor/mia`,{
          headers:{Authorization:`Bearer ${token}`}
        });
        const data=await r.json().catch(()=>({}));
        if(r.ok&&activo){
          setSolicitudRepartidor(data.solicitud);
          if(data.esRepartidor)setUsuario(prev=>prev.esRepartidor?prev:({...prev,esRepartidor:true}));
        }
      }catch(_){ }
    };
    consultar();
    const i=setInterval(consultar,15000);
    return()=>{activo=false;clearInterval(i);};
  },[token]);

  const claveDirecciones = `campy_direcciones_${usuario?.id_usuario ?? usuario?.correo ?? 'invitado'}`;

  const [direcciones, setDirecciones] = useState(() => {
    try {
      const guardadas = localStorage.getItem(claveDirecciones);

      if (guardadas !== null) {
        const lista = JSON.parse(guardadas);
        if (Array.isArray(lista)) return lista;
      }
    } catch (error) {
      console.error('Error al cargar direcciones:', error);
    }

    return [
      {
        id: 'inicial-1',
        nombre: 'Edificio L - Salón L3',
        referencia: 'Clases de 10:00 AM a 12:00 PM'
      },
      {
        id: 'inicial-2',
        nombre: 'Biblioteca Central',
        referencia: 'Mesas de estudio planta baja'
      }
    ];
  });

  const [mostrarNuevaDireccion, setMostrarNuevaDireccion] = useState(false);
  const [nombreDireccion, setNombreDireccion] = useState('');
  const [referenciaDireccion, setReferenciaDireccion] = useState('');

  const guardarDirecciones = (lista) => {
    setDirecciones(lista);
    localStorage.setItem(claveDirecciones, JSON.stringify(lista));
  };

  const agregarDireccion = () => {
    const nombre = nombreDireccion.trim();
    const referencia = referenciaDireccion.trim();

    if (!nombre) {
      alert('Escribe el punto de entrega.');
      return;
    }

    const nuevaDireccion = {
      id: Date.now().toString(),
      nombre,
      referencia
    };

    guardarDirecciones([...direcciones, nuevaDireccion]);
    setNombreDireccion('');
    setReferenciaDireccion('');
    setMostrarNuevaDireccion(false);
  };

  const eliminarDireccion = (id) => {
    guardarDirecciones(
      direcciones.filter((direccion) => direccion.id !== id)
    );
  };



const usuarioTarjetas = usuario?.id_usuario || usuario?.correo;

const [metodoPago, setMetodoPago] = useState('efectivo');
const [agregarTarjeta, setAgregarTarjeta] = useState(false);

const [tarjetas, setTarjetas] = useState([]);
const [tarjetaElegida, setTarjetaElegida] = useState('');
const [errorTarjetas, setErrorTarjetas] = useState('');

const actualizarTarjetas = async () => {
  try {
    const lista = await obtenerTarjetas();
    setTarjetas(lista);
    setTarjetaElegida(lista.find(t => t.predeterminada)?.id || '');
    setErrorTarjetas('');
  } catch (error) {
    setErrorTarjetas(error.message);
  }
};

React.useEffect(() => {
  if (usuarioTarjetas) actualizarTarjetas();
}, [usuarioTarjetas]);


  // Estados para editar perfil básico de comprador
  const [nombreEdit, setNombreEdit] = useState(usuario?.nombre || '');
  const [carreraEdit, setCarreraEdit] = useState(usuario?.carrera || 'Ing. Sistemas Computacionales');
  const [telefonoEdit, setTelefonoEdit] = useState(usuario?.telefono || '');

  // Estados para Alta de Vendedor
  const [idControl, setIdControl] = useState(usuario?.datosVendedor?.identificacion || '');
  const [nombreVendedor, setNombreVendedor] = useState(usuario?.datosVendedor?.nombre || usuario?.nombre || '');
  const [giroVenta, setGiroVenta] = useState(usuario?.datosVendedor?.queVende || '');
  const [ubicacionBase, setUbicacionBase] = useState(usuario?.datosVendedor?.ubicacion || 'Edificio L');
  const [matrizHorario, setMatrizHorario] = useState(usuario?.datosVendedor?.matrizHorario || {});
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
    setErrorRepartidor('');
    try {
      const r=await registrarComoRepartidor({
        identificacion: idControlRep.trim(),
        nombre: nombreRep.trim(),
        zonas: zonasRep.trim()
      });
      setSolicitudRepartidor(r.solicitud);
      setModalActivo(null);
    } catch(error){ setErrorRepartidor(error.message || 'No se pudo enviar la solicitud.'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 text-gray-900 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
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

            <button onClick={abrirCambioPassword} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center text-lg">🔒</div>
                <span className="font-bold text-gray-700 text-sm">Cambiar contraseña</span>
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
            solicitudRepartidor?.estado === 'Pendiente' ? (
              <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5 mb-5 text-sm">
                <h4 className="font-black text-amber-900">Solicitud de repartidor pendiente</h4>
                <p className="text-amber-800 mt-2">El moderador debe aprobar tu alta antes de recibir pedidos.</p>
              </div>
            ) : solicitudRepartidor?.estado === 'Rechazada' ? (
              <div className="rounded-3xl bg-red-50 border border-red-200 p-5 mb-5 text-sm">
                <h4 className="font-black text-red-800">Solicitud de repartidor rechazada</h4>
                <p className="mt-2 text-gray-700">{solicitudRepartidor.comentario_revision || 'Puedes enviar una nueva solicitud.'}</p>
                <button onClick={()=>setModalActivo('altaRepartidor')} className="bg-[#0A3895] text-white rounded-xl py-3 px-4 mt-3 font-bold">Solicitar nuevamente</button>
              </div>
            ) : (
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
            )
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

        <NavegacionComprador activo="perfil" irAInicio={irAInicio} irAPedidos={irAPedidos} />

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
                    list="edificios-vendedor-ito"
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

                <datalist id="edificios-vendedor-ito">{EDIFICIOS_ITO.map(l=><option key={l} value={l}/>)}</datalist>
                <p className="text-[10px] text-[#0A3895] font-bold mt-2">Vista previa: {formatearResumenHorario(matrizHorario)}</p>
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

              {errorRepartidor && <p className="text-xs text-red-700">{errorRepartidor}</p>}
              <button
                type="submit"
                className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg mt-2 active:scale-95 transition-transform"
              >
                Enviar solicitud al moderador ➔
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

        {/* MODAL: CAMBIAR CONTRASEÑA */}
        {modalActivo === 'cambiarPassword' && (
          <div className="absolute bottom-0 left-0 w-full max-h-[90%] overflow-y-auto bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-[#0A3895]">Cambiar contraseña</h2>
              <button type="button" onClick={() => setModalActivo(null)} aria-label="Cerrar" className="text-gray-500 font-bold text-sm">✕</button>
            </div>
            <p className="text-xs text-gray-600 mb-4">Confirma tu contraseña actual y escribe una nueva que cumpla los requisitos.</p>
            <form onSubmit={guardarCambioPassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Contraseña actual</label>
                <div className="relative">
                  <input type={mostrarPasswordActual ? 'text' : 'password'} value={passwordActual}
                    onChange={e => setPasswordActual(e.target.value)} autoComplete="current-password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-800" required />
                  <button type="button" onClick={() => setMostrarPasswordActual(v => !v)}
                    aria-label={mostrarPasswordActual ? 'Ocultar contraseña actual' : 'Ver contraseña actual'}
                    className="absolute inset-y-0 right-2 px-2 text-gray-500"><OjoPasswordPerfil visible={mostrarPasswordActual} /></button>
                </div>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
                <p className="text-xs font-black text-[#0A3895] mb-2">Tu nueva contraseña debe cumplir con:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  {REGLAS_PASSWORD_PERFIL.map(regla => {
                    const cumple = nuevaPassword.length > 0 && regla.cumple(nuevaPassword);
                    return <div key={regla.texto} className={`flex items-center gap-1.5 text-[11px] ${cumple ? 'text-green-700' : 'text-gray-600'}`}>
                      <span aria-hidden="true" className="font-bold">{cumple ? '✓' : '○'}</span>{regla.texto}
                    </div>;
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input type={mostrarPasswordNueva ? 'text' : 'password'} value={nuevaPassword}
                    onChange={e => setNuevaPassword(e.target.value)} autoComplete="new-password"
                    aria-describedby="cambio-password-aviso"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-800" required />
                  <button type="button" onClick={() => setMostrarPasswordNueva(v => !v)}
                    aria-label={mostrarPasswordNueva ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña'}
                    className="absolute inset-y-0 right-2 px-2 text-gray-500"><OjoPasswordPerfil visible={mostrarPasswordNueva} /></button>
                </div>
                {nuevaPassword.length > 10 && <p id="cambio-password-aviso" className="text-xs text-red-700 mt-1" role="alert">Máximo 10 caracteres.</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input type={mostrarConfirmacionNueva ? 'text' : 'password'} value={confirmarPasswordNueva}
                    onChange={e => setConfirmarPasswordNueva(e.target.value)} autoComplete="new-password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-800" required />
                  <button type="button" onClick={() => setMostrarConfirmacionNueva(v => !v)}
                    aria-label={mostrarConfirmacionNueva ? 'Ocultar confirmación' : 'Ver confirmación'}
                    className="absolute inset-y-0 right-2 px-2 text-gray-500"><OjoPasswordPerfil visible={mostrarConfirmacionNueva} /></button>
                </div>
                {!!confirmarPasswordNueva && <p className={`text-xs mt-1 ${confirmarPasswordNueva === nuevaPassword ? 'text-green-700' : 'text-amber-700'}`}>
                  {confirmarPasswordNueva === nuevaPassword ? '✓ Las contraseñas coinciden.' : 'Las contraseñas no coinciden.'}
                </p>}
              </div>
              {errorPasswordPerfil && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{errorPasswordPerfil}</div>}
              {exitoPasswordPerfil && <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">{exitoPasswordPerfil}</div>}
              <button type="submit" disabled={guardandoPasswordPerfil || !!exitoPasswordPerfil}
                className="w-full bg-[#0A3895] text-white font-bold py-3.5 rounded-xl disabled:opacity-50">
                {guardandoPasswordPerfil ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
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

        {errorTarjetas && (
          <p role="alert" className="text-xs text-red-600">{errorTarjetas}</p>
        )}

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
                  onChange={async () => {
                    try {
                      await predeterminarTarjeta(t.id);
                      await actualizarTarjetas();
                    } catch (error) {
                      setErrorTarjetas(error.message);
                    }
                  }}
                />

                <span className="flex-1">
                  {t.marca} •••• {t.ultimos4} · {t.titular}
                  {t.predeterminada && (
                    <span className="block text-green-700 text-[10px] font-bold">
                      Predeterminada
                    </span>
                  )}
                </span>

                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    try {
                      await eliminarTarjeta(usuarioTarjetas, t.id);
                      await actualizarTarjetas();
                    } catch (error) {
                      setErrorTarjetas(error.message);
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
                alGuardar={async t => {
                  await actualizarTarjetas();
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

            <h2 className="text-xl font-black text-[#22C55E] mb-6">
              Mis Direcciones en ITO
            </h2>

            <div className="flex flex-col gap-3 mb-5 max-h-[40vh] overflow-y-auto">

              {direcciones.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-5">
                  Todavía no tienes puntos de entrega guardados.
                </p>
              )}

              {direcciones.map((direccion) => (
                <div
                  key={direccion.id}
                  className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm border-l-4 border-l-[#22C55E]"
                >
                  <div className="flex-1 pr-3">
                    <h3 className="font-bold text-gray-800 text-sm">
                      {direccion.nombre}
                    </h3>

                    {direccion.referencia && (
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {direccion.referencia}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarDireccion(direccion.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    aria-label={`Eliminar ${direccion.nombre}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {!mostrarNuevaDireccion ? (
              <button
                type="button"
                onClick={() => setMostrarNuevaDireccion(true)}
                className="w-full border-2 border-[#22C55E] text-[#16a34a] font-bold py-3 rounded-xl mb-4"
              >
                + Agregar nuevo
              </button>
            ) : (
              <div className="bg-green-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">

                <input
                  type="text"
                  value={nombreDireccion}
                  onChange={(e) => setNombreDireccion(e.target.value)}
                  placeholder="Ej. Edificio K - Salón K2"
                  list="edificios-direccion-ito"
                  maxLength={100}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />

                <input
                  type="text"
                  value={referenciaDireccion}
                  onChange={(e) => setReferenciaDireccion(e.target.value)}
                  placeholder="Referencia (opcional)"
                  maxLength={200}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />

                <datalist id="edificios-direccion-ito">{EDIFICIOS_ITO.map(l=><option key={l} value={l}/>)}</datalist>
                <button
                  type="button"
                  onClick={agregarDireccion}
                  className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-xl"
                >
                  Guardar dirección
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarNuevaDireccion(false)}
                  className="text-gray-500 text-sm py-2"
                >
                  Cancelar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMostrarNuevaDireccion(false);
                setModalActivo(null);
              }}
              className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200"
            >
              Listo
            </button>

          </div>
        )}


      </div>
    </div>
  );
};

export default MiPerfil;