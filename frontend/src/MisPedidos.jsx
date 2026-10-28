import React from 'react';
import logoCampy from './assets/logo.png';

const MisPedidos = ({ irAInicio, irAPerfil, pedido }) => {
  const esListaValida = Array.isArray(pedido) && pedido.length > 0;
  
  const pedidosPorVendedor = {};
  if (esListaValida) {
    pedido.forEach(item => {
      if (!pedidosPorVendedor[item.tienda]) {
        pedidosPorVendedor[item.tienda] = {
          tienda: item.tienda,
          ubicacion: item.ubicacion,
          items: [],
          total: 0,
          idPedido: Math.floor(Math.random() * 90000) + 10000 
        };
      }
      pedidosPorVendedor[item.tienda].items.push(item);
      pedidosPorVendedor[item.tienda].total += (item.precio * item.cantidad);
    });
  }

  const listaDeEntregas = Object.values(pedidosPorVendedor);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-white relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        <div className="bg-[#0A3895] pt-6 pb-8 px-6 rounded-b-[40px] relative z-0 shrink-0">
          <div className="flex justify-between items-center text-white">
            <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
            <img src={logoCampy} alt="Logo" className="w-12 h-auto drop-shadow-md" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 px-5 pt-4 hide-scrollbar">
          <h2 className="font-black text-xl mb-4 text-gray-900 tracking-wide uppercase">Mis Pedidos</h2>

          {!esListaValida && (
            <div className="text-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <span className="text-4xl mb-2 block">🛒</span>
              <p className="text-gray-500 font-bold">Tu carrito está vacío</p>
              <p className="text-gray-400 text-xs mt-1">Ve al inicio para agregar productos.</p>
            </div>
          )}

          {listaDeEntregas.map((entrega, index) => (
            <div key={index} className="border-2 border-[#FF8C00] rounded-3xl p-4 shadow-sm relative mb-6 bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-[#FF8C00] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                  <span>⚡</span> Pedido en camino
                </span>
                <span className="text-gray-400 text-[10px] font-bold">Pedido #{entrega.idPedido}</span>
              </div>

              <div className="flex flex-col gap-3 mb-4">
                {entrega.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0 border border-gray-200">IMG</div>
                    <div className="flex-1">
                      <h3 className="font-black text-sm text-gray-800 leading-tight">
                        <span className="text-[#FF8C00]">{item.cantidad}x</span> {item.nombre}
                      </h3>
                      <p className="text-gray-400 text-[9px] mt-0.5">Vendedor: {entrega.tienda}</p>
                    </div>
                    <span className="text-gray-800 font-black text-sm px-2">${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 my-3 pt-3 flex justify-between items-center px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total ({entrega.tienda})</span>
                <span className="text-[#FF8C00] font-black text-xl">${entrega.total.toFixed(2)}</span>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 flex gap-3 items-center mb-5 border border-gray-100 mt-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg shrink-0">C</div>
                <div className="flex-1">
                  <h4 className="font-black text-xs text-gray-800">¡Ya casi llega!</h4>
                  <p className="text-gray-500 text-[10px] leading-tight mt-0.5">
                    Tu repartidor viene desde <span className="text-[#FF8C00] font-bold">{entrega.ubicacion}</span>.
                  </p>
                </div>
                <div className="bg-white border border-[#FF8C00] text-[#FF8C00] flex flex-col items-center justify-center px-2 py-1 rounded-lg shrink-0 shadow-sm">
                  <span className="text-[8px] font-black uppercase">Llega en</span>
                  <span className="text-sm font-black">2 min</span>
                </div>
              </div>

              <div className="flex justify-between items-center relative mb-6 px-2">
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                <div className="absolute top-1/2 left-4 w-[66%] h-1 bg-[#FF8C00] -translate-y-1/2 z-0"></div>
                <div className="flex flex-col items-center z-10 gap-1 w-12"><div className="w-5 h-5 bg-[#FF8C00] rounded-full flex items-center justify-center text-white text-[10px]">✓</div><span className="text-[7px] font-black text-gray-800 uppercase">Confirmado</span></div>
                <div className="flex flex-col items-center z-10 gap-1 w-12"><div className="w-5 h-5 bg-[#FF8C00] rounded-full flex items-center justify-center text-white text-[10px]">✓</div><span className="text-[7px] font-black text-gray-800 uppercase">Preparado</span></div>
                <div className="flex flex-col items-center z-10 gap-1 w-12"><div className="w-6 h-6 bg-white border-2 border-[#FF8C00] rounded-full flex items-center justify-center text-[#FF8C00] text-xs font-bold shadow-md">⚡</div><span className="text-[7px] font-black text-[#FF8C00] uppercase">En Camino</span></div>
                <div className="flex flex-col items-center z-10 gap-1 w-12"><div className="w-5 h-5 bg-gray-200 rounded-full"></div><span className="text-[7px] font-black text-gray-400 uppercase">Entregado</span></div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-bold text-sm py-3 rounded-xl flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors">
                  <span>💬</span> Contactar
                </button>
                <button className="flex-1 bg-[#FF8C00] text-white font-bold text-sm py-3 rounded-xl shadow-lg hover:bg-[#e67e00] transition-colors">
                  Recibí mi pedido
                </button>
              </div>
            </div>
          ))}

          <h3 className="font-bold text-gray-400 text-sm mb-4 mt-8 uppercase tracking-wide">Historial de Pedidos</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3 border border-gray-100 opacity-70">
              <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0">IMG</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Entregado</span>
                  <span className="text-gray-400 text-[8px]">Ayer, 02:15 PM</span>
                </div>
                <h4 className="font-bold text-xs text-gray-800">Pay de Queso</h4>
                <p className="text-gray-400 text-[9px]">Postres Express</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-black text-sm text-gray-800">$30.00</span>
              </div>
            </div>
          </div>

        </div>

        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 py-2 flex justify-between items-end pb-6 z-20">
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1" onClick={irAInicio}><span className="text-2xl mb-1">🏠</span></div>
          <div className="flex flex-col items-center">
            <div className="bg-[#0A3895] w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5 border-4 border-white text-white text-xl">🛍️</div>
            <span className="text-[#0A3895] text-[10px] font-bold mt-1">Pedidos</span>
          </div>
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1 hover:opacity-80" onClick={irAPerfil}><span className="text-2xl mb-1">👤</span></div>
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;