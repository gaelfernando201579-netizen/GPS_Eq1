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

const HomeComprador = ({ irAPedidos, irAPerfil, carrito = {}, setCarrito = () => {} }) => {
  const [categoriaActiva, setCategoriaActiva] = useState('Todo');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  const [busqueda, setBusqueda] = useState('');

  const todosLosProductos = [
    { id: 1, nombre: 'Torta de Jamón', tienda: 'Vende: Juan Pérez', ubicacion: 'Edificio L', precio: 35, categoria: 'Comida' },
    { id: 2, nombre: 'Croissant Preparado', tienda: 'Vende: Ana Gómez', ubicacion: 'Kiosco Central', precio: 45, categoria: 'Comida' },
    { id: 3, nombre: 'Rebanada de Pizza', tienda: 'Vende: Luis', ubicacion: 'Canchas', precio: 25, categoria: 'Comida' },
    { id: 4, nombre: 'Fresas con Crema', tienda: 'Vende: María', ubicacion: 'Entrada Principal', precio: 45, categoria: 'Postres' },
    { id: 5, nombre: 'Tartaletas de Frutas', tienda: 'Vende: Sofía', ubicacion: 'Edificio D', precio: 30, categoria: 'Postres' },
    { id: 6, nombre: 'Memoria USB 32GB', tienda: 'Vende: Carlos', ubicacion: 'Biblioteca', precio: 120, categoria: 'Tecnología' },
    { id: 7, nombre: 'Paquete 5 Folders', tienda: 'Vende: Diana', ubicacion: 'Biblioteca', precio: 15, categoria: 'Papelería' },
    { id: 8, nombre: 'Coca-Cola 600ml', tienda: 'Vende: Juan Pérez', ubicacion: 'Edificio L', precio: 20, categoria: 'Bebidas' },
    { id: 9, nombre: 'Arizona de Sandía', tienda: 'Vende: Luis', ubicacion: 'Canchas', precio: 25, categoria: 'Bebidas' },
    { id: 10, nombre: 'Electrolit Fresa', tienda: 'Vende: Ana Gómez', ubicacion: 'Kiosco Central', precio: 32, categoria: 'Bebidas' },
    { id: 11, nombre: 'Doritos Nacho', tienda: 'Vende: Pedro', ubicacion: 'Pasillo Central', precio: 18, categoria: 'Sabritas' },
    { id: 12, nombre: 'Picafresas (10pz)', tienda: 'Vende: María', ubicacion: 'Entrada Principal', precio: 15, categoria: 'Dulces' },
  ];

  const categoriasMenu = [
    { id: 'Todo', img: imgTodo },
    { id: 'Comida', img: imgComida },
    { id: 'Postres', img: imgPostres },
    { id: 'Bebidas', img: imgBebidas },
    { id: 'Sabritas', img: imgSabritas },
    { id: 'Dulces', img: imgDulces },
    { id: 'Papelería', img: imgPapeleria },
    { id: 'Tecnología', img: imgTecnologia },
  ];

  const productosFiltrados = todosLosProductos.filter(producto => {
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

  const realizarPago = () => {
    const itemsComprados = Object.entries(carrito).map(([id, cantidad]) => {
      const prod = todosLosProductos.find(p => p.id === parseInt(id));
      return { ...prod, cantidad };
    });
    irAPedidos(itemsComprados);
  };

  const totalArticulos = Object.values(carrito).reduce((a, b) => a + b, 0);
  const totalPrecio = Object.entries(carrito).reduce((total, [id, cantidad]) => {
    const producto = todosLosProductos.find(p => p.id === parseInt(id));
    return total + (producto.precio * cantidad);
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
          
          <div onClick={realizarPago} className="relative bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg border border-gray-100 border-b-4 border-b-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
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

            {productosFiltrados.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-4">No se encontraron productos o vendedores.</p>
            )}

            {productosFiltrados.map((producto) => (
              <div key={producto.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setProductoSeleccionado(producto)}>
                <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">IMG</div>
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
            <button onClick={realizarPago} className="w-full bg-[#0A3895] hover:bg-[#082b75] text-white font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-blue-900/30 flex justify-between items-center transition-transform active:scale-95">
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
          <div onClick={realizarPago} className="flex flex-col items-center opacity-40 cursor-pointer pb-1 hover:opacity-80"><span className="text-2xl mb-1">🛍️</span></div>
          <div onClick={irAPerfil} className="flex flex-col items-center opacity-40 cursor-pointer pb-1 hover:opacity-80"><span className="text-2xl mb-1">👤</span></div>
        </div>

        {productoSeleccionado && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProductoSeleccionado(null)}></div>
            <div className="bg-white w-full rounded-t-[30px] p-6 pb-8 relative z-10 animate-[slideUp_0.3s_ease-out]">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <div className="flex gap-4 items-center mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">IMG</div>
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