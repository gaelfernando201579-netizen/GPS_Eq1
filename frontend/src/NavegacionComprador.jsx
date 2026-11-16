import React from 'react';

const opciones = [
  { id: 'inicio', icono: '🏠', etiqueta: 'Inicio' },
  { id: 'pedidos', icono: '📋', etiqueta: 'Pedidos' },
  { id: 'perfil', icono: '👤', etiqueta: 'Perfil' }
];

export default function NavegacionComprador({ activo, irAInicio, irAPedidos, irAPerfil }) {
  const acciones = { inicio: irAInicio, pedidos: irAPedidos, perfil: irAPerfil };
  return (
    <nav aria-label="Menú del comprador" className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 py-2 flex justify-between items-end pb-6 z-20">
      {opciones.map(opcion => {
        const seleccionada = activo === opcion.id;
        return (
          <button
            key={opcion.id}
            type="button"
            aria-current={seleccionada ? 'page' : undefined}
            onClick={acciones[opcion.id]}
            className={`flex flex-col items-center transition-opacity ${seleccionada ? '' : 'opacity-50 hover:opacity-80'}`}
          >
            <span className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${seleccionada ? 'bg-[#0A3895] text-white shadow-lg -mt-5 border-4 border-white' : ''}`}>
              {opcion.icono}
            </span>
            <span className={`text-[10px] font-bold mt-1 ${seleccionada ? 'text-[#0A3895]' : 'text-gray-600'}`}>
              {opcion.etiqueta}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
