import React, { useState, useRef, useEffect } from 'react';
import ComentarioEntrega from './ComentarioEntrega.jsx';
import { EDIFICIOS_ITO } from './ubicacionesITO.js';
import logoCampy from './assets/logo.png';

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const BLOQUES_HORA = Array.from({length:11},(_,i)=>`${String(i+7).padStart(2,'0')}-${String(i+8).padStart(2,'0')}`);

const AvisoPanelCampy = ({ titulo, mensaje, tipo = 'error', onCerrar, className = '' }) => {
  const estilos = {
    error: { contenedor: 'border-red-100', icono: 'bg-red-50 text-red-600', simbolo: '!', etiqueta: 'text-red-800' },
    info: { contenedor: 'border-blue-100', icono: 'bg-blue-50 text-blue-700', simbolo: 'i', etiqueta: 'text-blue-900' },
    advertencia: { contenedor: 'border-amber-100', icono: 'bg-amber-50 text-amber-700', simbolo: '!', etiqueta: 'text-amber-900' },
  };
  const estilo = estilos[tipo] || estilos.error;
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`campy-aviso-panel flex items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-sm ${estilo.contenedor} ${className}`}>
      <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ${estilo.icono}`}>
        {estilo.simbolo}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-black ${estilo.etiqueta}`}>{titulo}</p>
        <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">{mensaje}</p>
      </div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" title="Cerrar aviso"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">×</button>
      )}
    </div>
  );
};

const REQUISITOS_PASSWORD_CUENTA = [
  { texto: 'Mínimo 8 caracteres', cumple: valor => valor.length >= 8 },
  { texto: 'Máximo 10 caracteres', cumple: valor => valor.length <= 10 },
  { texto: 'Una mayúscula', cumple: valor => /[A-Z]/.test(valor) },
  { texto: 'Una minúscula', cumple: valor => /[a-z]/.test(valor) },
  { texto: 'Un número', cumple: valor => /[0-9]/.test(valor) },
  { texto: 'Un símbolo (! @ # $ %)', cumple: valor => /[^A-Za-z0-9\s]/.test(valor) },
  { texto: 'Sin espacios', cumple: valor => !/\s/.test(valor) }
];

function OjoContrasenaCuenta({ visible }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 4.2 10 7-.2 1.1-1.4 3-3 4.4"/><path d="M6.6 6.6C4.4 8 2.6 10 2 12c.7 2.8 5 7 10 7 1.4 0 2.7-.3 4-.8"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const PanelVendedor = ({
  usuario,
  actualizarDatosVendedor,
  misProductos = [],
  agregarNuevoProducto,
  editarProducto,
  eliminarProducto,
  pedidosVendedor = [],
  cargandoPedidos = false,
  errorPedidos = '',
  actualizandoPedidos = false,
  refrescarPedidos = () => {},
  configurarAceptacionPedido,
  cambiarEstadoPedidoVendedor,
  liberarReparto,
  volverAModoCliente,
  cerrarSesion
}) => {
  const [tabActiva, setTabActiva] = useState('productos');
  const [avisosModeracion, setAvisosModeracion] = useState([]);
  const [errorProducto, setErrorProducto] = useState('');
  const [modalActivo, setModalActivo] = useState(null);
  const [passwordActualCuenta, setPasswordActualCuenta] = useState('');
  const [nuevaPasswordCuenta, setNuevaPasswordCuenta] = useState('');
  const [confirmarPasswordCuenta, setConfirmarPasswordCuenta] = useState('');
  const [verPasswordActualCuenta, setVerPasswordActualCuenta] = useState(false);
  const [verNuevaPasswordCuenta, setVerNuevaPasswordCuenta] = useState(false);
  const [verConfirmarPasswordCuenta, setVerConfirmarPasswordCuenta] = useState(false);
  const [errorPasswordCuenta, setErrorPasswordCuenta] = useState('');
  const [exitoPasswordCuenta, setExitoPasswordCuenta] = useState('');
  const [guardandoPasswordCuenta, setGuardandoPasswordCuenta] = useState(false);

  const abrirCambioPasswordCuenta = () => {
    setPasswordActualCuenta('');
    setNuevaPasswordCuenta('');
    setConfirmarPasswordCuenta('');
    setErrorPasswordCuenta('');
    setExitoPasswordCuenta('');
    setVerPasswordActualCuenta(false);
    setVerNuevaPasswordCuenta(false);
    setVerConfirmarPasswordCuenta(false);
    setModalActivo('cambiarPasswordCuenta');
  };

  const guardarCambioPasswordCuenta = async (evento) => {
    evento.preventDefault();
    setErrorPasswordCuenta('');
    setExitoPasswordCuenta('');
    if (!passwordActualCuenta) {
      setErrorPasswordCuenta('Ingresa tu contraseña actual.');
      return;
    }
    if (!REQUISITOS_PASSWORD_CUENTA.every(regla => regla.cumple(nuevaPasswordCuenta))) {
      setErrorPasswordCuenta('La contraseña nueva debe cumplir todos los requisitos.');
      return;
    }
    if (nuevaPasswordCuenta !== confirmarPasswordCuenta) {
      setErrorPasswordCuenta('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (passwordActualCuenta === nuevaPasswordCuenta) {
      setErrorPasswordCuenta('La contraseña nueva debe ser diferente de la actual.');
      return;
    }
    setGuardandoPasswordCuenta(true);
    try {
      const token = localStorage.getItem('campy_token');
      if (!token) throw new Error('Inicia sesión nuevamente para cambiar tu contraseña.');
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/cambiar-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          passwordActual: passwordActualCuenta,
          nuevaPassword: nuevaPasswordCuenta,
          confirmarPassword: confirmarPasswordCuenta
        })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo cambiar la contraseña.');
      setPasswordActualCuenta('');
      setNuevaPasswordCuenta('');
      setConfirmarPasswordCuenta('');
      setExitoPasswordCuenta(datos.mensaje || 'Contraseña actualizada correctamente.');
    } catch (error) {
      setErrorPasswordCuenta(error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardandoPasswordCuenta(false);
    }
  };


  // Estados para crear / editar producto
  const [productoEditandoId, setProductoEditandoId] = useState(null);
  const [prodNombre, setProdNombre] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodCategoria, setProdCategoria] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [prodDefinicion, setProdDefinicion] = useState('');
  const [prodComentario, setProdComentario] = useState('');
  const [prodImagen, setProdImagen] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [camaraCargando, setCamaraCargando] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');
  const videoCamaraRef = useRef(null);
  useEffect(() => {
    let activo=true;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/productos/categorias`)
      .then(async r => {if(!r.ok)throw new Error('Categorías no disponibles');return r.json();})
      .then(lista => {if(activo&&Array.isArray(lista)){
        setCategoriasDisponibles(lista);setProdCategoria(actual=>lista.includes(actual)?actual:(lista[0]||''));
      }}).catch(()=>{});
    return()=>{activo=false;};
  },[]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const guardandoProductoRef=useRef(false);
  const claveProductoRef=useRef('');
  // Estados para editar datos y horario del vendedor
  const [nombreVendedor, setNombreVendedor] = useState(usuario?.datosVendedor?.nombre || usuario?.nombre || '');
  const [giroVenta, setGiroVenta] = useState(usuario?.datosVendedor?.queVende || '');
  const [ubicacionBase, setUbicacionBase] = useState(usuario?.datosVendedor?.ubicacion || 'Edificio L');
  const [matrizHorario, setMatrizHorario] = useState(usuario?.datosVendedor?.matrizHorario || {});
  const [notaHorario, setNotaHorario] = useState(usuario?.datosVendedor?.notaHorario || '');

  // Estados para el Panel de Aceptar / Declinar Pedido y elegir si necesita Repartidor
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modoEntrega, setModoEntrega] = useState('propio'); // 'propio' | 'repartidor'
  const [costoParaRepartidor, setCostoParaRepartidor] = useState('');
  const [dondeRecogeRepartidor, setDondeRecogeRepartidor] = useState('');
  const [dondeDejaRepartidor, setDondeDejaRepartidor] = useState('');
  const [comisionRepartidor, setComisionRepartidor] = useState('10');

  // Estados para cancelar/declinar pedido con nota obligatoria
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [notaCancelacion, setNotaCancelacion] = useState('');
  const [errorCancelacion, setErrorCancelacion] = useState('');
  const [errorAccionPedido, setErrorAccionPedido] = useState('');

  const alternarCeldaHorario = (dia, bloque) => {
    const clave = `${dia}_${bloque}`;
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
    if (claves.length === 0) return 'Horario flexible en campus';
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

  const abrirModalNuevoProducto = () => {
    setProductoEditandoId(null);
    claveProductoRef.current=globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setProdNombre('');
    setProdPrecio('');
    setProdCategoria(categoriasDisponibles[0] || '');
    setProdDefinicion('');
    setProdComentario('');
    setProdImagen(null);
    setModalActivo('producto');
    setArchivoFoto(null);
  };

  const abrirModalEditarProducto = (prod) => {
    setProductoEditandoId(prod.id);
    claveProductoRef.current='';
    setProdNombre(prod.nombre);
    setProdPrecio(prod.precio);
    setProdCategoria(prod.categoria || 'Comida');
    setProdDefinicion(prod.descripcion || prod.definicion || '');
    setProdComentario(prod.comentario || '');
    setProdImagen(prod.imagen_url || prod.imagen || null);
    setArchivoFoto(null);
    setModalActivo('producto');
  };

  const manejarSeleccionFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    e.target.value = '';

    // Guardar el archivo real para subirlo después
    setArchivoFoto(archivo);

    // Generar vista previa inmediata en pantalla
    const reader = new FileReader();
    reader.onloadend = () => {
      setProdImagen(reader.result);
    };
    reader.readAsDataURL(archivo);
  };

  useEffect(() => {
    if (!camaraAbierta) return;

    let cancelado = false;
    let flujo = null;
    setCamaraCargando(true);
    setErrorCamara('');

    const iniciarCamara = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorCamara('La cámara requiere HTTPS o localhost y un navegador compatible.');
        setCamaraCargando(false);
        return;
      }
      try {
        flujo = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } }
        });
        if (cancelado) {
          flujo.getTracks().forEach((pista) => pista.stop());
          return;
        }
        if (videoCamaraRef.current) {
          videoCamaraRef.current.srcObject = flujo;
          await videoCamaraRef.current.play();
        }
      } catch (error) {
        if (!cancelado) {
          const mensaje = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
            ? 'No se autorizó la cámara. Permite el acceso desde los ajustes del navegador e inténtalo de nuevo.'
            : error.name === 'NotFoundError'
              ? 'No se encontró una cámara disponible en este dispositivo.'
              : 'No se pudo abrir la cámara. Revisa los permisos y que otra aplicación no la esté utilizando.';
          setErrorCamara(mensaje);
        }
      } finally {
        if (!cancelado) setCamaraCargando(false);
      }
    };

    iniciarCamara();
    return () => {
      cancelado = true;
      if (flujo) flujo.getTracks().forEach((pista) => pista.stop());
      if (videoCamaraRef.current) videoCamaraRef.current.srcObject = null;
    };
  }, [camaraAbierta]);

  useEffect(() => {
    if (modalActivo !== 'producto') setCamaraAbierta(false);
  }, [modalActivo]);

  const capturarFoto = () => {
    const video = videoCamaraRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setErrorCamara('La cámara todavía no está lista. Inténtalo de nuevo.');
      return;
    }
    const lienzo = document.createElement('canvas');
    lienzo.width = video.videoWidth;
    lienzo.height = video.videoHeight;
    const contexto = lienzo.getContext('2d');
    if (!contexto) {
      setErrorCamara('No se pudo preparar la fotografía.');
      return;
    }
    contexto.drawImage(video, 0, 0, lienzo.width, lienzo.height);
    lienzo.toBlob((imagen) => {
      if (!imagen) {
        setErrorCamara('No se pudo capturar la fotografía. Inténtalo otra vez.');
        return;
      }
      const archivo = new File([imagen], `producto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setArchivoFoto(archivo);
      const lector = new FileReader();
      lector.onloadend = () => setProdImagen(lector.result);
      lector.readAsDataURL(archivo);
      setCamaraAbierta(false);
      setErrorCamara('');
    }, 'image/jpeg', 0.9);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodPrecio || !prodCategoria || guardandoProductoRef.current) return;
    guardandoProductoRef.current=true;
    setSubiendoFoto(true);
    let urlImagenFinal = prodImagen;
    try {
      if (archivoFoto) {
        const token = localStorage.getItem('campy_token');
        if (!token) throw new Error('Inicia sesión para subir una foto.');
        const formulario = new FormData();
        formulario.append('foto', archivoFoto);
        const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/productos/foto`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formulario
        });
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo subir la imagen.');
        urlImagenFinal = datos.imagen_url;
      }

      const datosVend = usuario?.datosVendedor || {};
      const payloadProducto = {
        nombre: prodNombre.trim(),
        precio: parseFloat(prodPrecio),
        categoria: prodCategoria,
        definicion: prodDefinicion.trim(),
        comentario: prodComentario.trim(),
        imagen: urlImagenFinal,
        imagen_url: urlImagenFinal,
        claveCreacion: claveProductoRef.current,
        tienda: `Vende: ${datosVend.nombre || usuario?.nombre || 'Estudiante'}`,
        ubicacion: datosVend.ubicacion || 'Campus ITO',
        horario: datosVend.horarios || 'Horario escolar',
        esMio: true
      };

      if (productoEditandoId) {
        await editarProducto(productoEditandoId, payloadProducto);
      } else {
        await agregarNuevoProducto(payloadProducto);
      }
      setArchivoFoto(null);
      setModalActivo(null);
    } catch (err) {
      console.error('Error guardando producto:', err);
      setErrorProducto(err.message || 'Error al guardar el producto');
    } finally {
      guardandoProductoRef.current=false;
      setSubiendoFoto(false);
    }
  };

  const guardarCambiosVendedor = async (e) => {
    e.preventDefault();
    const resumen = formatearResumenHorario(matrizHorario);
    await actualizarDatosVendedor({
      ...usuario.datosVendedor,
      nombre: nombreVendedor.trim(),
      queVende: giroVenta.trim(),
      ubicacion: ubicacionBase.trim(),
      matrizHorario,
      notaHorario: notaHorario.trim(),
      horarios: notaHorario.trim() ? `${resumen} (${notaHorario.trim()})` : resumen
    });
    setModalActivo(null);
  };

  const abrirPanelGestionPedido = (pedido) => {
    setErrorAccionPedido('');
    setPedidoSeleccionado(pedido);
    setModoEntrega(pedido.requiereRepartidor ? 'repartidor' : 'propio');
    setCostoParaRepartidor(String(pedido.total || ''));
    setDondeRecogeRepartidor(usuario?.datosVendedor?.ubicacion || 'Kiosco Central / Edificio L');
    setDondeDejaRepartidor(pedido.puntoEntrega || '');
    setComisionRepartidor('10');
    setModalActivo('gestionarPedido');
  };

  const confirmarAceptacionPedido = async (e) => {
    e.preventDefault();
    if (!pedidoSeleccionado) return;

    const necesitaRep = modoEntrega === 'repartidor';
    setErrorAccionPedido('');
    try {
      await configurarAceptacionPedido(pedidoSeleccionado.id, {
        estado: 'En preparación',
        requiereRepartidor: necesitaRep,
        costoProductoRepartidor: pedidoSeleccionado.total,
        lugarRecoleccion: necesitaRep ? dondeRecogeRepartidor.trim() : '',
        puntoEntrega: pedidoSeleccionado.puntoEntrega,
        comisionRepartidor: necesitaRep ? parseFloat(comisionRepartidor || 10) : 0
      });
      setPedidoSeleccionado(null);
      setModalActivo(null);
    } catch (error) {
      setErrorAccionPedido(error.message || 'No se pudo confirmar el pedido.');
    }
  };

  const liberarPedidoParaOtro = async (ped) => {
    const motivo = window.prompt('¿Por qué no llegó el repartidor? Escribe al menos 8 caracteres.');
    if (motivo === null) return;
    if (motivo.trim().length < 8) { setErrorAccionPedido('Explica por qué no llegó el repartidor.'); return; }
    if (!window.confirm('¿Liberar este pedido para que lo pueda tomar otro repartidor?')) return;
    setErrorAccionPedido('');
    try { await liberarReparto(ped.id, motivo.trim()); refrescarPedidos(); }
    catch (e) { setErrorAccionPedido(e.message || 'No fue posible liberar el reparto.'); }
  };

  const descartarAviso = async (id) => {
    try {
      const token = localStorage.getItem('campy_token');
      const r = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/productos/mis-avisos/${id}/descartar`, {
        method:'POST',headers:{Authorization:`Bearer ${token}`}
      });
      if (!r.ok) throw new Error('No se pudo descartar el aviso.');
      setAvisosModeracion(actual => actual.filter(a => a.id_producto !== id));
    } catch(e) { setErrorProducto(e.message); }
  };

  const abrirModalCancelar = (pedido) => {
    setErrorAccionPedido('');
    setPedidoACancelar(pedido);
    setNotaCancelacion('');
    setErrorCancelacion('');
    setModalActivo('cancelarPedido');
  };

  const confirmarCancelacion = async (e) => {
    e.preventDefault();
    if (!notaCancelacion.trim() || notaCancelacion.trim().length < 5) {
      setErrorCancelacion('Es obligatorio escribir una nota clara explicando al comprador por qué cancelas o declinas su pedido.');
      return;
    }

    try {
      await cambiarEstadoPedidoVendedor(pedidoACancelar.id, 'Cancelado', notaCancelacion.trim());
      setPedidoACancelar(null);
      setNotaCancelacion('');
      setModalActivo(null);
    } catch (error) {
      setErrorCancelacion(error.message || 'No se pudo cancelar el pedido.');
    }
  };

  const manejarCambioEstadoPedido = async (pedidoId, estado) => {
    setErrorAccionPedido('');
    try {
      await cambiarEstadoPedidoVendedor(pedidoId, estado, '');
    } catch (error) {
      setErrorAccionPedido(error.message || 'No se pudo guardar el nuevo estado.');
    }
  };

  const confirmarEliminacionProducto = async (producto) => {
    if (!window.confirm(`¿Eliminar permanentemente la publicación "${producto.nombre}"?`)) return;
    setErrorProducto('');
    try {
      await eliminarProducto(producto.id);
    } catch (error) {
      setErrorProducto(error.message || 'No se pudo eliminar el producto.');
    }
  };

  React.useEffect(() => {
    if (tabActiva !== 'cuenta') return;
    let activo = true;
    const token = localStorage.getItem('campy_token');
    if (!token) return;
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${url}/api/productos/mis-avisos`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async respuesta => {
      if (!respuesta.ok) throw new Error('No se pudieron cargar los avisos.');
      return respuesta.json();
    }).then(datos => {
      if (activo) setAvisosModeracion(Array.isArray(datos) ? datos : []);
    }).catch(error => {
      if (activo) setErrorProducto(error.message);
    });
    return () => { activo = false; };
  }, [tabActiva]);

  const pedidosPendientesCount = pedidosVendedor.filter(
    (p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado'
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <style>{`
        div.campy-aviso-panel { background: #fff; border-left-width: 1px; color: #334155; padding: 14px; border-radius: 16px; box-shadow: 0 4px 14px rgba(15,23,42,.06); }
        div.campy-aviso-panel p { margin-top: 0; }
        div.campy-aviso-panel p + p { margin-top: 5px; }
      `}</style>

      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">

        {/* ENCABEZADO AZUL CON DISTINTIVO DE VENDEDOR */}
        <div className="bg-[#0A3895] pt-6 pb-14 px-6 relative z-0 shrink-0">
          <div className="flex justify-between items-center text-white mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
                <span className="bg-[#FF8C00] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  Modo Vendedor
                </span>
              </div>
              <p className="text-white/80 text-[11px] mt-0.5 font-medium">
                {tabActiva === 'productos' ? 'Mis Productos' : tabActiva === 'pedidos' ? 'Pedidos por Cumplir' : 'Mi cuenta'}
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

        {/* CONTENIDO DINÁMICO SEGÚN PESTAÑA */}
        <div className="flex-1 overflow-y-auto pb-32 px-5 z-10 -mt-2 hide-scrollbar">

          {/* ================= APARTADO 1: MIS PRODUCTOS ================= */}
          {tabActiva === 'productos' && (
            <>
              {errorProducto && <AvisoPanelCampy titulo="No se pudo completar la acción" mensaje={errorProducto} onCerrar={() => setErrorProducto('')} className="mb-3" />}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-sm text-gray-900 uppercase tracking-wide">
                  Mis Productos ({misProductos.length})
                </h3>
                <button
                  onClick={abrirModalNuevoProducto}
                  className="bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <span className="text-base leading-none">+</span> Nuevo Producto
                </button>
              </div>

              {misProductos.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border-2 border-dashed border-gray-200 mb-6">
                  <span className="text-4xl block mb-2">📦</span>
                  <p className="font-black text-sm text-gray-800">Aún no tienes productos en venta</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    Da de alta tus productos uno por uno con su foto, precio y descripción.
                  </p>
                  <button
                    onClick={abrirModalNuevoProducto}
                    className="bg-[#0A3895] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md"
                  >
                    + Publicar mi primer producto
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  {misProductos.map((prod) => (
                    <div key={prod.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex flex-col gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                          {(prod.imagen_url || prod.imagen) ? (
                            <img src={prod.imagen_url || prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">SIN FOTO</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-black uppercase bg-orange-50 text-[#FF8C00] px-2 py-0.5 rounded-full">
                              {prod.categoria}
                            </span>
                            <span className="font-black text-base text-[#FF8C00]">
                              ${Number(prod.precio).toFixed(2)}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-gray-900 truncate mt-1">{prod.nombre}</h4>
                          {prod.definicion && (
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{prod.definicion}</p>
                          )}
                          {prod.comentario && (
                            <p className="text-[10px] text-blue-600 italic truncate mt-0.5">💬 "{prod.comentario}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => abrirModalEditarProducto(prod)}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-[#0A3895] font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <span>✏️</span> Editar nombre / foto / precio
                        </button>
                        <button
                          onClick={() => confirmarEliminacionProducto(prod)}
                          className="bg-red-50 hover:bg-red-100 text-red-500 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                          title="Eliminar producto"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}

          {/* ================= APARTADO 3: MI CUENTA ================= */}
          {tabActiva === 'cuenta' && (
            <>
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 bg-orange-50 text-[#FF8C00] rounded-2xl flex items-center justify-center text-2xl font-black border border-orange-100 shrink-0">
                      🏪
                    </div>
                    <div>
                      <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Tienda Activa • ID {usuario?.datosVendedor?.identificacion}
                      </span>
                      <h2 className="font-black text-base text-gray-900 leading-tight mt-1">
                        {usuario?.datosVendedor?.nombre || usuario?.nombre}
                      </h2>
                      <p className="text-xs text-gray-500 font-medium">
                        Giro: <span className="text-gray-800 font-bold">{usuario?.datosVendedor?.queVende}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalActivo('editarVendedor')}
                    className="text-[11px] font-bold text-[#0A3895] bg-blue-50 px-2.5 py-1.5 rounded-xl hover:bg-blue-100 transition-colors shrink-0"
                  >
                    Editar Info
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-4">
                <button
                  onClick={volverAModoCliente}
                  className="w-full bg-white border border-gray-200 text-gray-600 font-bold text-xs py-3.5 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  🛒 Modo comprador
                </button>
                <button
                  type="button"
                  onClick={abrirCambioPasswordCuenta}
                  className="w-full bg-white border border-gray-200 text-[#0A3895] font-bold text-xs py-3.5 rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span aria-hidden="true">🔒</span> Cambiar contraseña
                </button>
                {errorProducto && <AvisoPanelCampy titulo="No se pudieron gestionar los avisos" mensaje={errorProducto} onCerrar={() => setErrorProducto('')} />}
                {avisosModeracion.length > 0 && (
                  <section aria-label="Avisos de publicaciones retiradas" className="space-y-3">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">Avisos de moderación</h3>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">{avisosModeracion.length} {avisosModeracion.length === 1 ? 'aviso' : 'avisos'}</span>
                    </div>
                    {avisosModeracion.map(aviso => (
                      <div key={aviso.id_producto} className="campy-aviso-panel flex items-start gap-3 rounded-2xl border border-amber-100 bg-white p-3.5 shadow-sm">
                        <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-5 9 5v10l-9 5-9-5z"/><path d="m3 9 9 5 9-5"/><path d="M12 14v10"/>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900">Publicación retirada</p>
                          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600">
                            Tu producto <strong className="text-slate-800">{aviso.nombre}</strong> fue inhabilitado{aviso.origen_inhabilitacion === 'Moderación' ? ' por moderación' : ' tras el retiro del rol de vendedor'}. Ya no aparece en el catálogo.
                          </p>
                          <p className="mt-2 text-[10px] font-semibold text-amber-700">Aviso para vendedor</p>
                        </div>
                        <button type="button" onClick={() => descartarAviso(aviso.id_producto)}
                          aria-label={`Descartar aviso de ${aviso.nombre}`} title="No volver a mostrar"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">×</button>
                      </div>
                    ))}
                  </section>
                )}
                <button
                  onClick={cerrarSesion}
                  className="w-full bg-[#FFF0F0] text-[#FF4D4D] font-bold text-xs py-3.5 rounded-2xl hover:bg-[#FFE5E5] transition-colors border border-[#FFE5E5]"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}

          {/* ================= APARTADO 2: PEDIDOS POR CUMPLIR ================= */}
          {tabActiva === 'pedidos' && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-black text-base text-gray-900 uppercase tracking-wide">
                    Pedidos por Cumplir
                  </h3>
                  <button
                    type="button"
                    onClick={refrescarPedidos}
                    disabled={cargandoPedidos || actualizandoPedidos}
                    className="rounded-xl bg-blue-50 text-[#0A3895] px-3 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    {cargandoPedidos || actualizandoPedidos ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Toca un pedido nuevo para aceptarlo, elegir si lo llevas tú o un repartidor, y actualizar su estado.
                </p>
              </div>

              {cargandoPedidos && <p className="text-xs text-gray-500 mb-3">Consultando pedidos...</p>}
              {errorPedidos && <AvisoPanelCampy titulo="No se pudieron consultar los pedidos" mensaje={errorPedidos} className="mb-3" />}
              {errorAccionPedido && <AvisoPanelCampy titulo="No se pudo actualizar el pedido" mensaje={errorAccionPedido} onCerrar={() => setErrorAccionPedido('')} className="mb-3" />}
              {pedidosVendedor.length === 0 ? (
                !cargandoPedidos && !errorPedidos && (
                  <div className="bg-white rounded-3xl p-6 text-center border border-gray-100">
                    <span className="text-4xl block mb-2">📭</span>
                    <p className="font-bold text-sm text-gray-700">No tienes pedidos registrados</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-4">
                  {pedidosVendedor.map((ped) => {
                    const estaCancelado = ped.estado === 'Cancelado';
                    const estaEntregado = ped.estado === 'Entregado';
                    const esNuevoPendiente = ped.estado === 'Pendiente';

                    return (
                      <div
                        key={ped.id}
                        onClick={() => esNuevoPendiente && abrirPanelGestionPedido(ped)}
                        className={`bg-white rounded-3xl p-4 shadow-sm border-2 transition-all ${esNuevoPendiente ? 'cursor-pointer hover:shadow-md border-[#FF8C00]' : ''
                          } ${estaCancelado
                            ? 'border-red-200 opacity-80'
                            : estaEntregado
                              ? 'border-green-200'
                              : 'border-[#FF8C00]'
                          }`}
                      >
                        {/* Cabecera del Pedido */}
                        <div className="flex justify-between items-center mb-3">
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${estaCancelado
                              ? 'bg-red-100 text-red-600'
                              : estaEntregado
                                ? 'bg-green-100 text-green-700'
                                : esNuevoPendiente
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : 'bg-[#0A3895] text-white'
                              }`}
                          >
                            {estaCancelado
                              ? '✕ Cancelado'
                              : estaEntregado
                                ? '✓ Entregado'
                                : esNuevoPendiente
                                  ? '🔔 Nuevo • Toca para Aceptar'
                                  : `⚡ ${ped.estado}`}
                          </span>
                          <span className="text-[11px] font-bold text-gray-400">
                            Pedido #{ped.id} • {ped.hora}
                          </span>
                        </div>

                        {/* Motivos de entregas liberadas por repartidores */}
                        {Array.isArray(ped.avisosReasignacion) && ped.avisosReasignacion.length > 0 && (
                          <section className="mb-3 space-y-2" aria-label={`Avisos de reasignación del pedido ${ped.id}`}>
                            {ped.avisosReasignacion.map((aviso) => (
                              <div key={aviso.id} className="campy-aviso-panel flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-3.5 shadow-sm">
                                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.3 3.5 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.5a2 2 0 0 0-3.4 0Z" />
                                    <path d="M12 9v4m0 4h.01" />
                                  </svg>
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-slate-900">Entrega liberada para reasignación</p>
                                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                    <strong className="text-slate-800">{aviso.repartidor}</strong> era el repartidor asignado al pedido #{ped.id}.
                                  </p>
                                  <p className="mt-2 break-words rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
                                    <strong>Motivo:</strong> {aviso.motivo}
                                  </p>
                                  <p className="mt-2 text-[10px] font-medium text-slate-500">
                                    {aviso.fecha ? new Date(aviso.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : 'Reasignación registrada'}
                                    {' · '}El pedido sigue activo para otro repartidor.
                                  </p>
                                </div>
                              </div>
                            ))}
                          </section>
                        )}

                        {/* Datos de a quién le debemos el pedido */}
                        <div className="bg-[#F4F7FD] rounded-2xl p-3 mb-3 border border-blue-100">
                          <p className="text-[10px] font-black uppercase text-[#0A3895] mb-1">
                            Cliente Comprador:
                          </p>
                          <p className="text-sm font-black text-gray-900">👤 {ped.compradorNombre}</p>
                          <p className="text-xs text-gray-600 font-medium mt-0.5">🎓 {ped.compradorCarrera}</p>
                          <p className="text-xs text-[#FF8C00] font-bold mt-1">📍 Entregar en: {ped.puntoEntrega}</p>
                        </div>

                        {/* Info de modalidad de reparto si ya fue aceptado */}
                        {!esNuevoPendiente && !estaCancelado && (
                          <div className="mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[11px]">
                            {ped.requiereRepartidor ? (
                              <p className="text-gray-700">
                                🛵 <span className="font-bold">Con Repartidor:</span>{' '}
                                {ped.repartidorAsignado ? (
                                  <span className="text-green-600 font-black">Asignado a {ped.repartidorAsignado}</span>
                                ) : (
                                  <span className="text-[#FF8C00] font-bold">Buscando repartidor disponible...</span>
                                )}
                              </p>
                            ) : (
                              <p className="text-gray-700">
                                🚶‍♂️ <span className="font-bold">Entrega directa:</span> Tú llevarás este pedido al comprador.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Lista de productos que pidió */}
                        <div className="mb-3">
                          <p className="text-[10px] font-black uppercase text-gray-400 mb-1.5">
                            Productos solicitados:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {ped.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-800">
                                  <span className="text-[#FF8C00] font-black">{item.cantidad}x</span> {item.nombre}
                                </span>
                                <span className="text-xs font-black text-gray-900">
                                  ${(item.precio * item.cantidad).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-100 pt-2.5 mb-3">
                          <span className="text-xs font-bold text-gray-400 uppercase">Total ({ped.metodoPago || 'Sin elegir'})</span>
                          <span className="text-lg font-black text-[#FF8C00]">${Number(ped.total).toFixed(2)}</span>
                        </div>

                        {/* Si fue cancelado, mostrar la nota que se envió */}
                        {estaCancelado && ped.notaCancelacion && (
                          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700">
                            <p className="font-black uppercase text-[10px] mb-0.5">Nota enviada al comprador:</p>
                            <p className="italic">"{ped.notaCancelacion}"</p>
                          </div>
                        )}

                        {/* Controles para pedido Nuevo Pendiente */}
                        {esNuevoPendiente && (
                          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => abrirModalCancelar(ped)}
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs py-3 rounded-xl transition-colors"
                            >
                              Declinar
                            </button>
                            <button
                              onClick={() => abrirPanelGestionPedido(ped)}
                              className="flex-2 bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition-colors"
                            >
                              ✓ Aceptar / Configurar Entrega
                            </button>
                          </div>
                        )}

                        {ped.requiereRepartidor && !esNuevoPendiente && !estaCancelado && !estaEntregado && (
                          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                            <p className="font-black text-xs text-[#0A3895]">Preparación del pedido: {ped.estadoReparto || 'Buscando repartidor'}</p>
                            {(ped.estadoReparto === 'Buscando repartidor' || ped.estadoReparto === 'Aceptado') && (
                              <button onClick={() => manejarCambioEstadoPedido(ped.id, 'Listo')}
                                className="bg-[#0A3895] text-white rounded-xl p-3 font-bold">✓ Pedido listo</button>
                            )}
                            {ped.estadoReparto === 'Listo' && ped.repartidorAsignado && (
                              <button onClick={() => manejarCambioEstadoPedido(ped.id, 'Repartidor llegó')}
                                className="bg-[#FF8C00] text-white rounded-xl p-3 font-bold">🛵 El repartidor llegó</button>
                            )}
                            {ped.estadoReparto === 'Listo' && !ped.repartidorAsignado && <AvisoPanelCampy tipo="info" titulo="Buscando repartidor" mensaje="El pedido está listo. Estamos esperando que un repartidor lo acepte." />}
                            {ped.repartidorId && ['Aceptado','Listo','Repartidor llegó'].includes(ped.estadoReparto) && (
                              <button type="button" onClick={() => liberarPedidoParaOtro(ped)}
                                className="w-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl p-3">
                                El repartidor no llegó · Liberar pedido
                              </button>
                            )}
                            {['Repartidor llegó', 'Recibido', 'En camino', 'En el punto de entrega'].includes(ped.estadoReparto) &&
                              <p>Entrega a cargo del repartidor: {ped.estadoReparto}</p>}
                          </div>
                        )}
                        {/* Botones de progreso de estados cuando ya fue aceptado */}
                        {!ped.requiereRepartidor && !esNuevoPendiente && !estaCancelado && !estaEntregado && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <p className="text-[10px] font-black uppercase text-gray-400">
                              Actualizar estado del pedido al comprador:
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'En preparación')}
                                className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-all ${ped.estado === 'En preparación'
                                  ? 'bg-[#0A3895] text-white border-[#0A3895]'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                              >
                                👨‍🍳 Preparando
                              </button>
                              <button
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'En camino')}
                                className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-all ${ped.estado === 'En camino'
                                  ? 'bg-[#FF8C00] text-white border-[#FF8C00]'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                              >
                                🏃‍♂️ En camino
                              </button>
                              <button
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'En el punto de entrega')}
                                className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-all ${ped.estado === 'En el punto de entrega'
                                  ? 'bg-[#22C55E] text-white border-[#22C55E]'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                              >
                                📍 En el lugar
                              </button>
                            </div>

                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => abrirModalCancelar(ped)}
                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs py-2.5 rounded-xl"
                              >
                                Cancelar con nota
                              </button>
                              <button
                                type="button"
                                disabled={ped.estado !== 'En el punto de entrega'}
                                title={ped.estado === 'En el punto de entrega'
                                  ? 'Confirmar entrega del pedido'
                                  : 'Primero selecciona En camino y después En el lugar'}
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'Entregado')}
                                className={`flex-1 bg-[#22C55E] text-white font-black text-xs py-2.5 rounded-xl shadow-sm ${ped.estado === 'En el punto de entrega'
                                  ? 'hover:bg-[#16a34a]'
                                  : 'opacity-40 cursor-not-allowed'
                                  }`}
                              >
                                ✓ Marcar Entregado
                              </button>
                            </div>
                          </div>
                        )}

                        {!estaEntregado && !estaCancelado && (
                          <ComentarioEntrega pedidoId={ped.id} comentarioInicial={ped.comentarioEntregaVendedor}
                            otros={[{nombre:'Comprador',texto:ped.comentarioEntregaComprador},{nombre:'Repartidor',texto:ped.comentarioEntregaRepartidor}]}
                            onGuardado={refrescarPedidos} />
                        )}

                        {/* CALIFICACIÓN REAL DEL COMPRADOR */}
                        {estaEntregado && ped.calificacion && Number(ped.calificacion.estrellas) >= 1 && Number(ped.calificacion.estrellas) <= 5 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-[10px] font-black uppercase text-[#0A3895] mb-1">
                              Calificación del Comprador:
                            </p>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-lg ${i < Number(ped.calificacion.estrellas) ? 'text-[#FF8C00]' : 'text-gray-300'}`}>
                                    ★
                                  </span>
                                ))}
                                <span className="ml-2 font-bold text-gray-800 text-xs">
                                  {ped.calificacion.estrellas} de 5
                                </span>
                              </div>
                              {ped.calificacion.comentario?.trim() && (
                                <p className="text-xs text-gray-600 italic">
                                  "{ped.calificacion.comentario}"
                                </p>
                              )}
                            </div>
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

        {/* MENÚ INFERIOR EXCLUSIVO DEL VENDEDOR */}
        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.06)] px-3 py-2 flex justify-around items-end pb-5 z-20">
          <button
            type="button"
            onClick={() => setTabActiva('productos')}
            className="flex flex-col items-center cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${tabActiva === 'productos'
                ? 'bg-[#0A3895] shadow-lg -mt-5 border-4 border-white text-white text-xl'
                : 'text-gray-400 text-2xl'
                }`}
            >
              🏪
            </div>
            <span className={`text-[10px] font-bold mt-1 ${tabActiva === 'productos' ? 'text-[#0A3895]' : 'text-gray-400'}`}>
              Mis productos
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTabActiva('pedidos'); refrescarPedidos(); }}
            className="flex flex-col items-center cursor-pointer relative"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${tabActiva === 'pedidos'
                ? 'bg-[#0A3895] shadow-lg -mt-5 border-4 border-white text-white text-xl'
                : 'text-gray-400 text-2xl'
                }`}
            >
              📋
            </div>
            {pedidosPendientesCount > 0 && (
              <span className="absolute -top-2 right-2 bg-[#FF8C00] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {pedidosPendientesCount}
              </span>
            )}
            <span className={`text-[10px] font-bold mt-1 ${tabActiva === 'pedidos' ? 'text-[#0A3895]' : 'text-gray-400'}`}>
              Pedidos
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('cuenta')}
            className="flex flex-col items-center cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${tabActiva === 'cuenta'
                ? 'bg-[#0A3895] shadow-lg -mt-5 border-4 border-white text-white text-xl'
                : 'text-gray-400 text-2xl'
                }`}
            >
              🏠
            </div>
            <span className={`text-[10px] font-bold mt-1 ${tabActiva === 'cuenta' ? 'text-[#0A3895]' : 'text-gray-400'}`}>
              Mi cuenta
            </span>
          </button>
        </div>

        {/* FONDO DE MODALES */}
        {modalActivo && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setModalActivo(null)}></div>
        )}

        {/* CAMBIAR CONTRASEÑA DESDE MI CUENTA DEL VENDEDOR */}
        {modalActivo === 'cambiarPasswordCuenta' && (
          <div className="absolute bottom-0 left-0 w-full max-h-[92%] overflow-y-auto bg-white rounded-t-[30px] p-5 pb-9 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 rounded-full bg-gray-300 mx-auto mb-3" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-[#0A3895]">Cambiar contraseña</h2>
              <button type="button" onClick={() => setModalActivo(null)} aria-label="Cerrar" className="font-bold text-gray-500 px-2">✕</button>
            </div>
            <form onSubmit={guardarCambioPasswordCuenta} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Contraseña actual</label>
                <div className="relative">
                  <input type={verPasswordActualCuenta ? 'text' : 'password'} value={passwordActualCuenta}
                    onChange={e => setPasswordActualCuenta(e.target.value)} autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3895]" required />
                  <button type="button" aria-label={verPasswordActualCuenta ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                    onClick={() => setVerPasswordActualCuenta(v => !v)} className="absolute inset-y-0 right-2 px-2 text-gray-500">
                    <OjoContrasenaCuenta visible={verPasswordActualCuenta}/>
                  </button>
                </div>
              </div>
              <div id="reglas-password-vendedor" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3">
                <p className="text-xs font-bold text-[#0A3895] mb-2">Tu nueva contraseña debe cumplir con:</p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {REQUISITOS_PASSWORD_CUENTA.map(regla => {
                    const cumple = nuevaPasswordCuenta.length > 0 && regla.cumple(nuevaPasswordCuenta);
                    return (
                      <li key={regla.texto} className={`text-[10px] flex items-start gap-1.5 ${cumple ? 'text-green-700' : 'text-slate-600'}`}>
                        <span aria-hidden="true" className="font-black">{cumple ? '✓' : '○'}</span>{regla.texto}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input type={verNuevaPasswordCuenta ? 'text' : 'password'} value={nuevaPasswordCuenta}
                    onChange={e => setNuevaPasswordCuenta(e.target.value)} autoComplete="new-password"
                    aria-describedby="reglas-password-vendedor"
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3895]" required />
                  <button type="button" aria-label={verNuevaPasswordCuenta ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                    onClick={() => setVerNuevaPasswordCuenta(v => !v)} className="absolute inset-y-0 right-2 px-2 text-gray-500">
                    <OjoContrasenaCuenta visible={verNuevaPasswordCuenta}/>
                  </button>
                </div>
                {nuevaPasswordCuenta.length > 10 && <p className="mt-1 text-xs font-semibold text-red-700">La contraseña no puede tener más de 10 caracteres.</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input type={verConfirmarPasswordCuenta ? 'text' : 'password'} value={confirmarPasswordCuenta}
                    onChange={e => setConfirmarPasswordCuenta(e.target.value)} autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A3895]" required />
                  <button type="button" aria-label={verConfirmarPasswordCuenta ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    onClick={() => setVerConfirmarPasswordCuenta(v => !v)} className="absolute inset-y-0 right-2 px-2 text-gray-500">
                    <OjoContrasenaCuenta visible={verConfirmarPasswordCuenta}/>
                  </button>
                </div>
                {confirmarPasswordCuenta.length > 0 && <p className={`mt-1 text-xs font-semibold ${confirmarPasswordCuenta === nuevaPasswordCuenta ? 'text-green-700' : 'text-amber-700'}`}>
                  {confirmarPasswordCuenta === nuevaPasswordCuenta ? '✓ Las contraseñas coinciden.' : 'Las contraseñas todavía no coinciden.'}
                </p>}
              </div>
              {errorPasswordCuenta && <p role="alert" className="text-xs text-red-700 bg-red-50 p-3 rounded-xl">{errorPasswordCuenta}</p>}
              {exitoPasswordCuenta && <p role="status" className="text-xs text-green-800 bg-green-50 p-3 rounded-xl">{exitoPasswordCuenta}</p>}
              <button type="submit" disabled={guardandoPasswordCuenta}
                className="w-full rounded-xl bg-[#0A3895] text-white font-bold py-3 text-sm disabled:opacity-60">
                {guardandoPasswordCuenta ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        )}

        {/* MODAL NUEVO: ACEPTAR / DECLINAR PEDIDO Y ELEGIR REPARTIDOR */}
        {modalActivo === 'gestionarPedido' && pedidoSeleccionado && (
          <div className="absolute bottom-0 left-0 w-full max-h-[92%] overflow-y-auto bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-black text-[#0A3895]">
                Gestionar Pedido #{pedidoSeleccionado.id}
              </h2>
              <button onClick={() => setModalActivo(null)} className="text-xs font-bold text-gray-400">Cerrar ✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Solicitado por <span className="font-bold text-gray-800">{pedidoSeleccionado.compradorNombre}</span>. Confirma si aceptas el pedido y cómo lo entregarás.
            </p>

            {errorAccionPedido && <AvisoPanelCampy titulo="No se pudo confirmar el pedido" mensaje={errorAccionPedido} onCerrar={() => setErrorAccionPedido('')} className="mb-2" />}
            <form onSubmit={confirmarAceptacionPedido} className="flex flex-col gap-3.5">
              {/* Selector: ¿Lo llevas tú o necesitas Repartidor? */}
              <div>
                <label className="text-[11px] font-black text-gray-700 uppercase block mb-2">
                  ¿Quién entregará el producto?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModoEntrega('propio')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${modoEntrega === 'propio'
                      ? 'border-[#0A3895] bg-blue-50/60'
                      : 'border-gray-200 bg-white'
                      }`}
                  >
                    <span className="text-xl block mb-1">🚶‍♂️</span>
                    <p className="font-black text-xs text-gray-900">Yo lo voy a dejar</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Entrega personal al comprador</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoEntrega('repartidor')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${modoEntrega === 'repartidor'
                      ? 'border-[#FF8C00] bg-orange-50/60'
                      : 'border-gray-200 bg-white'
                      }`}
                  >
                    <span className="text-xl block mb-1">🛵</span>
                    <p className="font-black text-xs text-gray-900">Necesito Repartidor</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Publicar en bolsa de repartidores</p>
                  </button>
                </div>
              </div>

              {/* Campos obligatorios si el vendedor necesita un repartidor */}
              {modoEntrega === 'repartidor' && (
                <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-3.5 flex flex-col gap-3">
                  <p className="text-[10px] font-black uppercase text-[#FF8C00]">
                    Datos para el Repartidor (Estilo Uber)
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">Costo del producto ($)</label>
                      <p className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800">
                        ${Number(pedidoSeleccionado.total).toFixed(2)} · precio fijado al comprar
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-600 block mb-1">Propina/Envío Repartidor ($)</label>
                      <input
                        type="number"
                        step="1"
                        value={comisionRepartidor}
                        onChange={(e) => setComisionRepartidor(e.target.value)}
                        placeholder="Ej. 10"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#FF8C00]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      ¿Dónde lo pasa a recoger el repartidor?
                    </label>
                    <input
                      type="text"
                      value={dondeRecogeRepartidor}
                      onChange={(e) => setDondeRecogeRepartidor(e.target.value)}
                      placeholder="Ej. Kiosco Central / Mesas del Edificio D"
                      list="edificios-recoleccion-ito"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#FF8C00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      ¿Dónde lo va a dejar al comprador?
                    </label>
                    <p className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800">
                      {pedidoSeleccionado.puntoEntrega}
                    </p>
                  </div>
                  <datalist id="edificios-recoleccion-ito">{EDIFICIOS_ITO.map(l=><option key={l} value={l}/>)}</datalist>
                </div>
              )}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => abrirModalCancelar(pedidoSeleccionado)}
                  className="flex-1 bg-red-50 text-red-600 border border-red-200 font-bold text-xs py-3.5 rounded-xl"
                >
                  Declinar Pedido
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-[#22C55E] hover:bg-[#16a34a] text-white font-black text-xs py-3.5 px-5 rounded-xl shadow-md"
                >
                  ✓ Aceptar y Preparar Pedido
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL 1: CREAR / EDITAR PRODUCTO */}
        {modalActivo === 'producto' && (
          <div className="absolute bottom-0 left-0 w-full max-h-[90%] overflow-y-auto bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-black text-[#0A3895]">
                {productoEditandoId ? 'Editar Producto' : 'Dar de Alta Producto'}
              </h2>
              <button onClick={() => setModalActivo(null)} className="text-xs font-bold text-gray-400">Cerrar ✕</button>
            </div>

            <form onSubmit={guardarProducto} className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-gray-600">Imagen del Producto</label>
                  {prodImagen && (
                    <button type="button" onClick={() => { setProdImagen(null); setArchivoFoto(null); }} className="text-[10px] font-bold text-red-500">
                      Quitar imagen
                    </button>
                  )}
                </div>
                <label className="w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF8C00] bg-gray-50 overflow-hidden">
                  {prodImagen ? (
                    <img src={prodImagen} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-xs font-bold text-gray-500">Toca para subir o cambiar foto</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={manejarSeleccionFoto} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => { setErrorCamara(''); setCamaraAbierta(true); }}
                  className="inline-flex items-center justify-center mt-2 bg-blue-50 text-[#0A3895] border border-blue-100 p-2 rounded-xl text-xs font-bold hover:bg-blue-100"
                >
                  📸 Tomar foto con la cámara
                </button>
                {camaraAbierta && (
                  <div className="mt-3 rounded-2xl border border-blue-100 bg-slate-900 p-3 space-y-3">
                    <p className="text-xs font-bold text-white">Cámara del producto</p>
                    <video
                      ref={videoCamaraRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full aspect-[4/3] rounded-xl bg-black object-cover"
                    />
                    {camaraCargando && <p className="text-xs text-white">Solicitando permiso y abriendo la cámara...</p>}
                    {errorCamara && <p role="alert" className="text-xs text-red-700 bg-red-50 rounded-xl p-2">{errorCamara}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCamaraAbierta(false)}
                        className="bg-white text-gray-700 py-2.5 rounded-xl text-xs font-bold"
                      >
                        Cerrar cámara
                      </button>
                      <button
                        type="button"
                        onClick={capturarFoto}
                        disabled={camaraCargando || !!errorCamara}
                        className="bg-[#FF8C00] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Capturar foto
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={prodNombre}
                    onChange={(e) => setProdNombre(e.target.value)}
                    placeholder="Ej. Carlota de Limón"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#FF8C00]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Precio ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={prodPrecio}
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="35"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#FF8C00]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Categoría</label>
                <select
                  value={prodCategoria}
                  onChange={(e) => setProdCategoria(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#FF8C00]"
                >
                  {categoriasDisponibles.length ?
                    categoriasDisponibles.map(nombre=><option key={nombre} value={nombre}>{nombre}</option>) :
                    <option value="">Cargando categorías...</option>}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Mini definición / Descripción</label>
                <textarea
                  rows="2"
                  value={prodDefinicion}
                  onChange={(e) => setProdDefinicion(e.target.value)}
                  placeholder="Ingredientes, tamaño o detalles breves..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#FF8C00]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Comentario adicional</label>
                <input
                  type="text"
                  value={prodComentario}
                  onChange={(e) => setProdComentario(e.target.value)}
                  placeholder="Ej. Acepto transferencia, entrego en salón..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#FF8C00]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-sm py-3.5 rounded-xl shadow-lg mt-2"
              >
                {productoEditandoId ? 'Guardar Cambios' : 'Publicar Producto'}
              </button>
            </form>
          </div>
        )}

        {/* MODAL 2: CANCELAR PEDIDO CON NOTA OBLIGATORIA */}
        {modalActivo === 'cancelarPedido' && pedidoACancelar && (
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-black text-red-600 mb-1">Cancelar / Declinar Pedido #{pedidoACancelar.id}</h2>
            <p className="text-xs text-gray-500 mb-4">
              Pedido de <span className="font-bold text-gray-800">{pedidoACancelar.compradorNombre}</span>. Escribe obligatoriamente el motivo para notificarle.
            </p>

            <form onSubmit={confirmarCancelacion} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-black text-gray-700 uppercase block mb-1">
                  Nota de cancelación para el comprador *
                </label>
                <textarea
                  rows="3"
                  value={notaCancelacion}
                  onChange={(e) => {
                    setNotaCancelacion(e.target.value);
                    if (errorCancelacion) setErrorCancelacion('');
                  }}
                  placeholder="Ej. Disculpa, se me terminaron las porciones de hoy / Tuve que entrar a examen..."
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-3 text-xs text-gray-800 outline-none focus:border-red-500"
                  required
                />
                {errorCancelacion && (
                    <AvisoPanelCampy titulo="Revisa la nota de cancelación" mensaje={errorCancelacion} onCerrar={() => setErrorCancelacion('')} className="mt-2" />
                )}
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setModalActivo(null)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold text-xs py-3.5 rounded-xl"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3.5 rounded-xl shadow-md"
                >
                  Confirmar y Enviar Nota
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL 3: EDITAR DATOS Y CAJA DE HORARIOS DEL VENDEDOR */}
        {modalActivo === 'editarVendedor' && (
          <div className="absolute bottom-0 left-0 w-full max-h-[90%] overflow-y-auto bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-black text-[#0A3895] mb-3">Editar Datos de Vendedor</h2>

            <form onSubmit={guardarCambiosVendedor} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Nombre / Tienda</label>
                <input
                  type="text"
                  value={nombreVendedor}
                  onChange={(e) => setNombreVendedor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#0A3895]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">¿Qué vendes?</label>
                  <input
                    type="text"
                    value={giroVenta}
                    onChange={(e) => setGiroVenta(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Ubicación ITO</label>
                  <input
                    type="text"
                    value={ubicacionBase}
                    list="edificios-vendedor-panel"
                    onChange={(e) => setUbicacionBase(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
              </div>

              <datalist id="edificios-vendedor-panel">{EDIFICIOS_ITO.map(l=><option key={l} value={l}/>)}</datalist>
              <div className="bg-[#F4F7FD] border border-blue-100 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black text-[#0A3895] uppercase">Organizador de Horarios</span>
                  <span className="text-[9px] text-gray-500">Toca tus bloques disponibles</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center items-center">
                  <div className="text-[9px] font-bold text-gray-400">HORA</div>
                  {DIAS_SEMANA.map((d) => (
                    <div key={d} className="text-[9px] font-black text-[#0A3895] bg-white py-1 rounded-md shadow-2xs">
                      {d}
                    </div>
                  ))}
                  {BLOQUES_HORA.map((bloque) => (
                    <React.Fragment key={bloque}>
                      <div className="text-[9px] font-bold text-gray-500 py-1">{bloque}</div>
                      {DIAS_SEMANA.map((dia) => {
                        const activo = !!matrizHorario[`${dia}_${bloque}`];
                        return (
                          <button
                            type="button"
                            key={`${dia}_${bloque}`}
                            onClick={() => alternarCeldaHorario(dia, bloque)}
                            className={`h-6 rounded-md text-[9px] font-black transition-all border ${activo
                              ? 'bg-[#FF8C00] text-white border-[#FF8C00] shadow-xs'
                              : 'bg-white text-gray-300 border-gray-200 hover:border-blue-300'
                              }`}
                          >
                            {activo ? '✓' : ''}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <input
                  type="text"
                  value={notaHorario}
                  onChange={(e) => setNotaHorario(e.target.value)}
                  placeholder="Notas de horario (ej. Solo en recesos o cambios de hora)"
                  className="w-full mt-2 bg-white border border-blue-100 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0A3895] text-white font-black text-sm py-3.5 rounded-xl shadow-md mt-1"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default PanelVendedor;