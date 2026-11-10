import React, { useState } from 'react';
import logoCampy from './assets/logo.png'; 
import imgTodo from './assets/TODO.png';
import imgComida from './assets/comida.png';
import imgPostres from './assets/postres.png';
import imgBebidas from './assets/bebidas.png';
import imgPapeleria from './assets/papeleria.png';
import imgTecnologia from './assets/tecnologia.png';
import imgSabritas from './assets/sabritas.png';
import imgDulces from './assets/dulces.png';
import imgCarrito from './assets/carrito.png'; 

const HomeComprador = ({ productos = [], cargandoProductos = false, errorProductos = '', recargarProductos = () => {}, irAPedidos, irAMisPedidos, irAPerfil, carrito = {}, setCarrito = () => {} }) => {
  const [categoriaActiva, setCategoriaActiva] = useState('Todo');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [puntoEntrega, setPuntoEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState('');
  
  const [busqueda, setBusqueda] = useState('');

  const imagenCategoria = (categoria) => {
    const texto = categoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
    ...[...new Set(productos.map((producto) => producto.categoria).filter(Boolean))]
      .map((categoria) => ({ id: categoria, img: imagenCategoria(categoria) })),
  ];

  const productosFiltrados = productos.filter(producto => {
    const coincideCategoria = categoriaActiva === 'Todo' || producto.categoria === categoriaActiva;
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
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
    const ajustada = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
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
    if (fecha.getTime() > ahora.getTime() + 30 * 24 * 60 * 60 * 1000) {
      return 'Selecciona una fecha dentro de los próximos 30 días.';
    }
    const minutos = fecha.getHours() * 60 + fecha.getMinutes();
    if (minutos < 7 * 60 || minutos > 18 * 60) {
      return 'Solo puedes elegir horarios de entrega entre las 7:00 a. m. y las 6:00 p. m.';
    }
    return '';
  };

  const cambiarHorarioEntrega = (valor) => {
    setHorarioEntrega(valor);
    setErrorPedido(valor.length >= 16 ? validarFechaEntrega(valor) : '');
  };

  const confirmarPedido = async (evento) => {
    evento.preventDefault();
    const errorFecha = validarFechaEntrega(horarioEntrega);
    if (errorFecha) {
      setErrorPedido(errorFecha);
      return;
    }
    setErrorPedido('');
    const itemsComprados = Object.entries(carrito).map(([id, cantidad]) => {
      const producto = productos.find((p) => String(p.id) === id);
      return producto ? { ...producto, cantidad } : null;
    }).filter(Boolean);
    if (!itemsComprados.length) {
      setErrorPedido('El carrito está vacío.');
      return;
    }
    setGuardandoPedido(true);
    try {
      await irAPedidos(itemsComprados, {
        puntoEntrega: puntoEntrega.trim(),
        horarioEntrega: new Date(horarioEntrega).toISOString()
      });
      setCheckoutAbierto(false);
    } catch (error) {
      setErrorPedido(error.message || 'No fue posible guardar el pedido.');
    } finally {
      setGuardandoPedido(false);
    }
  };

  const totalArticulos = Object.values(carrito).reduce((a, b) => a + b, 0);
  const totalPrecio = Object.entries(carrito).reduce((total, [id, cantidad]) => {
    const producto = productos.find(p => String(p.id) === id);
    return total + (producto ? producto.precio * cantidad : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        <div className="bg-[#0A3895] pt-6 pb-12 px-6 rounded-b-[40px] relative z-0 shrink-0">
          <div className="flex justify-between items-center mb-4 text-white">
            <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
            <img src={logoCampy} alt="Logo" className="w-12 h-auto drop-shadow-md" />
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
            <span className="text-gray-400 text-lg font-bold">Q</span>
          </div>
          
          <div onClick={abrirCarrito} className="relative bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg border border-gray-100 border-b-4 border-b-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <img src={imgCarrito} alt="Carrito" className="w-6 h-6 object-contain opacity-70" />
            {totalArticulos > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{totalArticulos}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32 px-5 pt-6 hide-scrollbar">
          <h2 className="font-black text-sm mb-2 font-serif tracking-wider uppercase">Categorías</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 hide-scrollbar">
            {categoriasMenu.map(cat => (
              <div key={cat.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer" onClick={() => setCategoriaActiva(cat.id)}>
                <div className={`w-[70px] h-[70px] bg-white rounded-[20px] shadow-sm flex items-center justify-center p-2 border-[3px] transition-colors ${categoriaActiva === cat.id ? 'border-[#0A3895]' : 'border-transparent'}`}>
                  {cat.img ? (
                    <img src={cat.img} alt={cat.id} className="w-full h-full object-contain drop-shadow-sm" />
                  ) : (
                    <span className="text-gray-300 text-[10px] font-bold">IMG</span>
                  )}
                </div>
                <span className={`px-4 py-1 rounded-full text-[11px] font-black tracking-wide transition-colors ${categoriaActiva === cat.id ? 'bg-[#0A3895] text-white' : 'bg-[#FF8C00] text-white'}`}>
                  {cat.id}
                </span>
              </div>
            ))}
          </div>

          <h2 className="font-black text-sm mt-4 mb-4 font-serif tracking-wider">Disponible por ahora</h2>
          <div className="flex flex-col gap-4">

            {cargandoProductos && (
              <p className="text-center text-gray-400 text-sm mt-4">Cargando productos...</p>
            )}

            {!cargandoProductos && errorProductos && (
              <div className="text-center text-gray-500 text-sm mt-4">
                <p>{errorProductos}</p>
                <button onClick={recargarProductos} className="text-[#0A3895] font-bold mt-2">Reintentar</button>
              </div>
            )}

            {!cargandoProductos && !errorProductos && productosFiltrados.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-4">No se encontraron productos o vendedores.</p>
            )}

            {productosFiltrados.map((producto) => (
              <div key={producto.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setProductoSeleccionado(producto)}>
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold shrink-0 overflow-hidden">{producto.imagen_url ? <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" /> : 'IMG'}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-800 leading-tight">{producto.nombre}</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">{producto.tienda}</p>
                  <p className="text-[#FF8C00] font-black text-sm mt-1">${producto.precio}</p>
                </div>
                
                <div onClick={(e) => e.stopPropagation()}>
                  {carrito[producto.id] ? (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 shadow-inner">
                      <button onClick={(e) => manejarCantidad(e, producto.id, -1)} className="bg-white text-gray-800 w-6 h-6 rounded-full font-bold shadow-sm active:scale-90">-</button>
                      <span className="font-bold text-sm text-gray-800 w-3 text-center">{carrito[producto.id]}</span>
                      <button onClick={(e) => manejarCantidad(e, producto.id, 1)} className="bg-[#FF8C00] text-white w-6 h-6 rounded-full font-bold shadow-sm active:scale-90">+</button>
                    </div>
                  ) : (
                    <button onClick={(e) => manejarCantidad(e, producto.id, 1)} className="bg-[#FF8C00] text-white w-8 h-8 rounded-full font-bold shadow-md active:scale-95">+</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalArticulos > 0 && (
          <div className="absolute bottom-[88px] w-full px-6 z-30 animate-[slideUp_0.3s_ease-out]">
            <button onClick={abrirCarrito} className="w-full bg-[#0A3895] hover:bg-[#082b75] text-white font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-blue-900/30 flex justify-between items-center transition-transform active:scale-95">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-7 h-7 rounded-full flex items-center justify-center text-xs">{totalArticulos}</div>
                <span>Ver carrito / Pagar</span>
              </div>
              <span className="text-lg">${totalPrecio.toFixed(2)}</span>
            </button>
          </div>
        )}

        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 py-2 flex justify-between items-end pb-6 z-20">
          <div className="flex flex-col items-center">
            <div className="bg-[#0A3895] w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5 border-4 border-white text-white text-xl">🏠</div>
            <span className="text-[#0A3895] text-[10px] font-bold mt-1">Inicio</span>
          </div>
          <button type="button" onClick={irAMisPedidos} aria-label="Ver mis pedidos" className="flex flex-col items-center opacity-40 cursor-pointer pb-1 hover:opacity-80"><span className="text-2xl mb-1">📋</span><span className="text-[10px] font-bold mt-1">Pedidos</span></button>
          <div onClick={irAPerfil} className="flex flex-col items-center opacity-40 cursor-pointer pb-1 hover:opacity-80"><span className="text-2xl mb-1">👤</span></div>
        </div>

        {carritoAbierto && (
          <div className="absolute inset-0 z-[55] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCarritoAbierto(false)} />
            <div className="relative bg-white w-full rounded-t-[30px] p-6 pb-8 shadow-xl max-h-[85%] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-lg text-[#0A3895]">Mi carrito de compras</h2>
                <button type="button" onClick={() => setCarritoAbierto(false)} className="font-bold text-gray-400">Cerrar ✕</button>
              </div>
              {totalArticulos === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-4xl">🛍️</p>
                  <p className="font-bold text-gray-800">Tu carrito está vacío</p>
                  <p className="text-sm text-gray-500">Agrega productos desde Inicio para realizar tu pedido.</p>
                  <button type="button" onClick={() => setCarritoAbierto(false)} className="mt-3 w-full bg-[#0A3895] text-white font-bold py-3 rounded-xl">Explorar productos</button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {Object.entries(carrito).filter(([, cantidad]) => Number(cantidad) > 0).map(([id, cantidad]) => {
                      const producto = productos.find((p) => String(p.id) === String(id));
                      return (
                        <div key={id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 truncate">{producto?.nombre || 'Producto no disponible'}</p>
                            <p className="text-xs text-gray-500">{producto ? `$${(Number(producto.precio) * Number(cantidad)).toFixed(2)}` : 'Actualiza el catálogo'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" aria-label="Quitar una unidad" onClick={(e) => manejarCantidad(e, id, -1)} className="bg-white border border-gray-200 text-gray-800 w-8 h-8 rounded-full font-bold">−</button>
                            <span className="text-sm font-bold text-gray-800 min-w-4 text-center">{cantidad}</span>
                            <button type="button" aria-label="Agregar una unidad" onClick={(e) => manejarCantidad(e, id, 1)} className="bg-[#FF8C00] text-white w-8 h-8 rounded-full font-bold">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                    <span className="font-bold text-gray-700">Total ({totalArticulos} productos)</span>
                    <span className="font-black text-lg text-[#FF8C00]">${totalPrecio.toFixed(2)}</span>
                  </div>
                  <button type="button" onClick={realizarPago} className="w-full bg-[#FF8C00] text-white font-black py-3.5 rounded-xl">Continuar al pedido</button>
                </>
              )}
            </div>
          </div>
        )}

        {checkoutAbierto && (
          <div className="absolute inset-0 z-[60] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => !guardandoPedido && setCheckoutAbierto(false)} />
            <form onSubmit={confirmarPedido} className="relative bg-white w-full rounded-t-[30px] p-6 pb-8 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-lg text-[#0A3895]">Confirmar pedido</h2>
                <button type="button" disabled={guardandoPedido} onClick={() => setCheckoutAbierto(false)} className="font-bold text-gray-400">Cerrar ✕</button>
              </div>
              <p className="text-xs text-gray-600">{totalArticulos} producto(s) · Total estimado: <strong>${totalPrecio.toFixed(2)}</strong>. Se generará un pedido por vendedor.</p>
              <label className="block text-xs font-bold text-gray-700">
                Punto de entrega en el ITO
                <input value={puntoEntrega} onChange={(e) => setPuntoEntrega(e.target.value)} maxLength={200} minLength={5} required placeholder="Ej. Biblioteca, entrada principal" className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-orange-400" />
              </label>
              <label className="block text-xs font-bold text-gray-700">
                Fecha y hora solicitada para la entrega
                <input type="datetime-local" value={horarioEntrega} min={aFechaHoraLocal(new Date(Math.ceil(Date.now() / 60000) * 60000))} max={aFechaHoraLocal(new Date(Date.now() + 30 * 86400000))} onChange={(e) => cambiarHorarioEntrega(e.target.value)} required className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-orange-400" />
                <span className="block mt-1 text-[11px] text-gray-500">Puedes elegir hoy si la hora aún no ha pasado. Horario: 7:00 a. m. a 6:00 p. m. (máximo 30 días).</span>
              </label>
              <p className="text-xs text-gray-500">El envío del pedido no realiza ningún cobro. El vendedor debe confirmar la entrega.</p>
              {errorPedido && <p role="alert" className="text-xs text-red-600 font-bold">{errorPedido}</p>}
              <button type="submit" disabled={guardandoPedido} className="w-full bg-[#FF8C00] text-white font-black py-3.5 rounded-xl disabled:opacity-60">
                {guardandoPedido ? 'GUARDANDO EN SUPABASE...' : 'CONFIRMAR Y ENVIAR PEDIDO'}
              </button>
            </form>
          </div>
        )}

        {productoSeleccionado && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProductoSeleccionado(null)}></div>
            <div className="bg-white w-full rounded-t-[30px] p-6 pb-8 relative z-10 animate-[slideUp_0.3s_ease-out]">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <div className="flex gap-4 items-center mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold shrink-0 overflow-hidden">{productoSeleccionado.imagen_url ? <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.nombre} className="w-full h-full object-cover" /> : 'IMG'}</div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">{productoSeleccionado.nombre}</h2>
                  <p className="text-[#FF8C00] font-black text-xl mt-1">${productoSeleccionado.precio}</p>
                </div>
              </div>
              <div className="bg-[#F4F7FD] rounded-2xl p-4 mb-4 border border-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500 text-sm">👤</span><span className="font-bold text-sm text-gray-800">{productoSeleccionado.tienda}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 text-sm mt-0.5">📍</span><span className="text-xs text-gray-500 font-medium">{productoSeleccionado.ubicacion}</span>
                </div>
              </div>
              <button 
                onClick={() => { manejarCantidad({ stopPropagation: () => {} }, productoSeleccionado.id, 1); setProductoSeleccionado(null); }}
                className="w-full bg-[#0A3895] hover:bg-[#082b75] text-white font-bold text-lg py-4 rounded-2xl shadow-lg mt-4 active:scale-95"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeComprador;