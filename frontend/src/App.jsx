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

function App() {
  const [pantallaActual, setPantallaActual] = useState('login');
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [tokenAuth, setTokenAuth] = useState(localStorage.getItem('campy_token') || null);
  const [solicitudVendedor, setSolicitudVendedor] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState({
    nombre: '',
    correo: '',
    carrera: '',
    esVendedor: false,
    datosVendedor: null,
    esRepartidor: false,
    datosRepartidor: null,
    esModerador: false
  });

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        cargarUsuarioOAuth(session.user);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        cargarUsuarioOAuth(session.user);
      } else if (event === 'SIGNED_OUT') {
        setPantallaActual('login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const cargarUsuarioOAuth = (user) => {
    const nombre = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
    const correo = user.email;
    manejarIngreso(
      {
        nombre,
        correo,
        carrera: 'Ing. Sistemas Computacionales'
      },
      user.id
    );
  };

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
          setProductosCatalogo(datos.map((producto) => ({
            ...producto,
            id: producto.id_producto,
            precio: Number(producto.precio),
            categoria: producto.categoria || 'Sin categoría',
            tienda: producto.nombre_vendedor ? `Vende: ${producto.nombre_vendedor}` : 'Vendedor no disponible',
            ubicacion: 'Por acordar con el vendedor',
          })));
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
  }, [recargaCatalogo]);

  const manejarIngreso = (datosUsuario, token = null) => {
    if (token) {
      localStorage.setItem('campy_token', token);
      setTokenAuth(token);
    }
    if (datosUsuario) {
      setUsuarioActual({
        nombre: datosUsuario.nombre || '',
        correo: datosUsuario.correo || '',
        carrera: datosUsuario.carrera || '',
        id_usuario: datosUsuario.id_usuario,
        esVendedor: datosUsuario.esVendedor === true,
        datosVendedor: null,
        esRepartidor: datosUsuario.esRepartidor === true,
        esModerador: datosUsuario.esModerador === true,
        datosRepartidor: null
      });
    }
    setSolicitudVendedor(null);
    setPantallaActual(
      datosUsuario?.esModerador === true
        ? 'moderador'
        : datosUsuario?.esVendedor === true
          ? 'vendedor'
          : datosUsuario?.esRepartidor === true
            ? 'repartidor'
            : 'home'
    );
    setRecargaCatalogo((n) => n + 1);
  };

  useEffect(() => {
    if (!tokenAuth || !['pedidos', 'vendedor'].includes(pantallaActual)) {
      consultaPedidosRef.current = null;
      return;
    }

    let vigente = true;
    let consultando = false;
    let consultaPendiente = false;
    let primeraConsulta = true;
    const esVendedor = pantallaActual === 'vendedor';
    const ruta = esVendedor ? '/api/pedidos/vendedor' : '/api/pedidos';

    const consultar = async (manual = false) => {
      if (!vigente) return;
      if (consultando) {
        if (manual) consultaPendiente = true;
        return;
      }
      if (!manual && document.visibilityState === 'hidden') return;

      consultando = true;
      if (primeraConsulta) setCargandoPedidos(true);
      else if (manual) setActualizandoPedidos(true);

      try {
        const respuesta = await fetch(`${API_URL}${ruta}`, {
          headers: { Authorization: `Bearer ${tokenAuth}` },
          cache: 'no-store'
        });
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron consultar los pedidos.');
        if (!Array.isArray(datos)) throw new Error('La respuesta de pedidos no es válida.');

        if (vigente) {
          if (esVendedor) {
            setPedidosParaVendedor(datos);
          } else {
            setPedidosPorCumplir(datos);
          }
          setErrorPedidos('');
        }
      } catch (error) {
        if (vigente) setErrorPedidos(error.message || 'No se pudieron consultar los pedidos.');
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
  }, [pantallaActual, tokenAuth]);


  useEffect(() => {
    if (pantallaActual !== 'repartidor' || !tokenAuth) return;
    let activo = true;
    let consultando = false;
    const consultar = async () => {
      if (!activo || consultando || document.visibilityState === 'hidden') return;
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
  }, [pantallaActual, tokenAuth]);

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
    setSolicitudVendedor(datos.solicitud);
    return datos;
  };

  useEffect(() => {
    if (pantallaActual !== 'perfil' || !tokenAuth) return;
    let vigente = true;
    const consultar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor/mia`, {
          headers: { Authorization: `Bearer ${tokenAuth}` }
        });
        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        if (!vigente) return;
        setSolicitudVendedor(datos.solicitud);
        setUsuarioActual((prev) => ({
          ...prev,
          esVendedor: datos.esVendedor === true,
          esRepartidor: datos.esRepartidor === true,
          esModerador: datos.esModerador === true
        }));
      } catch (_) { }
    };
    consultar();
    const intervalo = setInterval(consultar, 15000);
    return () => { vigente = false; clearInterval(intervalo); };
  }, [pantallaActual, tokenAuth]);

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
      setPedidosParaVendedor(prev => prev.map(p => String(p.id) === String(pedidoId)
        ? { ...p, estadoReparto: resultado.pedido.estadoReparto }
        : p
      ));
      refrescarPedidos();
      return resultado.pedido;
    }
    const pedidoGuardado = await guardarEstadoEnSupabase(pedidoId, nuevoEstado);
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
    setPedidosPorCumplir((prev) =>
      prev.map((p) => p.id === pedidoId ? { ...p, estado: datos.pedido.estado } : p)
    );
    refrescarPedidos();
    return datos.pedido;
  };

  const tomarPedidoRepartidor = async (pedidoId) => {
    const resultado = await solicitarRepartoAPI(`/${pedidoId}/aceptar`, 'PATCH');
    await refrescarRepartos();
    return resultado;
  };

  return (
    <>
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
          irAPedidos={procesarCompra}
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
          cambiarEstadoPedido={confirmarRecepcionPedido}
          onCalificacionGuardada={() => setRecargaCatalogo(n => n + 1)}
          irAInicio={() => setPantallaActual('home')}
          irAPerfil={() => setPantallaActual('perfil')}
        />
      )}

      {pantallaActual === 'perfil' && (
        <MiPerfil
          usuario={usuarioActual}
          setUsuario={setUsuarioActual}
          registrarComoVendedor={registrarComoVendedor}
          solicitudVendedor={solicitudVendedor}
          irAPanelModerador={() => setPantallaActual('moderador')}
          registrarComoRepartidor={registrarComoRepartidor}
          token={tokenAuth}
          irAPanelVendedor={() => setPantallaActual('vendedor')}
          irAPanelRepartidor={() => setPantallaActual('repartidor')}
          irAInicio={() => setPantallaActual('home')}
          irAPedidos={() => setPantallaActual('pedidos')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setTokenAuth(null);
            setSolicitudVendedor(null);
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
            setCarritoGlobal({});
            setPantallaActual('login');
          }}
        />
      )}

      {pantallaActual === 'moderador' && usuarioActual.esModerador && (
        <PanelModerador
          token={tokenAuth}
          usuario={usuarioActual}
          productos={productosCatalogo}
          cargandoProductos={cargandoProductos}
          errorProductos={errorProductos}
          eliminarPublicacion={eliminarProducto}
          alCambiarCatalogo={() => setRecargaCatalogo(n => n + 1)}
          irAPerfil={() => setPantallaActual('perfil')}
          irAPanelVendedor={() => setPantallaActual('vendedor')}
          irAInicio={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setTokenAuth(null);
            setSolicitudVendedor(null);
            setCarritoGlobal({});
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
            setPantallaActual('login');
          }}
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
          agregarNuevoProducto={agregarNuevoProducto}
          editarProducto={editarProducto}
          eliminarProducto={eliminarProducto}
          pedidosVendedor={pedidosParaVendedor}
          cargandoPedidos={cargandoPedidos}
          errorPedidos={errorPedidos}
          actualizandoPedidos={actualizandoPedidos}
          refrescarPedidos={refrescarPedidos}
          configurarAceptacionPedido={configurarAceptacionPedido}
          cambiarEstadoPedidoVendedor={cambiarEstadoPedidoVendedor}
          liberarReparto={liberarReparto}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setTokenAuth(null);
            setSolicitudVendedor(null);
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
            setCarritoGlobal({});
            setPantallaActual('login');
          }}
        />
      )}

      {pantallaActual === 'repartidor' && usuarioActual.esRepartidor && (
        <PanelRepartidor
          usuario={usuarioActual}
          pedidos={pedidosRepartidor}
          errorPedidos={errorRepartos}
          refrescarPedidos={refrescarRepartos}
          tomarPedidoRepartidor={tomarPedidoRepartidor}
          cambiarEstadoPedido={cambiarEstadoPedido}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setTokenAuth(null);
            setSolicitudVendedor(null);
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
            setCarritoGlobal({});
            setPantallaActual('login');
          }}
        />
      )}
    </>
  );
}

export default App;