
import React, { useState, useEffect } from 'react';
import logoCampy from './assets/logo.png';
import NavegacionComprador from './NavegacionComprador.jsx';
import imgTodo from './assets/TODO.png';
import imgComida from './assets/comida.png';
import imgPostres from './assets/postres.png';
import imgBebidas from './assets/bebidas.png';
import imgPapeleria from './assets/papeleria.png';
import imgTecnologia from './assets/tecnologia.png';
import imgSabritas from './assets/sabritas.png';
import imgDulces from './assets/dulces.png';
import imgCarrito from './assets/carrito.png';
import { EDIFICIOS_ITO } from './ubicacionesITO.js';
import { obtenerTarjetas } from './tarjetasDemo.js';

const HomeComprador = ({
  productos = [],
  cargandoProductos = false,
  errorProductos = '',
  recargarProductos = () => {},
  irAPedidos,
  irAMisPedidos,
  irAPerfil,
  carrito = {},
  setCarrito = () => {},
  usuarioId = null
}) => {
  const [categoriaActiva, setCategoriaActiva] = useState('Todo');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [resenasProducto, setResenasProducto] = useState([]);
  const [cargandoResenas, setCargandoResenas] = useState(false);
  const [errorResenas, setErrorResenas] = useState('');
  const [mostrarTodasResenas, setMostrarTodasResenas] = useState(false);
  // Consultar reseñas de Supabase mediante la API cuando se abre una vista previa.
  useEffect(() => {
    if (!productoSeleccionado) return;

    const idProducto = Number(productoSeleccionado.id);
    const controlador = new AbortController();
    setResenasProducto([]);
    setMostrarTodasResenas(false);
    setErrorResenas('');
    setCargandoResenas(true);

    if (!Number.isSafeInteger(idProducto) || idProducto <= 0) {
      setErrorResenas('No se pudo identificar el producto.');
      setCargandoResenas(false);
      return () => controlador.abort();
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/productos/${idProducto}/resenas`, { signal: controlador.signal })
      .then(async (respuesta) => {
        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok) throw new Error(datos?.mensaje || 'No se pudieron cargar las reseñas.');
        if (!Array.isArray(datos)) throw new Error('Respuesta de reseñas inválida.');
        return datos;
      })
      .then((datos) => setResenasProducto(datos))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setErrorResenas(error.message || 'No se pudieron cargar las reseñas.');
        }
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargandoResenas(false);
      });

    return () => controlador.abort();
  }, [productoSeleccionado?.id]);

  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [puntoEntrega, setPuntoEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [tarjetasCheckout, setTarjetasCheckout] = useState([]);
  const [tarjetaCheckout, setTarjetaCheckout] = useState('');

  const [direccionesGuardadas, setDireccionesGuardadas] = useState([]);

  useEffect(() => {
    if (!checkoutAbierto) return;
    obtenerTarjetas().then(lista => {
      setTarjetasCheckout(Array.isArray(lista) ? lista : []);
      setTarjetaCheckout(String(lista?.find(t=>t.predeterminada)?.id || lista?.[0]?.id || ''));
    }).catch(() => { setTarjetasCheckout([]); setTarjetaCheckout(''); });

    const clave = `campy_direcciones_${usuarioId ?? 'invitado'}`;

    const iniciales = [
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

    try {
      const guardadas = localStorage.getItem(clave);
      const lista = guardadas === null
        ? iniciales
        : JSON.parse(guardadas);

      setDireccionesGuardadas(
        Array.isArray(lista) ? lista : []
      );
    } catch (error) {
      console.error('No se pudieron cargar los puntos de entrega:', error);
      setDireccionesGuardadas([]);
    }
  }, [checkoutAbierto, usuarioId]);

  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const imagenCategoria = (categoria) => {
    const texto = categoria
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (texto.includes('comida') || texto.includes('alimento')) return imgComida;
    if (texto.includes('postre') || texto.includes('reposteria')) return imgPostres;
    if (texto.includes('bebida') || texto.includes('agua')) return imgBebidas;
    if (texto.includes('papeleria')) return imgPapeleria;
    if (texto.includes('tecnologia')) return imgTecnologia;
    if (texto.includes('botana') || texto.includes('sabrita') || texto.includes('snack')) return imgSabritas;
    if (texto.includes('dulce')) return imgDulces;

    return imgTodo;
  };

  const categoriasMenu = [
    { id: 'Todo', img: imgTodo },
    ...[...new Set(
      productos.map((producto) => producto.categoria).filter(Boolean)
    )].map((categoria) => ({
      id: categoria,
      img: imagenCategoria(categoria)
    }))
  ];

  const productosFiltrados = productos.filter(producto => {
    const coincideCategoria =
      categoriaActiva === 'Todo' ||
      producto.categoria === categoriaActiva;

    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.tienda.toLowerCase().includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  const manejarCantidad = (e, id, cambio) => {
    e.stopPropagation();

    setCarrito((prev) => {
      const cantidadActual = prev[id] || 0;
      const nuevaCantidad = cantidadActual + cambio;

      if (nuevaCantidad <= 0) {
        const nuevas = { ...prev };
        delete nuevas[id];
        return nuevas;
      }

      return { ...prev, [id]: nuevaCantidad };
    });
  };

  const abrirCarrito = () => {
    setCarritoAbierto(true);
  };

  const realizarPago = () => {
    if (Object.values(carrito).some((cantidad) => Number(cantidad) > 0)) {
      setErrorPedido('');
      setCarritoAbierto(false);
      setCheckoutAbierto(true);
    }
  };

  const aFechaHoraLocal = (fecha) => {
    const ajustada = new Date(
      fecha.getTime() - fecha.getTimezoneOffset() * 60000
    );
    return ajustada.toISOString().slice(0, 16);
  };

  const validarFechaEntrega = (valor) => {
    const fecha = new Date(valor);
    const ahora = new Date();

    if (!valor || !Number.isFinite(fecha.getTime())) {
      return 'Selecciona una fecha y hora de entrega válidas.';
    }

    if (fecha <= ahora) {
      return 'Selecciona una fecha y hora que todavía no hayan pasado. Puedes elegir hoy si la hora es futura.';
    }

    if (
      fecha.getTime() >
      ahora.getTime() + 30 * 24 * 60 * 60 * 1000
    ) {
      return 'Selecciona una fecha dentro de los próximos 30 días.';
    }

    const minutos =
      fecha.getHours() * 60 + fecha.getMinutes();

    if (minutos < 7 * 60 || minutos > 20 * 60) {
      return 'Solo puedes elegir horarios de entrega entre las 7:00 a. m. y las 8:00 p. m.';
    }

    return '';
  };

  const cambiarHorarioEntrega = (valor) => {
    setHorarioEntrega(valor);
    setErrorPedido(
      valor.length >= 16 ? validarFechaEntrega(valor) : ''
    );
  };

  const confirmarPedido = async (evento) => {
    evento.preventDefault();

    const errorFecha = validarFechaEntrega(horarioEntrega);

    if (errorFecha) {
      setErrorPedido(errorFecha);
      return;
    }

    if (!metodoPago) { setErrorPedido('Selecciona el método de pago.'); return; }
    if (metodoPago === 'tarjeta' && !tarjetaCheckout) {
      setErrorPedido('Primero guarda y selecciona una tarjeta de prueba en Mi cuenta.'); return;
    }
    setErrorPedido('');

    const itemsComprados = Object.entries(carrito)
      .map(([id, cantidad]) => {
        const producto = productos.find(
          (p) => String(p.id) === id
        );

        return producto ? { ...producto, cantidad } : null;
      })
      .filter(Boolean);

    if (!itemsComprados.length) {
      setErrorPedido('El carrito está vacío.');
      return;
    }

    setGuardandoPedido(true);

    try {
      await irAPedidos(itemsComprados, {
        puntoEntrega: puntoEntrega.trim(),
        horarioEntrega: new Date(horarioEntrega).toISOString(),
        metodoPago,
        idTarjeta: metodoPago === 'tarjeta' ? tarjetaCheckout : null
      });

      setCheckoutAbierto(false);
    } catch (error) {
      setErrorPedido(
        error.message || 'No fue posible guardar el pedido.'
      );
    } finally {
      setGuardandoPedido(false);
    }
  };

  const totalArticulos = Object.values(carrito).reduce(
    (a, b) => a + b,
    0
  );

  const totalPrecio = Object.entries(carrito).reduce(
    (total, [id, cantidad]) => {
      const producto = productos.find(
        p => String(p.id) === id
      );

      return total + (
        producto ? producto.precio * cantidad : 0
      );
    },
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">

        <div className="bg-[#0A3895] pt-6 pb-12 px-6 rounded-b-[40px] relative z-0 shrink-0">
          <div className="flex justify-between items-center mb-4 text-white">
            <h1 className="text-xl font-bold tracking-widest uppercase">
              Campy
            </h1>
            <img
              src={logoCampy}
              alt="Logo"
              className="w-12 h-auto drop-shadow-md"
            />
          </div>
        </div>

        <div className="px-6 -mt-8 relative z-10 flex gap-3 items-center shrink-0">
          <div className="flex-1 bg-white rounded-full shadow-lg flex items-center px-4 py-3 border border-gray-100 border-b-4 border-b-gray-200">
            <input
              type="text"
              placeholder="Buscar Productos, Vendedores..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-xs outline-none text-gray-700 font-medium"
            />
            <span className="text-gray-400 text-lg font-bold">
              Q
            </span>
          </div>

          <div
            onClick={abrirCarrito}
            className="relative bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg border border-gray-100 border-b-4 border-b-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <img
              src={imgCarrito}
              alt="Carrito"
              className="w-6 h-6 object-contain opacity-70"
            />
            {totalArticulos > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {totalArticulos}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 hide-scrollbar">
          <h2 className="font-black text-sm mb-2 font-serif tracking-wider uppercase">
            Categorías
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 hide-scrollbar">
            {categoriasMenu.map(cat => (
              <div
                key={cat.id}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
                onClick={() => setCategoriaActiva(cat.id)}
              >
                <div
                  className={`w-[70px] h-[70px] bg-white rounded-[20px] shadow-sm flex items-center justify-center p-2 border-[3px] transition-colors ${
                    categoriaActiva === cat.id
                      ? 'border-[#0A3895]'
                      : 'border-transparent'
                  }`}
                >
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt={cat.id}
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  ) : (
                    <span className="text-gray-300 text-[10px] font-bold">
                      IMG
                    </span>
                  )}
                </div>

                <span
                  className={`px-4 py-1 rounded-full text-[11px] font-black tracking-wide transition-colors ${
                    categoriaActiva === cat.id
                      ? 'bg-[#0A3895] text-white'
                      : 'bg-[#FF8C00] text-white'
                  }`}
                >
                  {cat.id}
                </span>
              </div>
            ))}
          </div>

          <h2 className="font-black text-sm mt-4 mb-4 font-serif tracking-wider">
            Disponible por ahora
          </h2>

          <div className="flex flex-col gap-4">

            {cargandoProductos && (
              <p className="text-center text-gray-400 text-sm mt-4">
                Cargando productos...
              </p>
            )}

            {!cargandoProductos && errorProductos && (
              <div className="text-center text-gray-500 text-sm mt-4">
                <p>{errorProductos}</p>
                <button
                  onClick={recargarProductos}
                  className="text-[#0A3895] font-bold mt-2"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargandoProductos &&
              !errorProductos &&
              productosFiltrados.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-4">
                  No se encontraron productos o vendedores.
                </p>
              )}

            {productosFiltrados.map((producto) => (
              <div
                key={producto.id}
                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setProductoSeleccionado(producto)}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold shrink-0 overflow-hidden">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : 'IMG'}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-800 leading-tight truncate">
                    {producto.nombre}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-gray-400 text-[10px] truncate max-w-[80px]">
                      {producto.tienda}
                    </p>

                    {Number(producto.num_resenas) > 0 && producto.calificacion != null && (
                      <span className="text-[9px] font-bold text-gray-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap" title="Promedio de calificaciones de pedidos que incluyen este producto">
                        ⭐ {Number(producto.calificacion).toFixed(1)}
                        <span className="font-medium text-gray-400">({producto.num_resenas})</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[#FF8C00] font-black text-sm mt-1">
                    ${producto.precio}
                  </p>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  {carrito[producto.id] ? (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 shadow-inner">
                      <button
                        onClick={(e) => manejarCantidad(e, producto.id, -1)}
                        className="bg-white text-gray-800 w-6 h-6 rounded-full font-bold shadow-sm active:scale-90"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-gray-800 w-3 text-center">
                        {carrito[producto.id]}
                      </span>
                      <button
                        onClick={(e) => manejarCantidad(e, producto.id, 1)}
                        className="bg-[#FF8C00] text-white w-6 h-6 rounded-full font-bold shadow-sm active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => manejarCantidad(e, producto.id, 1)}
                      className="bg-[#FF8C00] text-white w-8 h-8 rounded-full font-bold shadow-md active:scale-95"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalArticulos > 0 && (
          <div className="absolute bottom-[88px] w-full px-6 z-30 animate-[slideUp_0.3s_ease-out]">
            <button
              onClick={abrirCarrito}
              className="w-full bg-[#0A3895] hover:bg-[#082b75] text-white font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-blue-900/30 flex justify-between items-center transition-transform active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-xs">
                  {totalArticulos}
                </div>
                <span>Ver carrito / Pagar</span>
              </div>
              <span className="text-lg">
                ${totalPrecio.toFixed(2)}
              </span>
            </button>
          </div>
        )}

        <NavegacionComprador activo="inicio" irAPedidos={irAMisPedidos} irAPerfil={irAPerfil} />

        {carritoAbierto && (
          <div className="absolute inset-0 z-[55] flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setCarritoAbierto(false)}
            />

            <div className="relative bg-white w-full rounded-t-[30px] p-6 pb-8 shadow-xl max-h-[85%] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-lg text-[#0A3895]">
                  Mi carrito de compras
                </h2>
                <button
                  type="button"
                  onClick={() => setCarritoAbierto(false)}
                  className="font-bold text-gray-400"
                >
                  Cerrar ✕
                </button>
              </div>

              {totalArticulos === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-4xl">🛍️</p>
                  <p className="font-bold text-gray-800">
                    Tu carrito está vacío
                  </p>
                  <p className="text-sm text-gray-500">
                    Agrega productos desde Inicio para realizar tu pedido.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCarritoAbierto(false)}
                    className="mt-3 w-full bg-[#0A3895] text-white font-bold py-3 rounded-xl"
                  >
                    Explorar productos
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {Object.entries(carrito)
                      .filter(([, cantidad]) => Number(cantidad) > 0)
                      .map(([id, cantidad]) => {
                        const producto = productos.find(
                          (p) => String(p.id) === String(id)
                        );

                        return (
                          <div
                            key={id}
                            className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-800 truncate">
                                {producto?.nombre || 'Producto no disponible'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {producto
                                  ? `$${(Number(producto.precio) * Number(cantidad)).toFixed(2)}`
                                  : 'Actualiza el catálogo'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label="Quitar una unidad"
                                onClick={(e) => manejarCantidad(e, id, -1)}
                                className="bg-white border border-gray-200 text-gray-800 w-8 h-8 rounded-full font-bold"
                              >
                                −
                              </button>
                              <span className="text-sm font-bold text-gray-800 min-w-4 text-center">
                                {cantidad}
                              </span>
                              <button
                                type="button"
                                aria-label="Agregar una unidad"
                                onClick={(e) => manejarCantidad(e, id, 1)}
                                className="bg-[#FF8C00] text-white w-8 h-8 rounded-full font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                    <span className="font-bold text-gray-700">
                      Total ({totalArticulos} productos)
                    </span>
                    <span className="font-black text-lg text-[#FF8C00]">
                      ${totalPrecio.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={realizarPago}
                    className="w-full bg-[#FF8C00] text-white font-black py-3.5 rounded-xl"
                  >
                    Continuar al pedido
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {checkoutAbierto && (
          <div className="absolute inset-0 z-[60] flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => !guardandoPedido && setCheckoutAbierto(false)}
            />

            <form
              onSubmit={confirmarPedido}
              className="relative bg-white w-full rounded-t-[30px] p-6 pb-8 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-black text-lg text-[#0A3895]">
                  Confirmar pedido
                </h2>
                <button
                  type="button"
                  disabled={guardandoPedido}
                  onClick={() => setCheckoutAbierto(false)}
                  className="font-bold text-gray-400"
                >
                  Cerrar ✕
                </button>
              </div>

              <p className="text-xs text-gray-600">
                {totalArticulos} producto(s) · Total estimado:
                <strong> ${totalPrecio.toFixed(2)}</strong>.
                Se generará un pedido por vendedor.
              </p>

              <div className="text-xs font-bold text-gray-700">
                <label htmlFor="punto-entrega-ito">
                  Punto de entrega en el ITO
                </label>

                {direccionesGuardadas.length > 0 && (
                  <select
                    value={
                      direccionesGuardadas.some(
                        (direccion) => direccion.nombre === puntoEntrega
                      )
                        ? puntoEntrega
                        : ''
                    }
                    onChange={(e) => setPuntoEntrega(e.target.value)}
                    className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-3 bg-white outline-none focus:ring-2 focus:ring-orange-400"
                    aria-label="Seleccionar punto de entrega guardado"
                  >
                    <option value="">
                      Seleccionar punto guardado
                    </option>

                    {direccionesGuardadas.map((direccion) => (
                      <option
                        key={direccion.id}
                        value={direccion.nombre}
                      >
                        {direccion.nombre}
                        {direccion.referencia
                          ? ` — ${direccion.referencia}`
                          : ''}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  id="punto-entrega-ito"
                  type="text"
                  value={puntoEntrega}
                  onChange={(e) => setPuntoEntrega(e.target.value)}
                  maxLength={200}
                  minLength={5}
                  required
                  placeholder="O escribe otro punto de entrega"
                  list="edificios-compra-ito"
                  className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                />
                <datalist id="edificios-compra-ito">{EDIFICIOS_ITO.map(l => <option key={l} value={l} />)}</datalist>
              </div>

              <label className="block text-xs font-bold text-gray-700">
                Fecha y hora solicitada para la entrega

                <input
                  type="datetime-local"
                  value={horarioEntrega}
                  min={aFechaHoraLocal(
                    new Date(Math.ceil(Date.now() / 60000) * 60000)
                  )}
                  max={aFechaHoraLocal(
                    new Date(Date.now() + 30 * 86400000)
                  )}
                  onChange={(e) => cambiarHorarioEntrega(e.target.value)}
                  required
                  className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-orange-400"
                />

                <span className="block mt-1 text-[11px] text-gray-500">
                  Puedes elegir hoy si la hora aún no ha pasado.
                  Horario: 7:00 a. m. a 8:00 p. m. (máximo 30 días).
                </span>
              </label>

              <fieldset className="rounded-2xl border border-blue-100 bg-[#F4F7FD] p-3 space-y-2">
                <legend className="text-xs font-black text-[#0A3895] px-1">Método de pago</legend>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['efectivo','Efectivo'],['transferencia','Transferencia'],['tarjeta','Tarjeta']].map(([clave,nombre]) => (
                    <button key={clave} type="button" aria-pressed={metodoPago===clave}
                      onClick={() => setMetodoPago(clave)}
                      className={`rounded-xl p-2 text-[11px] font-bold border ${metodoPago===clave?'bg-[#0A3895] text-white border-[#0A3895]':'bg-white text-gray-700 border-gray-200'}`}>
                      {nombre}
                    </button>
                  ))}
                </div>
                {metodoPago==='tarjeta' && (
                  <div>
                    <label className="text-xs text-gray-700">Tarjeta de prueba guardada</label>
                    <select value={tarjetaCheckout} onChange={e=>setTarjetaCheckout(e.target.value)}
                      className="w-full bg-white rounded-lg border border-gray-200 p-2 mt-1 text-xs">
                      <option value="">Seleccionar tarjeta</option>
                      {tarjetasCheckout.map(t=><option key={t.id} value={t.id}>{t.marca} ···· {t.ultimos4}</option>)}
                    </select>
                    {!tarjetasCheckout.length && <p className="text-red-600 text-xs mt-1">Agrega una tarjeta de prueba desde Mi cuenta.</p>}
                  </div>
                )}
                <p className="text-[10px] text-gray-500">Elegir un método no realiza ningún cobro automático.</p>
              </fieldset>

              <p className="text-xs text-gray-500">
                El envío del pedido no realiza ningún cobro.
                El vendedor debe confirmar la entrega.
              </p>

              {errorPedido && (
                <p
                  role="alert"
                  className="text-xs text-red-600 font-bold"
                >
                  {errorPedido}
                </p>
              )}

              <button
                type="submit"
                disabled={guardandoPedido}
                className="w-full bg-[#FF8C00] text-white font-black py-3.5 rounded-xl disabled:opacity-60"
              >
                {guardandoPedido
                  ? 'REALIZANDO PEDIDO...'
                  : 'CONFIRMAR Y ENVIAR PEDIDO'}
              </button>
            </form>
          </div>
        )}

        {/* VISTA PREVIA DEL PRODUCTO: diseño premium, lógica del carrito intacta */}
        {productoSeleccionado && (
          <div className="absolute inset-0 z-[50] flex items-end justify-center">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default bg-[#06132B]/75 backdrop-blur-[5px]"
              onClick={() => setProductoSeleccionado(null)}
              aria-label="Cerrar vista previa del producto"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Vista previa de ${productoSeleccionado.nombre}`}
              className="relative z-10 flex max-h-[94%] w-full flex-col overflow-hidden rounded-t-[36px] bg-[#F8FAFD] shadow-[0_-20px_75px_rgba(0,0,0,0.35)]"
            >
              <div className="absolute left-1/2 top-2.5 z-20 h-1.5 w-11 -translate-x-1/2 rounded-full bg-white/75 shadow-sm" />

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
                {/* Foto hero y detalles superpuestos */}
                <div className="relative h-[295px] w-full overflow-hidden bg-[#DCE5F1] sm:h-[325px]">
                  {productoSeleccionado.imagen_url ? (
                    <img
                      src={productoSeleccionado.imagen_url}
                      alt={productoSeleccionado.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#D9E6FA] via-white to-[#FFE1BE] text-[#0A3895]">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m3 17 5-5 4 4 3-3 6 6" />
                      </svg>
                      <span className="text-xs font-semibold tracking-wide">Fotografía no disponible</span>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07172D]/75 via-[#07172D]/25 to-transparent" />

                  <button
                    type="button"
                    aria-label="Cerrar vista previa"
                    onClick={() => setProductoSeleccionado(null)}
                    className="absolute right-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#14233D] shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {productoSeleccionado.categoria && (
                    <span className="absolute left-5 top-6 max-w-[65%] truncate rounded-full border border-white/70 bg-white/95 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-[#0A3895] shadow-md">
                      {productoSeleccionado.categoria}
                    </span>
                  )}

                  <div className="absolute bottom-6 left-5 right-5 flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200">Descubre tu antojo</p>
                      <h2 className="break-words text-[26px] font-black leading-[1.08] text-white drop-shadow-sm">
                        {productoSeleccionado.nombre}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Precio y valoración */}
                <div className="relative -mt-3 rounded-t-[28px] bg-[#F8FAFD] px-5 pt-5 pb-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">Precio por unidad</p>
                      <p className="mt-0.5 text-[34px] font-black leading-none tracking-tight text-[#F07C00]">
                        ${Number(productoSeleccionado.precio || 0).toFixed(2)}
                      </p>
                    </div>
                    {Number(productoSeleccionado.num_resenas) > 0 && productoSeleccionado.calificacion != null ? (
                      <div className="flex items-center gap-1.5 rounded-2xl border border-amber-100 bg-[#FFF3DE] px-3 py-2.5 text-[#93530A]" title="Calificación de compradores">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l6.9-1L12 2Z" /></svg>
                        <div className="leading-tight">
                          <p className="text-sm font-black">{Number(productoSeleccionado.calificacion).toFixed(1)}</p>
                          <p className="text-[9px] font-medium">{productoSeleccionado.num_resenas} reseñas</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-[#EAF1FF] px-3 py-2 text-[10px] font-bold text-[#0A3895]">
                        Hecho para tu antojo
                      </div>
                    )}
                  </div>

                  <div className="my-5 h-px bg-slate-200/80" />

                  {/* Vendedor y ubicación reales */}
                  <div className="rounded-[22px] border border-[#E4EAF5] bg-white p-4 shadow-[0_5px_22px_rgba(10,56,149,0.04)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0FF] text-[#0A3895]">
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 10h18l-2-6H5l-2 6ZM4 10v10h16V10M9 20v-6h6v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lo prepara / vende</p>
                        <p className="mt-0.5 break-words text-sm font-black text-[#102C5F]">{productoSeleccionado.tienda || 'Vendedor CAMPY'}</p>
                      </div>
                    </div>
                    {productoSeleccionado.ubicacion && (
                      <div className="mt-3 flex items-start gap-2.5 border-t border-slate-100 pt-3">
                        <svg className="mt-0.5 shrink-0 text-[#F07C00]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
                        </svg>
                        <p className="break-words text-xs font-medium leading-relaxed text-slate-600">{productoSeleccionado.ubicacion}</p>
                      </div>
                    )}
                  </div>

                  {productoSeleccionado.descripcion && (
                    <section className="mt-5" aria-label="Descripción del producto">
                      <h3 className="flex items-center gap-2 text-sm font-black text-[#102C5F]">
                        <span className="h-5 w-1 rounded-full bg-[#FF8C00]" />
                        ¿Qué incluye este producto?
                      </h3>
                      <p className="mt-2 whitespace-pre-line break-words text-[13px] leading-[1.8] text-slate-600">
                        {productoSeleccionado.descripcion}
                      </p>
                    </section>
                  )}


                  {/* Reseñas publicadas en Supabase para este producto */}
                  <section className="mt-6" aria-label="Reseñas del producto">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-[#FF8C00]" />
                        <h3 className="text-sm font-black text-[#102C5F]">Reseñas de pedidos con este producto</h3>
                      </div>
                      {!cargandoResenas && !errorResenas && resenasProducto.length > 0 && (
                        <span className="rounded-full bg-[#EEF3FC] px-2.5 py-1 text-[10px] font-bold text-[#0A3895]">
                          {resenasProducto.length} {resenasProducto.length === 1 ? 'opinión' : 'opiniones'}
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-[11px] leading-relaxed text-slate-500">Estas calificaciones corresponden a pedidos que incluyeron este producto y pueden valorar la compra completa.</p>

                    {cargandoResenas ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-xs text-slate-500" role="status">
                        Cargando opiniones reales...
                      </div>
                    ) : errorResenas ? (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-700" role="alert">
                        {errorResenas}
                      </div>
                    ) : resenasProducto.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center">
                        <p className="text-sm font-bold text-[#102C5F]">Aún no hay reseñas</p>
                        <p className="mt-1 text-xs text-slate-500">Todavía no hay pedidos calificados que incluyan este producto.</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-amber-100 bg-[#FFF9ED] p-3">
                          <span className="text-3xl font-black text-[#A65B0A]">
                            {(resenasProducto.reduce((suma, item) => suma + Number(item.estrellas || 0), 0) / resenasProducto.length).toFixed(1)}
                          </span>
                          <div>
                            <p className="text-sm tracking-[2px] text-amber-500" aria-label="Calificación de cinco estrellas">★★★★★</p>
                            <p className="text-[11px] text-slate-600">Promedio de las reseñas mostradas</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {(mostrarTodasResenas ? resenasProducto : resenasProducto.slice(0, 3)).map((resena) => (
                            <article key={resena.id_calificacion} className="rounded-[20px] border border-[#E5EAF2] bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] text-xs font-black text-[#0A3895]">
                                    {String(resena.comprador || 'C').slice(0, 1).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-black text-[#102C5F]">{resena.comprador || 'Comprador'}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {resena.fecha_calificacion && !Number.isNaN(new Date(resena.fecha_calificacion).getTime())
                                        ? new Date(resena.fecha_calificacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'Compra calificada'}
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-[12px] tracking-[1px] text-amber-500" aria-label={`${resena.estrellas} de 5 estrellas`}>
                                  {'★'.repeat(Math.max(0, Math.min(5, Number(resena.estrellas) || 0)))}
                                  <span className="text-slate-200">{'★'.repeat(5 - Math.max(0, Math.min(5, Number(resena.estrellas) || 0)))}</span>
                                </span>
                              </div>
                              <p className="mt-3 whitespace-pre-line break-words text-xs leading-relaxed text-slate-600">
                                {String(resena.comentario || '').trim() || 'El comprador calificó su experiencia sin dejar un comentario.'}
                              </p>
                            </article>
                          ))}
                        </div>

                        {resenasProducto.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setMostrarTodasResenas((actual) => !actual)}
                            className="mt-3 w-full rounded-xl border border-[#C9D8F2] bg-white py-3 text-xs font-black text-[#0A3895] transition-colors hover:bg-blue-50"
                          >
                            {mostrarTodasResenas ? 'Mostrar menos opiniones' : `Ver más opiniones (${resenasProducto.length})`}
                          </button>
                        )}
                      </>
                    )}
                  </section>
                </div>
              </div>

              {/* Acciones inferiores fijas: misma función de agregar al carrito */}
              <div className="shrink-0 border-t border-[#E5EAF3] bg-white px-5 pt-3 pb-6 shadow-[0_-8px_32px_rgba(18,38,72,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    manejarCantidad(
                      { stopPropagation: () => {} },
                      productoSeleccionado.id,
                      1
                    );
                    setProductoSeleccionado(null);
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0A3895] to-[#1555B7] px-4 py-4 text-sm font-black text-white shadow-[0_8px_20px_rgba(10,56,149,0.25)] transition-transform hover:brightness-110 active:scale-[0.98]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 4h2l2.2 11h11.4l2-8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M13 8v6m-3-3h6" />
                  </svg>
                  Agregar al carrito
                  <span className="ml-auto rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold">+1</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeComprador;
