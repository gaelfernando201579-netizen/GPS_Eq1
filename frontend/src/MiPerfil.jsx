import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const MiPerfil = ({ irAInicio, irAPedidos, cerrarSesion }) => {
  const [modoEmprendedor, setModoEmprendedor] = useState(false);
  const [modalActivo, setModalActivo] = useState(null); 

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-gray-50 relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        {/* ENCABEZADO AZUL CON ONDAS */}
        <div className="bg-[#0A3895] pt-6 pb-16 px-6 relative z-0 shrink-0">
          <div className="flex justify-between items-center text-white mb-6">
            <h1 className="text-xl font-bold tracking-widest uppercase">Campy</h1>
            <img src={logoCampy} alt="Logo" className="w-12 h-auto drop-shadow-md" />
          </div>
          <h2 className="text-white font-black text-2xl tracking-wide uppercase">Mi Cuenta</h2>
          
          {/* ONDA DE FONDO BLANCO */}
          <div className="absolute -bottom-1 left-0 w-full">
            <svg viewBox="0 0 1440 320" className="w-full h-auto">
              <path fill="#F9FAFB" fillOpacity="1" d="M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,176C672,181,768,139,864,117.3C960,96,1056,96,1152,112C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto pb-32 px-5 z-10 -mt-2 hide-scrollbar">
          
          <div className="bg-gradient-to-br from-[#E0F2FE] to-[#D1FAE5] rounded-3xl p-5 shadow-sm border border-blue-100 mb-6 relative overflow-hidden">
            <div className="flex gap-4 items-center mb-5 relative z-10">

              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white">
                👩🏻‍💻
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[15px] text-gray-900 leading-tight">Cintia Yadai Salinas Montesinos</h3>
                <p className="text-gray-600 text-xs mt-1 font-medium">Ing. Sistemas Computacionales</p>
              </div>
            </div>

            <div className="w-full h-px bg-blue-200/50 mb-4"></div>

            <div className="flex justify-between items-center relative z-10">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Modo Emprendedor</h4>
                <p className="text-[9px] text-gray-500 mt-0.5">Activa esta opción para publicar y vender tus productos.</p>
              </div>
              
              <button 
                onClick={() => setModoEmprendedor(!modoEmprendedor)}
                className={`w-14 h-8 rounded-full transition-colors duration-300 relative flex items-center px-1 shadow-inner ${modoEmprendedor ? 'bg-[#0A3895]' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${modoEmprendedor ? 'transform translate-x-6' : ''}`}></div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            
            <button onClick={() => setModalActivo('editar')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-lg">👤</div>
                <span className="font-bold text-gray-700 text-sm">Editar Perfil</span>
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


            {modoEmprendedor && (
              <button onClick={() => setModalActivo('direcciones')} className="w-full flex items-center justify-between p-4 hover:bg-green-50 transition-colors animate-[slideUp_0.2s_ease-out]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-lg">📍</div>
                  <span className="font-bold text-gray-700 text-sm">Mis Direcciones</span>
                </div>
                <span className="text-gray-300 font-bold">➔</span>
              </button>
            )}
          </div>

          <button 
            onClick={cerrarSesion}
            className="w-full bg-[#FFF0F0] text-[#FF4D4D] font-bold text-sm py-4 rounded-2xl flex justify-center items-center gap-2 hover:bg-[#FFE5E5] transition-colors border border-[#FFE5E5]"
          >
            <span></span> Cerrar Sesión
          </button>

        </div>

        <div className="absolute bottom-0 w-full bg-white rounded-t-[30px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] px-8 py-2 flex justify-between items-end pb-6 z-20">
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1" onClick={irAInicio}>
            <span className="text-2xl mb-1">🏠</span>
          </div>
          <div className="flex flex-col items-center opacity-40 cursor-pointer pb-1" onClick={irAPedidos}>
            <span className="text-2xl mb-1">🛍️</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-[#0A3895] w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-5 border-4 border-white text-white text-xl">
              👤
            </div>
            <span className="text-[#0A3895] text-[10px] font-bold mt-1">Perfil</span>
          </div>
        </div>

        
        {modalActivo && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setModalActivo(null)}></div>
        )}

        {modalActivo === 'editar' && (
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-[#0A3895] mb-6">Editar Perfil</h2>
            <div className="flex flex-col gap-4">
              <input type="text" defaultValue="Cintia Yadai Salinas Montesinos" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-500" />
              <input type="text" defaultValue="Ing. Sistemas Computacionales" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 outline-none focus:border-blue-500" />
              <input type="tel" placeholder="Número de teléfono" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500" />
              <button onClick={() => setModalActivo(null)} className="w-full bg-[#0A3895] text-white font-bold py-4 rounded-xl shadow-lg mt-2 active:scale-95 transition-transform">Guardar Cambios</button>
            </div>
          </div>
        )}

        {modalActivo === 'pago' && (
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-[#FF8C00] mb-6">Métodos de Pago</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between p-4 border-2 border-[#FF8C00] bg-orange-50 rounded-2xl cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Tarjeta de Crédito / Débito</p>
                    <p className="text-[10px] text-gray-500">Termina en **** 4589</p>
                  </div>
                </div>
                <input type="radio" name="pago" defaultChecked className="w-5 h-5 accent-[#FF8C00]" />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Transferencia / SPEI</p>
                    <p className="text-[10px] text-gray-500">Usa tu app bancaria</p>
                  </div>
                </div>
                <input type="radio" name="pago" className="w-5 h-5 accent-[#FF8C00]" />
              </label>

              <button onClick={() => setModalActivo(null)} className="w-full bg-[#FF8C00] text-white font-bold py-4 rounded-xl shadow-lg mt-4 active:scale-95 transition-transform">Confirmar Método</button>
            </div>
          </div>
        )}

        {modalActivo === 'direcciones' && (
          <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[30px] p-6 pb-10 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-[#22C55E] mb-6">Mis Direcciones en ITO</h2>
            
            <div className="flex flex-col gap-3 mb-6">

              <div className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm border-l-4 border-l-[#22C55E]">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Edificio L - Salón L3</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Clases de 10:00 AM a 12:00 PM</p>
                </div>
                <button className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>


              <div className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Biblioteca Central</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Mesas de estudio planta baja</p>
                </div>
                <button className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>
            </div>

            <button className="w-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-transform flex justify-center items-center gap-2">
              <span className="text-xl leading-none">+</span> Añadir Nueva Ubicación
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MiPerfil;