import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const BLOQUES_HORA = ['08-10', '10-12', '12-14', '14-16', '16-18'];

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
  configurarAceptacionPedido,
  cambiarEstadoPedidoVendedor,
  volverAModoCliente,
  cerrarSesion
}) => {
  const [tabActiva, setTabActiva] = useState('productos');
  const [modalActivo, setModalActivo] = useState(null);

  // Estados para crear / editar producto
  const [productoEditandoId, setProductoEditandoId] = useState(null);
  const [prodNombre, setProdNombre] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodCategoria, setProdCategoria] = useState('Comida');
  const [prodDefinicion, setProdDefinicion] = useState('');
  const [prodComentario, setProdComentario] = useState('');
  const [prodImagen, setProdImagen] = useState(null);

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
    setProdNombre('');
    setProdPrecio('');
    setProdCategoria('Comida');
    setProdDefinicion('');
    setProdComentario('');
    setProdImagen(null);
    setModalActivo('producto');
  };

  const abrirModalEditarProducto = (prod) => {
    setProductoEditandoId(prod.id);
    setProdNombre(prod.nombre);
    setProdPrecio(prod.precio);
    setProdCategoria(prod.categoria || 'Comida');
    setProdDefinicion(prod.definicion || '');
    setProdComentario(prod.comentario || '');
    setProdImagen(prod.imagen || null);
    setModalActivo('producto');
  };

  const manejarSeleccionFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProdImagen(reader.result);
    };
    reader.readAsDataURL(archivo);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodPrecio) return;

    const datosVend = usuario?.datosVendedor || {};
    const payloadProducto = {
      nombre: prodNombre.trim(),
      precio: parseFloat(prodPrecio),
      categoria: prodCategoria,
      definicion: prodDefinicion.trim(),
      comentario: prodComentario.trim(),
      imagen: prodImagen,
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

    setModalActivo(null);
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

  // Abrir panel cuando el vendedor da clic en un pedido para aceptarlo o declinarlo
  const abrirPanelGestionPedido = (pedido) => {
    setErrorAccionPedido('');
    setPedidoSeleccionado(pedido);
    setModoEntrega(pedido.requiereRepartidor ? 'repartidor' : 'propio');
    setCostoParaRepartidor(String(pedido.total || ''));
    setDondeRecogeRepartidor(usuario?.datosVendedor?.ubicacion || 'Kiosco Central / Edificio L');
    setDondeDejaRepartidor(pedido.puntoEntrega || 'Edificio L - Salón L3');
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
        costoProductoRepartidor: necesitaRep ? parseFloat(costoParaRepartidor || pedidoSeleccionado.total) : pedidoSeleccionado.total,
        lugarRecoleccion: necesitaRep ? dondeRecogeRepartidor.trim() : '',
        puntoEntrega: necesitaRep ? dondeDejaRepartidor.trim() : pedidoSeleccionado.puntoEntrega,
        comisionRepartidor: necesitaRep ? parseFloat(comisionRepartidor || 10) : 0
      });
      setPedidoSeleccionado(null);
      setModalActivo(null);
    } catch (error) {
      setErrorAccionPedido(error.message || 'No se pudo confirmar el pedido en Supabase.');
    }
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
      setErrorCancelacion(error.message || 'No se pudo cancelar el pedido en Supabase.');
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

  const pedidosPendientesCount = pedidosVendedor.filter(
    (p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado'
  ).length;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
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
              {/* Botón Principal para Agregar Producto */}
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
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-cover" />
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
                          onClick={() => eliminarProducto(prod.id)}
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
                  onClick={cerrarSesion}
                  className="w-full bg-[#FFF0F0] text-[#FF4D4D] font-bold text-xs py-3.5 rounded-2xl hover:bg-[#FFE5E5] transition-colors border border-[#FFE5E5]"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}

          {/* ================= APARTADO 2: PEDIDOS POR CUMPLIR Y GESTIÓN DE ESTADOS ================= */}
          {tabActiva === 'pedidos' && (
            <>
              <div className="mb-4">
                <h3 className="font-black text-base text-gray-900 uppercase tracking-wide">
                  Pedidos por Cumplir
                </h3>
                <p className="text-xs text-gray-500">
                  Toca un pedido nuevo para aceptarlo, elegir si lo llevas tú o un repartidor, y actualizar su estado.
                </p>
              </div>

              {cargandoPedidos && <p className="text-xs text-gray-500 mb-3">Consultando pedidos en Supabase...</p>}
              {errorPedidos && <p role="alert" className="text-red-600 text-xs mb-3">{errorPedidos}</p>}
              {errorAccionPedido && <p role="alert" className="text-red-600 text-xs mb-3">{errorAccionPedido}</p>}
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
                        className={`bg-white rounded-3xl p-4 shadow-sm border-2 transition-all ${
                          esNuevoPendiente ? 'cursor-pointer hover:shadow-md border-[#FF8C00]' : ''
                        } ${
                          estaCancelado
                            ? 'border-red-200 opacity-80'
                            : estaEntregado
                            ? 'border-green-200'
                            : 'border-[#FF8C00]'
                        }`}
                      >
                        {/* Cabecera del Pedido */}
                        <div className="flex justify-between items-center mb-3">
                          <span
                            className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                              estaCancelado
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
                          <span className="text-xs font-bold text-gray-400 uppercase">Total ({ped.metodoPago})</span>
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

                        {/* Botones de progreso de estados cuando ya fue aceptado */}
                        {!esNuevoPendiente && !estaCancelado && !estaEntregado && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <p className="text-[10px] font-black uppercase text-gray-400">
                              Actualizar estado del pedido al comprador:
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'En preparación')}
                                className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-all ${
                                  ped.estado === 'En preparación'
                                    ? 'bg-[#0A3895] text-white border-[#0A3895]'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                👨‍🍳 Preparando
                              </button>
                              <button
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'En camino')}
                                className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-all ${
                                  ped.estado === 'En camino'
                                    ? 'bg-[#FF8C00] text-white border-[#FF8C00]'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                🏃‍♂️ En camino
                              </button>
                              <button
                                onClick={() => manejarCambioEstadoPedido(ped.id, 'En el punto de entrega')}
                                className={`py-2 px-2 rounded-xl font-bold text-[10px] border transition-all ${
                                  ped.estado === 'En el punto de entrega'
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
                                className={`flex-1 bg-[#22C55E] text-white font-black text-xs py-2.5 rounded-xl shadow-sm ${
                                  ped.estado === 'En el punto de entrega'
                                    ? 'hover:bg-[#16a34a]'
                                    : 'opacity-40 cursor-not-allowed'
                                }`}
                              >
                                ✓ Marcar Entregado
                              </button>
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
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                tabActiva === 'productos'
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
            onClick={() => setTabActiva('pedidos')}
            className="flex flex-col items-center cursor-pointer relative"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                tabActiva === 'pedidos'
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
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                tabActiva === 'cuenta'
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

            {errorAccionPedido && <p role="alert" className="text-red-600 text-xs font-bold mb-2">{errorAccionPedido}</p>}
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
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      modoEntrega === 'propio'
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
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      modoEntrega === 'repartidor'
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
                      <input
                        type="number"
                        step="0.5"
                        value={costoParaRepartidor}
                        onChange={(e) => setCostoParaRepartidor(e.target.value)}
                        placeholder="Ej. 70"
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#FF8C00]"
                        required
                      />
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
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#FF8C00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-1">
                      ¿Dónde lo va a dejar al comprador?
                    </label>
                    <input
                      type="text"
                      value={dondeDejaRepartidor}
                      onChange={(e) => setDondeDejaRepartidor(e.target.value)}
                      placeholder="Ej. Edificio L - Salón L3"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#FF8C00]"
                      required
                    />
                  </div>
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
                    <button type="button" onClick={() => setProdImagen(null)} className="text-[10px] font-bold text-red-500">
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
                  <option value="Comida">Comida</option>
                  <option value="Postres">Postres</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Sabritas">Sabritas</option>
                  <option value="Dulces">Dulces</option>
                  <option value="Papelería">Papelería</option>
                  <option value="Tecnología">Tecnología</option>
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
                  <p className="text-[11px] text-red-600 font-bold mt-1">{errorCancelacion}</p>
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
                    onChange={(e) => setUbicacionBase(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#0A3895]"
                    required
                  />
                </div>
              </div>

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
                            className={`h-6 rounded-md text-[9px] font-black transition-all border ${
                              activo
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