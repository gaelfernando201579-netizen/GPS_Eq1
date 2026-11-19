import React, { useState, useEffect, useRef, useCallback } from 'react';
import CampyLogin from './CampyLogin';
import CampyRegistro from './CampyRegistro';
import HomeComprador from './HomeComprador';
import MisPedidos from './MisPedidos';
import MiPerfil from './MiPerfil';
import PanelVendedor from './PanelVendedor';
import PanelRepartidor from './PanelRepartidor';
import PanelModerador from './PanelModerador';
import { supabase } from './config/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const USUARIO_VACIO = {
  nombre: '',
  correo: '',
  carrera: '',
  esVendedor: false,
  datosVendedor: null,
  esRepartidor: false,
  datosRepartidor: null,
  esModerador: false
};

function leerUsuarioPersistido() {
  try {
    if (localStorage.getItem('campy_sesion_activa_v3') !== 'true') {
      return USUARIO_VACIO;
    }
    const guardado = localStorage.getItem('campy_usuario');
    if (!guardado) return USUARIO_VACIO;
    const parseado = JSON.parse(guardado);
    if (!parseado || typeof parseado.correo !== 'string' || !parseado.correo.trim()) {
      return USUARIO_VACIO;
    }
    return { ...USUARIO_VACIO, ...parseado };
  } catch {
    return USUARIO_VACIO;
  }
}

function tieneSesionValidaGuardada() {
  try {
    const activa = localStorage.getItem('campy_sesion_activa_v3') === 'true';
    const token = localStorage.getItem('campy_token');
    const usuario = leerUsuarioPersistido();
    return Boolean(activa && token && usuario.correo);
  } catch {
    return false;
  }
}

function obtenerPantallaInicial() {
  if (!tieneSesionValidaGuardada()) {
    try {
      localStorage.removeItem('campy_token');
      localStorage.removeItem('campy_usuario');
      localStorage.removeItem('campy_pantalla');
    } catch (_) {}
    return 'login';
  }
  const usuario = leerUsuarioPersistido();
  const pantallaGuardada = localStorage.getItem('campy_pantalla');
  const pantallasValidas = ['home', 'pedidos', 'perfil', 'vendedor', 'repartidor', 'moderador'];
  if (pantallasValidas.includes(pantallaGuardada)) {
    if (pantallaGuardada === 'moderador' && !usuario.esModerador) return 'home';
    if (pantallaGuardada === 'vendedor' && !usuario.esVendedor) return 'home';
    if (pantallaGuardada === 'repartidor' && !usuario.esRepartidor) return 'home';
    return pantallaGuardada;
  }
  return usuario.esModerador
    ? 'moderador'
    : usuario.esVendedor
      ? 'vendedor'
      : usuario.esRepartidor
        ? 'repartidor'
        : 'home';
}

const ESTILOS_NOTIFICACIONES = `
  @keyframes campyToastEntrada {
    from { opacity: 0; transform: translate3d(18px, -12px, 0) scale(.97); }
    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  }
  @keyframes campyToastTiempo {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
  .campy-toast-contenedor {
    position: fixed; top: 22px; right: 22px; z-index: 99999;
    display: flex; flex-direction: column; gap: 12px;
    width: min(410px, calc(100vw - 32px));
    pointer-events: none;
  }
  div.campy-toast {
    --campy-acento: #2563eb;
    --campy-fondo-icono: #eff6ff;
    box-sizing: border-box; display: flex; gap: 13px; align-items: flex-start;
    position: relative; padding: 16px 15px 18px;
    border: 1px solid #e5eaf1; border-radius: 18px;
    background: #fff; color: #0f172a;
    box-shadow: 0 16px 46px rgba(15, 23, 42, .14), 0 2px 8px rgba(15, 23, 42, .04);
    overflow: hidden; pointer-events: auto;
    animation: campyToastEntrada .32s cubic-bezier(.2,.8,.2,1) both;
  }
  .campy-toast-exito { --campy-acento: #16a34a; --campy-fondo-icono: #ecfdf3; }
  .campy-toast-error { --campy-acento: #dc2626; --campy-fondo-icono: #fef2f2; }
  .campy-toast-info { --campy-acento: #2563eb; --campy-fondo-icono: #eff6ff; }
  .campy-toast-aviso { --campy-acento: #d97706; --campy-fondo-icono: #fffbeb; }
  .campy-toast-icono {
    width: 43px; height: 43px; border-radius: 13px; flex: 0 0 43px;
    display: grid; place-items: center;
    background: var(--campy-fondo-icono); color: var(--campy-acento);
  }
  .campy-toast-icono svg { width: 23px; height: 23px; }
  .campy-toast-contenido { flex: 1; min-width: 0; }
  .campy-toast-titulo { margin: 1px 0 5px; font-size: 14px; font-weight: 750; line-height: 1.35; color: #0f172a; }
  .campy-toast-mensaje { margin: 0; font-size: 13px; line-height: 1.55; color: #475569; overflow-wrap: anywhere; }
  .campy-toast-momento { display: block; margin-top: 7px; font-size: 11px; color: #94a3b8; }
  .campy-toast-cerrar {
    flex: 0 0 24px; display: grid; place-items: center;
    height: 24px; width: 24px; padding: 0; margin: -4px -3px 0 0;
    border: none; border-radius: 7px; background: transparent;
    color: #94a3b8; cursor: pointer; transition: background .15s, color .15s;
  }
  .campy-toast-cerrar:hover { background: #f1f5f9; color: #334155; }
  .campy-toast-cerrar:focus-visible { outline: 2px solid var(--campy-acento); outline-offset: 2px; }
  .campy-toast-cerrar svg { height: 17px; width: 17px; }
  .campy-toast-barra {
    position: absolute; bottom: 0; left: 0; width: 100%; height: 3px;
    background: var(--campy-acento); transform-origin: left;
    animation: campyToastTiempo 5s linear forwards;
  }
  @media (max-width: 480px) {
    .campy-toast-contenedor { top: 12px; left: 12px; right: 12px; width: auto; }
    .campy-toast { padding: 14px 13px 17px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .campy-toast, .campy-toast-barra { animation: none; }
  }
`;

function IconoNotificacion({ tipo }) {
  const iconos = {
    exito: <><path d="M20 6 9 17l-5-5" /></>,
    error: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    aviso: <><path d="M10.3 3.9 2.5 17.4a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconos[tipo] || iconos.info}</svg>;
}

function App() {
  const [notificaciones, setNotificaciones] = useState([]);
  const contadorNotificaciones = useRef(0);
  const temporizadores = useRef(new Map());

  const cerrarNotificacion = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id));
    temporizadores.current.delete(id);
    setNotificaciones((actuales) => actuales.filter((n) => n.id !== id));
  }, []);

  const mostrarNotificacion = useCallback((tipo, titulo, mensaje) => {
    // 1. Notificación nativa en la barra de estado de Android
    try {
      if (typeof window !== 'undefined' && window.CampyNative?.mostrarNotificacion) {
        window.CampyNative.mostrarNotificacion(String(titulo), String(mensaje));
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(String(titulo), { body: String(mensaje) });
      }
    } catch (_) {}

    // 2. Toast visual dentro de la app
    const id = ++contadorNotificaciones.current;
    setNotificaciones((actuales) => [...actuales.slice(-2), { id, tipo, titulo, mensaje }]);
    const temporizador = setTimeout(() => cerrarNotificacion(id), 5000);
    temporizadores.current.set(id, temporizador);
  }, [cerrarNotificacion]);

  useEffect(() => () => {
    temporizadores.current.forEach((temporizador) => clearTimeout(temporizador));
    temporizadores.current.clear();
  }, []);

  const conNotificacion = (accion, titulo, mensaje) => async (...args) => {
    try {
      const resultado = await accion(...args);
      mostrarNotificacion('exito', titulo, mensaje);
      return resultado;
    } catch (error) {
      mostrarNotificacion('error', 'No se pudo completar la acción', error.message || 'Inténtalo nuevamente.');
      throw error;
    }
  };

  const [pantallaActual, setPantallaActual] = useState(obtenerPantallaInicial);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [tokenAuth, setTokenAuth] = useState(() =>
    tieneSesionValidaGuardada() ? localStorage.getItem('campy_token') : null
  );
  const [solicitudVendedor, setSolicitudVendedor] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(leerUsuarioPersistido);

  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');
  const [recargaCatalogo, setRecargaCatalogo] = useState(0);
  const [carritoGlobal, setCarritoGlobal] = useState({});
  const [pedidosPorCumplir, setPedidosPorCumplir] = useState([]);
  const [pedidosParaVendedor, setPedidosParaVendedor] = useState([]);
  const [pedidosRepartidor, setPedidosRepartidor] = useState([]);
  const [errorRepartos, setErrorRepartos] = useState('');
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState('');
  const [actualizandoPedidos, setActualizandoPedidos] = useState(false);
  const consultaPedidosRef = useRef(null);
  const refrescarPedidos = useCallback(() => {
    consultaPedidosRef.current?.(true);
  }, []);

  // Referencias para detectar cambios en segundo plano y disparar notificaciones por rol
  const estadosPedidosClienteRef = useRef(null);
  const estadosPedidosVendedorRef = useRef(null);
  const repartosDisponiblesIdsRef = useRef(null);
  const estadoSolicitudVendedorRef = useRef(undefined);
  const rolVendedorRef = useRef(undefined);
  const rolRepartidorRef = useRef(undefined);
  const solicitudesModeradorRef = useRef(null);
  const productosCatalogoIdsRef = useRef(null);
  const misProductosIdsRef = useRef(null);

  // Persistir usuario y pantalla activa mientras exista sesión válida
  useEffect(() => {
    if (tokenAuth && usuarioActual.correo) {
      try {
        localStorage.setItem('campy_usuario', JSON.stringify(usuarioActual));
      } catch (_) {}
    }
  }, [usuarioActual, tokenAuth]);

  useEffect(() => {
    if (tokenAuth && usuarioActual.correo && pantallaActual !== 'login' && pantallaActual !== 'registro') {
      try {
        localStorage.setItem('campy_pantalla', pantallaActual);
      } catch (_) {}
    }
  }, [pantallaActual, tokenAuth, usuarioActual.correo]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const manejarIngreso = useCallback((datosUsuario, token = null) => {
    estadosPedidosClienteRef.current = null;
    estadosPedidosVendedorRef.current = null;
    repartosDisponiblesIdsRef.current = null;
    estadoSolicitudVendedorRef.current = undefined;
    rolVendedorRef.current = datosUsuario?.esVendedor === true;
    rolRepartidorRef.current = datosUsuario?.esRepartidor === true;
    solicitudesModeradorRef.current = null;
    misProductosIdsRef.current = null;

    if (token) {
      localStorage.setItem('campy_token', token);
      localStorage.setItem('campy_sesion_activa_v3', 'true');
      setTokenAuth(token);
    }
    const nuevoUsuario = {
      nombre: datosUsuario?.nombre || '',
      correo: datosUsuario?.correo || '',
      carrera: datosUsuario?.carrera || '',
      id_usuario: datosUsuario?.id_usuario,
      esVendedor: datosUsuario?.esVendedor === true,
      datosVendedor: null,
      esRepartidor: datosUsuario?.esRepartidor === true,
      esModerador: datosUsuario?.esModerador === true,
      datosRepartidor: null
    };
    if (datosUsuario) {
      setUsuarioActual(nuevoUsuario);
      try {
        localStorage.setItem('campy_usuario', JSON.stringify(nuevoUsuario));
        localStorage.setItem('campy_sesion_activa_v3', 'true');
      } catch (_) {}
    }
    setSolicitudVendedor(null);
    const pantallaDestino =
      datosUsuario?.esModerador === true
        ? 'moderador'
        : datosUsuario?.esVendedor === true
          ? 'vendedor'
          : datosUsuario?.esRepartidor === true
            ? 'repartidor'
            : 'home';
    setPantallaActual(pantallaDestino);
    try {
      localStorage.setItem('campy_pantalla', pantallaDestino);
    } catch (_) {}
    setRecargaCatalogo((n) => n + 1);
  }, []);

  const cargarUsuarioOAuth = useCallback(async (user) => {
    if (!user?.email) return;
    const nombre = (user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0] || 'Estudiante ITO').slice(0, 120);
    const correo = user.email.trim().toLowerCase();
    const carrera = 'Ingeniería en Sistemas Computacionales';
    try {
      localStorage.removeItem('campy_oauth_pendiente');
    } catch (_) {}

    // Sincronizar o iniciar sesión con el backend para obtener un JWT real y roles de Supabase
    const passOAuth = 'Campy@2026';
    try {
      let respLogin = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password: passOAuth })
      });

      if (!respLogin.ok) {
        await fetch(`${API_URL}/api/auth/registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.length >= 3 ? nombre : `${nombre} ITO`,
            correo,
            telefono: '9511234567',
            password: passOAuth,
            carrera
          })
        }).catch(() => {});

        respLogin = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, password: passOAuth })
        });
      }

      if (respLogin.ok) {
        const datos = await respLogin.json().catch(() => ({}));
        if (datos?.token) {
          manejarIngreso(
            datos.usuario || { nombre, correo, carrera },
            datos.token
          );
          mostrarNotificacion('exito', 'Sesión iniciada', `Bienvenido(a), ${datos.usuario?.nombre || nombre}.`);
          return;
        }
      }
    } catch (_) {}

    manejarIngreso(
      {
        nombre,
        correo,
        carrera: 'Ing. Sistemas Computacionales'
      },
      user.id
    );
    mostrarNotificacion('exito', 'Sesión iniciada', `Bienvenido(a), ${nombre}.`);
  }, [manejarIngreso, mostrarNotificacion]);

  useEffect(() => {
    const procesarUrlOAuth = async (url) => {
      if (!url || typeof url !== 'string') return;
      try {
        if (url.includes('#')) {
          const urlHash = url.split('#')[1];
          const params = new URLSearchParams(urlHash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { data } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (data?.session?.user) {
              await cargarUsuarioOAuth(data.session.user);
            }
            return;
          }
        }
        if (url.includes('code=')) {
          const queryPart = url.split('?')[1]?.split('#')[0] || '';
          const params = new URLSearchParams(queryPart);
          const code = params.get('code');
          if (code && supabase.auth.exchangeCodeForSession) {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session?.user) {
              await cargarUsuarioOAuth(data.session.user);
            }
          }
        }
      } catch (err) {
        console.error('Error procesando callback OAuth:', err);
      }
    };

    window.recibirCallbackOAuth = procesarUrlOAuth;
    const listenerCustom = (e) => {
      if (e?.detail?.url) procesarUrlOAuth(e.detail.url);
    };
    window.addEventListener('campyOAuthCallback', listenerCustom);

    try {
      const urlPendiente = window.CampyNative?.obtenerUrlCallbackPendiente?.();
      if (urlPendiente) {
        procesarUrlOAuth(urlPendiente);
      } else if (window.location.hash?.includes('access_token=') || window.location.search?.includes('code=')) {
        procesarUrlOAuth(window.location.href);
      }
    } catch (_) {}

    supabase.auth.getSession().then(({ data: { session } }) => {
      const sesionActiva = localStorage.getItem('campy_sesion_activa_v3') === 'true';
      const oauthPendiente = localStorage.getItem('campy_oauth_pendiente') === '1';
      if (session?.user && (sesionActiva || oauthPendiente)) {
        cargarUsuarioOAuth(session.user);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const sesionActiva = localStorage.getItem('campy_sesion_activa_v3') === 'true';
        const oauthPendiente = localStorage.getItem('campy_oauth_pendiente') === '1';
        if (sesionActiva || oauthPendiente) {
          cargarUsuarioOAuth(session.user);
        }
      } else if (event === 'SIGNED_OUT' && !localStorage.getItem('campy_token')) {
        setPantallaActual('login');
      }
    });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('campyOAuthCallback', listenerCustom);
      if (window.recibirCallbackOAuth === procesarUrlOAuth) {
        delete window.recibirCallbackOAuth;
      }
    };
  }, [cargarUsuarioOAuth]);

  useEffect(() => {
    let vigente = true;

    const obtenerCatalogo = async () => {
      setCargandoProductos(true);
      setErrorProductos('');
      try {
        const respuesta = await fetch(`${API_URL}/api/productos`);
        if (!respuesta.ok) throw new Error('No fue posible consultar el catálogo.');
        const datos = await respuesta.json();
        if (!Array.isArray(datos)) throw new Error('La respuesta del catálogo no es válida.');

        if (vigente) {
          const mapeados = datos.map((producto) => ({
            ...producto,
            id: producto.id_producto,
            precio: Number(producto.precio),
            categoria: producto.categoria || 'Sin categoría',
            tienda: producto.nombre_vendedor ? `Vende: ${producto.nombre_vendedor}` : 'Vendedor no disponible',
            ubicacion: 'Por acordar con el vendedor',
          }));

          if (tokenAuth) {
            const nuevosIds = new Set(mapeados.map((p) => String(p.id)));
            if (productosCatalogoIdsRef.current !== null && usuarioActual.esModerador) {
              mapeados.forEach((p) => {
                if (!productosCatalogoIdsRef.current.has(String(p.id))) {
                  mostrarNotificacion(
                    'info',
                    'Nuevo producto en catálogo',
                    `Se publicó "${p.nombre}" (${p.tienda}) por $${p.precio}.`
                  );
                }
              });
            }
            productosCatalogoIdsRef.current = nuevosIds;

            if (usuarioActual.esVendedor && usuarioActual.id_usuario) {
              const misProdsActuales = new Map(
                mapeados
                  .filter((p) => Number(p.id_vendedor) === Number(usuarioActual.id_usuario))
                  .map((p) => [String(p.id), p.nombre])
              );
              if (misProductosIdsRef.current !== null) {
                misProductosIdsRef.current.forEach((nombreProd, idProd) => {
                  if (!misProdsActuales.has(idProd)) {
                    mostrarNotificacion(
                      'aviso',
                      'Cambio en tus productos',
                      `Tu publicación "${nombreProd}" ya no se encuentra activa en el catálogo.`
                    );
                  }
                });
              }
              misProductosIdsRef.current = misProdsActuales;
            }
          }

          setProductosCatalogo(mapeados);
        }
      } catch (error) {
        if (vigente) {
          setProductosCatalogo([]);
          setErrorProductos('No se pudieron cargar los productos. Intenta nuevamente.');
        }
      } finally {
        if (vigente) setCargandoProductos(false);
      }
    };

    obtenerCatalogo();
    return () => { vigente = false; };
  }, [recargaCatalogo, tokenAuth, usuarioActual.esModerador, usuarioActual.esVendedor, usuarioActual.id_usuario, mostrarNotificacion]);

  const cerrarSesionUsuario = useCallback(() => {
    localStorage.removeItem('campy_sesion_activa_v3');
    localStorage.removeItem('campy_oauth_pendiente');
    localStorage.removeItem('campy_token');
    localStorage.removeItem('campy_usuario');
    localStorage.removeItem('campy_pantalla');
    supabase.auth.signOut().catch(() => {});
    estadosPedidosClienteRef.current = null;
    estadosPedidosVendedorRef.current = null;
    repartosDisponiblesIdsRef.current = null;
    estadoSolicitudVendedorRef.current = undefined;
    rolVendedorRef.current = undefined;
    rolRepartidorRef.current = undefined;
    solicitudesModeradorRef.current = null;
    productosCatalogoIdsRef.current = null;
    misProductosIdsRef.current = null;
    setTokenAuth(null);
    setUsuarioActual(USUARIO_VACIO);
    setSolicitudVendedor(null);
    setPedidosPorCumplir([]);
    setPedidosParaVendedor([]);
    setPedidosRepartidor([]);
    setCarritoGlobal({});
    setPantallaActual('login');
  }, []);

  useEffect(() => {
    if (!tokenAuth) {
      consultaPedidosRef.current = null;
      return;
    }

    let vigente = true;
    let consultando = false;
    let consultaPendiente = false;
    let primeraConsulta = true;

    const consultar = async (manual = false) => {
      if (!vigente) return;
      if (consultando) {
        if (manual) consultaPendiente = true;
        return;
      }

      consultando = true;
      if (primeraConsulta && ['pedidos', 'vendedor'].includes(pantallaActual)) {
        setCargandoPedidos(true);
      } else if (manual) {
        setActualizandoPedidos(true);
      }

      try {
        // 1. Pedidos como cliente
        const respCliente = await fetch(`${API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${tokenAuth}` },
          cache: 'no-store'
        });
        const datosCliente = await respCliente.json().catch(() => ({}));
        if (respCliente.ok && Array.isArray(datosCliente) && vigente) {
          if (estadosPedidosClienteRef.current !== null) {
            datosCliente.forEach((pedido) => {
              const idStr = String(pedido.id);
              const estadoPrevio = estadosPedidosClienteRef.current.get(idStr);
              if (estadoPrevio && estadoPrevio !== pedido.estado) {
                let detalle = `Tu pedido #${pedido.id} cambió a estado: ${pedido.estado}.`;
                if (pedido.estado === 'En preparación') {
                  detalle = `El vendedor aceptó tu pedido #${pedido.id} y ya lo está preparando.`;
                } else if (pedido.estado === 'En camino') {
                  detalle = `¡Tu pedido #${pedido.id} va en camino hacia ${pedido.puntoEntrega || 'tu punto de entrega'}!`;
                } else if (pedido.estado === 'En el punto de entrega') {
                  detalle = `¡Tu pedido #${pedido.id} ya llegó a ${pedido.puntoEntrega || 'el punto de entrega'}!`;
                } else if (pedido.estado === 'Entregado') {
                  detalle = `Tu pedido #${pedido.id} fue marcado como entregado. ¡Gracias por tu compra!`;
                } else if (pedido.estado === 'Cancelado') {
                  detalle = `Tu pedido #${pedido.id} fue cancelado.`;
                }
                mostrarNotificacion('info', `Pedido #${pedido.id}: ${pedido.estado}`, detalle);
              }
            });
          }
          estadosPedidosClienteRef.current = new Map(
            datosCliente.map((p) => [String(p.id), p.estado])
          );
          setPedidosPorCumplir(datosCliente);
          if (pantallaActual === 'pedidos') setErrorPedidos('');
        } else if (!respCliente.ok && pantallaActual === 'pedidos' && vigente) {
          setErrorPedidos(datosCliente.mensaje || 'No se pudieron consultar los pedidos.');
        }

        // 2. Pedidos como vendedor
        if (usuarioActual.esVendedor) {
          const respVendedor = await fetch(`${API_URL}/api/pedidos/vendedor`, {
            headers: { Authorization: `Bearer ${tokenAuth}` },
            cache: 'no-store'
          });
          const datosVendedor = await respVendedor.json().catch(() => ({}));
          if (respVendedor.ok && Array.isArray(datosVendedor) && vigente) {
            if (estadosPedidosVendedorRef.current !== null) {
              datosVendedor.forEach((pedido) => {
                const idStr = String(pedido.id);
                const claveEstadoActual = `${pedido.estado || ''}|${pedido.estadoReparto || ''}|${pedido.repartidorAsignado || ''}`;
                if (!estadosPedidosVendedorRef.current.has(idStr)) {
                  mostrarNotificacion(
                    'exito',
                    `¡Nueva venta recibida! (Pedido #${pedido.id})`,
                    `${pedido.compradorNombre || 'Un comprador'} realizó un pedido por $${pedido.total} en ${pedido.puntoEntrega || 'el campus'}.`
                  );
                } else {
                  const clavePrevia = estadosPedidosVendedorRef.current.get(idStr);
                  if (clavePrevia && clavePrevia !== claveEstadoActual) {
                    const [estadoAnt, repartoAnt, asigAnt] = clavePrevia.split('|');
                    if (!asigAnt && pedido.repartidorAsignado) {
                      mostrarNotificacion(
                        'info',
                        `Repartidor asignado (Pedido #${pedido.id})`,
                        `${pedido.repartidorAsignado} aceptó llevar tu pedido.`
                      );
                    } else if (repartoAnt !== (pedido.estadoReparto || '') && pedido.estadoReparto) {
                      mostrarNotificacion(
                        'info',
                        `Reparto #${pedido.id}: ${pedido.estadoReparto}`,
                        `El estado de reparto del pedido #${pedido.id} cambió a: ${pedido.estadoReparto}.`
                      );
                    } else if (estadoAnt !== (pedido.estado || '')) {
                      mostrarNotificacion(
                        'info',
                        `Venta #${pedido.id} actualizada`,
                        `El pedido de ${pedido.compradorNombre || 'tu cliente'} cambió a: ${pedido.estado}.`
                      );
                    }
                  }
                }
              });
            }
            estadosPedidosVendedorRef.current = new Map(
              datosVendedor.map((p) => [
                String(p.id),
                `${p.estado || ''}|${p.estadoReparto || ''}|${p.repartidorAsignado || ''}`
              ])
            );
            setPedidosParaVendedor(datosVendedor);
            if (pantallaActual === 'vendedor') setErrorPedidos('');
          } else if (!respVendedor.ok && pantallaActual === 'vendedor' && vigente) {
            setErrorPedidos(datosVendedor.mensaje || 'No se pudieron consultar los pedidos.');
          }
        }
      } catch (error) {
        if (vigente && ['pedidos', 'vendedor'].includes(pantallaActual)) {
          setErrorPedidos(error.message || 'No se pudieron consultar los pedidos.');
        }
      } finally {
        if (vigente) {
          setCargandoPedidos(false);
          setActualizandoPedidos(false);
        }
        primeraConsulta = false;
        consultando = false;
        if (consultaPendiente && vigente) {
          consultaPendiente = false;
          consultar(true);
        }
      }
    };

    consultaPedidosRef.current = consultar;
    consultar();
    const intervalo = setInterval(() => consultar(), 8000);
    const alVolver = () => {
      if (document.visibilityState === 'visible') consultar();
    };
    const alEnfocar = () => consultar();

    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', alEnfocar);

    return () => {
      vigente = false;
      consultaPedidosRef.current = null;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', alEnfocar);
    };
  }, [pantallaActual, tokenAuth, usuarioActual.esVendedor, mostrarNotificacion]);


  useEffect(() => {
    if (!tokenAuth || (!usuarioActual.esRepartidor && pantallaActual !== 'repartidor')) return;
    let activo = true;
    let consultando = false;
    const consultar = async () => {
      if (!activo || consultando) return;
      consultando = true;
      try {
        const respuesta = await fetch(`${API_URL}/api/repartos`, {
          headers: { Authorization: `Bearer ${tokenAuth}` },
          cache: 'no-store'
        });
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron consultar los repartos.');
        if (!Array.isArray(datos)) throw new Error('Respuesta de repartos inválida.');
        if (activo) {
          const disponibles = datos.filter(
            (p) => p.requiereRepartidor && !p.repartidorAsignado && p.estado !== 'Cancelado' && p.estado !== 'Entregado'
          );
          if (repartosDisponiblesIdsRef.current !== null) {
            disponibles.forEach((ped) => {
              const idStr = String(ped.id);
              if (!repartosDisponiblesIdsRef.current.has(idStr)) {
                mostrarNotificacion(
                  'info',
                  `¡Nuevo pedido para repartir! (#${ped.id})`,
                  `Recoger en ${ped.lugarRecoleccion || 'campus'} y entregar en ${ped.puntoEntrega || 'campus'}.`
                );
              }
            });
          }
          repartosDisponiblesIdsRef.current = new Set(disponibles.map((p) => String(p.id)));
          setPedidosRepartidor(datos);
          setErrorRepartos('');
        }
      } catch (error) {
        if (activo) setErrorRepartos(error.message || 'No se pudieron consultar los repartos.');
      } finally {
        consultando = false;
      }
    };
    consultar();
    const intervalo = setInterval(consultar, 8000);
    const alVolver = () => { if (document.visibilityState === 'visible') consultar(); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('focus', consultar);
    return () => {
      activo = false;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('focus', consultar);
    };
  }, [pantallaActual, tokenAuth, usuarioActual.esRepartidor, mostrarNotificacion]);

  const solicitarRepartoAPI = async (ruta, metodo = 'GET', cuerpo = null) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Vuelve a iniciar sesión.');
    const respuesta = await fetch(`${API_URL}/api/repartos${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      ...(cuerpo !== null ? { body: JSON.stringify(cuerpo) } : {})
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo procesar el reparto.');
    return datos;
  };

  const refrescarRepartos = async () => {
    const datos = await solicitarRepartoAPI('/');
    if (!Array.isArray(datos)) throw new Error('Respuesta de repartos inválida.');
    setPedidosRepartidor(datos);
    setErrorRepartos('');
  };

  const procesarCompra = async (itemsComprados, datosEntrega) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Tu sesión no tiene token. Cierra sesión y vuelve a ingresar.');

    const respuesta = await fetch(`${API_URL}/api/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        items: itemsComprados.map((item) => ({
          id_producto: Number(item.id_producto || item.id),
          cantidad: Number(item.cantidad)
        })),
        puntoEntrega: datosEntrega.puntoEntrega,
        horarioEntrega: datosEntrega.horarioEntrega,
        metodoPago: datosEntrega.metodoPago,
        idTarjeta: datosEntrega.idTarjeta || null
      })
    });
    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo realizar el pedido.');

    setCarritoGlobal({});
    setPantallaActual('pedidos');
    refrescarPedidos();
    return resultado;
  };

  // El rol Vendedor solo se activa cuando un moderador aprueba la solicitud.
  const registrarComoVendedor = async (datosVendedor) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Inicia sesión para solicitar el rol de vendedor.');
    const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(datosVendedor)
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo enviar la solicitud.');
    estadoSolicitudVendedorRef.current = datos.solicitud?.estado || 'Pendiente';
    setSolicitudVendedor(datos.solicitud);
    return datos;
  };

  useEffect(() => {
    if (!tokenAuth) return;
    let vigente = true;
    const consultar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor/mia`, {
          headers: { Authorization: `Bearer ${tokenAuth}` },
          cache: 'no-store'
        });
        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (!vigente) return;

          const nuevoEstadoSol = datos.solicitud?.estado || null;
          if (
            estadoSolicitudVendedorRef.current !== undefined &&
            estadoSolicitudVendedorRef.current !== nuevoEstadoSol &&
            nuevoEstadoSol
          ) {
            if (nuevoEstadoSol === 'Aprobada') {
              mostrarNotificacion(
                'exito',
                '¡Solicitud de Vendedor Aprobada!',
                'Tu cuenta de vendedor en Campy fue aprobada. Ya puedes publicar tus productos.'
              );
            } else if (nuevoEstadoSol === 'Rechazada') {
              mostrarNotificacion(
                'aviso',
                'Solicitud de Vendedor Revisada',
                `Tu solicitud para vender no fue aprobada.${datos.solicitud?.comentario_revision ? ' Motivo: ' + datos.solicitud.comentario_revision : ''}`
              );
            }
          }
          estadoSolicitudVendedorRef.current = nuevoEstadoSol;

          if (rolVendedorRef.current === true && datos.esVendedor === false) {
            mostrarNotificacion(
              'aviso',
              'Cambio en tu cuenta de vendedor',
              'Tu rol de vendedor fue desactivado por un moderador.'
            );
          }
          if (rolRepartidorRef.current === false && datos.esRepartidor === true) {
            mostrarNotificacion(
              'exito',
              '¡Solicitud de Repartidor Aprobada!',
              'Tu cuenta de repartidor en Campy fue activada.'
            );
          }
          rolVendedorRef.current = datos.esVendedor === true;
          rolRepartidorRef.current = datos.esRepartidor === true;

          setSolicitudVendedor(datos.solicitud);
          setUsuarioActual((prev) => ({
            ...prev,
            esVendedor: datos.esVendedor === true,
            esRepartidor: datos.esRepartidor === true,
            esModerador: datos.esModerador === true
          }));

          if (datos.esModerador === true) {
            const respPend = await fetch(`${API_URL}/api/solicitudes-vendedor/pendientes`, {
              headers: { Authorization: `Bearer ${tokenAuth}` },
              cache: 'no-store'
            });
            if (respPend.ok) {
              const pendientes = await respPend.json().catch(() => []);
              if (Array.isArray(pendientes) && vigente) {
                if (solicitudesModeradorRef.current !== null) {
                  pendientes.forEach((sol) => {
                    const idSol = String(sol.id_solicitud);
                    if (!solicitudesModeradorRef.current.has(idSol)) {
                      mostrarNotificacion(
                        'info',
                        'Nueva solicitud de vendedor',
                        `${sol.nombre_tienda || sol.nombre_usuario || 'Un estudiante'} envió una solicitud para vender en Campy.`
                      );
                    }
                  });
                }
                solicitudesModeradorRef.current = new Set(
                  pendientes.map((s) => String(s.id_solicitud))
                );
              }
            }
          }
        }
      } catch (_) { }

      if (vigente) {
        setRecargaCatalogo((n) => n + 1);
      }
    };
    consultar();
    const intervalo = setInterval(consultar, 12000);
    return () => { vigente = false; clearInterval(intervalo); };
  }, [tokenAuth, mostrarNotificacion]);

  const registrarComoRepartidor = async (datosRepartidor) => {
    if (!tokenAuth) throw new Error('Inicia sesión para solicitar el rol.');
    const respuesta = await fetch(`${API_URL}/api/solicitudes-repartidor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAuth}` },
      body: JSON.stringify(datosRepartidor)
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo registrar la solicitud.');
    return datos;
  };

  const guardarProductoAPI = async (ruta, metodo, datos) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Vuelve a iniciar sesión.');
    const respuesta = await fetch(`${API_URL}/api/productos${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(datos)
    });
    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo guardar el producto.');
    if (metodo === 'POST') {
      const idCreado = resultado?.producto?.id_producto || resultado?.id_producto;
      if (idCreado) {
        if (misProductosIdsRef.current) misProductosIdsRef.current.set(String(idCreado), datos.nombre);
        if (productosCatalogoIdsRef.current) productosCatalogoIdsRef.current.add(String(idCreado));
      }
    }
    setRecargaCatalogo(n => n + 1);
    return resultado;
  };

  const agregarNuevoProducto = (nuevoProd) => guardarProductoAPI('', 'POST', {
    nombre: nuevoProd.nombre,
    descripcion: nuevoProd.definicion || nuevoProd.comentario || '',
    precio: nuevoProd.precio,
    categoria: nuevoProd.categoria,
    imagen_url: nuevoProd.imagen_url || '',
    claveCreacion: nuevoProd.claveCreacion
  });

  const editarProducto = (id, cambios) => guardarProductoAPI(`/${id}`, 'PATCH', {
    nombre: cambios.nombre,
    descripcion: cambios.definicion || cambios.comentario || '',
    precio: cambios.precio,
    categoria: cambios.categoria,
    imagen_url: cambios.imagen_url || ''
  });

  const eliminarProducto = async (idProducto) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    if (misProductosIdsRef.current) {
      misProductosIdsRef.current.delete(String(idProducto));
    }
    const respuesta = await fetch(`${API_URL}/api/productos/${idProducto}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo retirar el producto.');
    setProductosCatalogo(prev => prev.filter(prod => String(prod.id) !== String(idProducto)));
    setCarritoGlobal(prev => {
      const copia = { ...prev };
      delete copia[idProducto];
      return copia;
    });
    setRecargaCatalogo(n => n + 1);
    return datos;
  };

  const guardarEstadoEnSupabase = async (pedidoId, estado) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Tu sesión ha caducado. Inicia sesión nuevamente.');
    const respuesta = await fetch(`${API_URL}/api/pedidos/${pedidoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado })
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo actualizar el estado del pedido.');
    return datos.pedido;
  };

  // Primero confirmar en Supabase; actualizar la pantalla solo si la BD respondió correctamente.
  const configurarAceptacionPedido = async (pedidoId, config) => {
    const datos = await solicitarRepartoAPI(`/pedido/${pedidoId}/aceptar`, 'POST', config);
    if (estadosPedidosVendedorRef.current) {
      const clave = `${datos.pedido.estado || ''}|${datos.estadoReparto || ''}|`;
      estadosPedidosVendedorRef.current.set(String(pedidoId), clave);
    }
    setPedidosParaVendedor((prev) => prev.map((p) =>
      p.id === pedidoId
        ? { ...p, ...config, estado: datos.pedido.estado,
            estadoReparto: datos.estadoReparto || null,
            requiereRepartidor: datos.requiereRepartidor }
        : p
    ));
    refrescarPedidos();
    return datos;
  };

  const cambiarEstadoPedidoVendedor = async (pedidoId, nuevoEstado, notaCancelacion = '') => {
    const pedidoLocal = pedidosParaVendedor.find(p => String(p.id) === String(pedidoId));
    if (pedidoLocal?.requiereRepartidor && ['Listo', 'Repartidor llegó'].includes(nuevoEstado)) {
      const accion = nuevoEstado === 'Listo' ? 'listo' : 'repartidor_llego';
      const resultado = await solicitarRepartoAPI(`/${pedidoId}/avanzar`, 'PATCH', { accion });
      if (estadosPedidosVendedorRef.current) {
        estadosPedidosVendedorRef.current.set(
          String(pedidoId),
          `${pedidoLocal.estado || ''}|${resultado.pedido.estadoReparto || ''}|${pedidoLocal.repartidorAsignado || ''}`
        );
      }
      setPedidosParaVendedor(prev => prev.map(p => String(p.id) === String(pedidoId)
        ? { ...p, estadoReparto: resultado.pedido.estadoReparto }
        : p
      ));
      refrescarPedidos();
      return resultado.pedido;
    }
    const pedidoGuardado = await guardarEstadoEnSupabase(pedidoId, nuevoEstado);
    if (estadosPedidosVendedorRef.current) {
      estadosPedidosVendedorRef.current.set(
        String(pedidoId),
        `${pedidoGuardado.estado || ''}|${pedidoLocal?.estadoReparto || ''}|${pedidoLocal?.repartidorAsignado || ''}`
      );
    }
    setPedidosParaVendedor((prev) =>
      prev.map((p) => p.id === pedidoId
        ? { ...p, estado: pedidoGuardado.estado, notaCancelacion: notaCancelacion || p.notaCancelacion }
        : p)
    );
    setPedidosPorCumplir((prev) =>
      prev.map((p) => p.id === pedidoId ? { ...p, estado: pedidoGuardado.estado } : p)
    );
    refrescarPedidos();
  };

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    const acciones = {
      'Recibí pedido': 'recibido',
      'En camino': 'en_camino',
      'En el punto de entrega': 'llegue',
      'Entregado': 'entregado'
    };
    if (!acciones[nuevoEstado]) throw new Error('Acción de reparto inválida.');
    const resultado = await solicitarRepartoAPI(`/${pedidoId}/avanzar`, 'PATCH', {
      accion: acciones[nuevoEstado]
    });
    await refrescarRepartos();
    return resultado;
  };

  const liberarReparto = async (pedidoId, motivo) => {
    const resultado = await solicitarRepartoAPI(`/${pedidoId}/liberar`, 'POST', { motivo });
    refrescarPedidos();
    return resultado;
  };

  const confirmarRecepcionPedido = async (pedidoId) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Tu sesión ha caducado. Inicia sesión nuevamente.');
    const respuesta = await fetch(`${API_URL}/api/pedidos/${pedidoId}/confirmar-recepcion`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo confirmar la recepción del pedido.');
    if (estadosPedidosClienteRef.current) {
      estadosPedidosClienteRef.current.set(String(pedidoId), datos.pedido.estado);
    }
    setPedidosPorCumplir((prev) =>
      prev.map((p) => p.id === pedidoId ? { ...p, estado: datos.pedido.estado } : p)
    );
    refrescarPedidos();
    return datos.pedido;
  };

  const cancelarEntregaRepartidor = async (pedidoId, motivo) => {
    const resultado = await solicitarRepartoAPI(`/${pedidoId}/cancelar-asignacion`, 'POST', { motivo });
    await refrescarRepartos();
    return resultado;
  };

  const tomarPedidoRepartidor = async (pedidoId) => {
    const resultado = await solicitarRepartoAPI(`/${pedidoId}/aceptar`, 'PATCH');
    await refrescarRepartos();
    return resultado;
  };

  return (
    <>
      <style>{ESTILOS_NOTIFICACIONES}</style>
      <div className="campy-toast-contenedor" aria-label="Notificaciones de CAMPY">
        {notificaciones.map((notificacion) => (
          <div
            key={notificacion.id}
            className={`campy-toast campy-toast-${notificacion.tipo}`}
            role={notificacion.tipo === 'error' ? 'alert' : 'status'}
          >
            <span className="campy-toast-icono" aria-hidden="true">
              <IconoNotificacion tipo={notificacion.tipo} />
            </span>
            <div className="campy-toast-contenido">
              <p className="campy-toast-titulo">{notificacion.titulo}</p>
              <p className="campy-toast-mensaje">{notificacion.mensaje}</p>
              <span className="campy-toast-momento">CAMPY · Ahora</span>
            </div>
            <button
              type="button"
              className="campy-toast-cerrar"
              aria-label="Cerrar notificación"
              onClick={() => cerrarNotificacion(notificacion.id)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
            <span className="campy-toast-barra" aria-hidden="true" />
          </div>
        ))}
      </div>
      {pantallaActual === 'login' && (
        <CampyLogin alIngresar={manejarIngreso} irARegistro={() => setPantallaActual('registro')} registroExitoso={registroExitoso} />
      )}
      {pantallaActual === 'registro' && (
        <CampyRegistro
          volverAlLogin={() => setPantallaActual('login')}
          alRegistrar={() => { setRegistroExitoso(true); setPantallaActual('login'); }}
        />
      )}

      {pantallaActual === 'home' && (
        <HomeComprador
        usuarioId={usuarioActual.id_usuario || usuarioActual.correo}
          productos={productosCatalogo}
          cargandoProductos={cargandoProductos}
          errorProductos={errorProductos}
          recargarProductos={() => setRecargaCatalogo((n) => n + 1)}
          carrito={carritoGlobal}
          setCarrito={setCarritoGlobal}
          irAPedidos={conNotificacion(procesarCompra, 'Pedido realizado', 'Tu pedido fue enviado correctamente al vendedor.')}
          irAMisPedidos={() => setPantallaActual('pedidos')}
          irAPerfil={() => setPantallaActual('perfil')}
        />
      )}

      {pantallaActual === 'pedidos' && (
        <MisPedidos
          usuarioId={usuarioActual.id_usuario || usuarioActual.correo}
          token={tokenAuth}
          pedidosVendedor={pedidosPorCumplir}
          cargandoPedidos={cargandoPedidos}
          errorPedidos={errorPedidos}
          actualizandoPedidos={actualizandoPedidos}
          refrescarPedidos={refrescarPedidos}
          cambiarEstadoPedido={conNotificacion(confirmarRecepcionPedido, 'Recepción confirmada', 'Tu pedido se marcó como entregado.')}
          onCalificacionGuardada={() => setRecargaCatalogo(n => n + 1)}
          irAInicio={() => setPantallaActual('home')}
          irAPerfil={() => setPantallaActual('perfil')}
        />
      )}

      {pantallaActual === 'perfil' && (
        <MiPerfil
          usuario={usuarioActual}
          setUsuario={setUsuarioActual}
          registrarComoVendedor={conNotificacion(registrarComoVendedor, 'Solicitud enviada', 'Tu solicitud de vendedor se registró correctamente.')}
          solicitudVendedor={solicitudVendedor}
          irAPanelModerador={() => setPantallaActual('moderador')}
          registrarComoRepartidor={conNotificacion(registrarComoRepartidor, 'Solicitud enviada', 'Tu solicitud de repartidor se registró correctamente.')}
          token={tokenAuth}
          irAPanelVendedor={() => setPantallaActual('vendedor')}
          irAPanelRepartidor={() => setPantallaActual('repartidor')}
          irAInicio={() => setPantallaActual('home')}
          irAPedidos={() => setPantallaActual('pedidos')}
          cerrarSesion={cerrarSesionUsuario}
        />
      )}

      {pantallaActual === 'moderador' && usuarioActual.esModerador && (
        <PanelModerador
          token={tokenAuth}
          usuario={usuarioActual}
          productos={productosCatalogo}
          cargandoProductos={cargandoProductos}
          errorProductos={errorProductos}
          eliminarPublicacion={conNotificacion(eliminarProducto, 'Publicación retirada', 'La publicación fue retirada del catálogo correctamente.')}
          alCambiarCatalogo={() => setRecargaCatalogo(n => n + 1)}
          irAPerfil={() => setPantallaActual('perfil')}
          irAPanelVendedor={() => setPantallaActual('vendedor')}
          irAInicio={() => setPantallaActual('home')}
          cerrarSesion={cerrarSesionUsuario}
        />
      )}


      {pantallaActual === 'vendedor' && usuarioActual.esVendedor && (
        <PanelVendedor
          usuario={usuarioActual}
          actualizarDatosVendedor={(nuevosDatos) =>
            setUsuarioActual((prev) => ({ ...prev, datosVendedor: nuevosDatos }))
          }
          misProductos={productosCatalogo.filter(
            (p) => Number(p.id_vendedor) === Number(usuarioActual.id_usuario)
          )}
          agregarNuevoProducto={conNotificacion(agregarNuevoProducto, 'Producto agregado', 'Tu producto ya se encuentra registrado.')}
          editarProducto={conNotificacion(editarProducto, 'Producto actualizado', 'Los cambios se guardaron correctamente.')}
          eliminarProducto={conNotificacion(eliminarProducto, 'Producto retirado', 'El producto fue retirado correctamente.')}
          pedidosVendedor={pedidosParaVendedor}
          cargandoPedidos={cargandoPedidos}
          errorPedidos={errorPedidos}
          actualizandoPedidos={actualizandoPedidos}
          refrescarPedidos={refrescarPedidos}
          configurarAceptacionPedido={conNotificacion(configurarAceptacionPedido, 'Pedido aceptado', 'La configuración de entrega se guardó correctamente.')}
          cambiarEstadoPedidoVendedor={conNotificacion(cambiarEstadoPedidoVendedor, 'Estado del pedido actualizado', 'El cambio se guardó correctamente y ya puedes consultar el estado del pedido.')}
          liberarReparto={conNotificacion(liberarReparto, 'Reparto actualizado', 'Se registró el cambio en el reparto.')}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={cerrarSesionUsuario}
        />
      )}

      {pantallaActual === 'repartidor' && usuarioActual.esRepartidor && (
        <PanelRepartidor
          usuario={usuarioActual}
          pedidos={pedidosRepartidor}
          errorPedidos={errorRepartos}
          refrescarPedidos={refrescarRepartos}
          cancelarEntregaRepartidor={conNotificacion(cancelarEntregaRepartidor, 'Entrega liberada', 'El pedido volvió a estar disponible para otros repartidores.')}
          tomarPedidoRepartidor={conNotificacion(tomarPedidoRepartidor, 'Pedido asignado', 'Has aceptado el reparto correctamente.')}
          cambiarEstadoPedido={conNotificacion(cambiarEstadoPedido, 'Reparto actualizado', 'El avance de la entrega se registró correctamente.')}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={cerrarSesionUsuario}
        />
      )}
    </>
  );
}

export default App;
