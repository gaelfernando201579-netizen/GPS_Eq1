import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const CampyLogin = ({ alIngresar }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('comprador'); 

 const manejarLogin = (e) => {
    e.preventDefault();
    alIngresar(); 
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">

      <div className="w-full max-w-[400px] min-h-screen sm:min-h-[750px] bg-[#0A3895] relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full opacity-30 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>

        <div className="flex-1 flex flex-col items-center px-8 relative z-10 pt-20">
          
          <div className="flex flex-col items-center mb-12">
            <img 
              src={logoCampy} 
              alt="Logo Campy" 
              className="w-40 h-auto drop-shadow-2xl mb-3" 
            />
            <p className="text-white font-bold tracking-[0.15em] text-[10px] uppercase opacity-90">
              CAMPUS DELIVERY ITO
            </p>
          </div>

          <form onSubmit={manejarLogin} className="w-full flex flex-col gap-5">
            
            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-400"></span>
              <input
                type="text"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Correo electronico"
                className="w-full bg-white rounded-full py-4 pl-12 pr-4 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-400"></span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-white rounded-full py-4 pl-12 pr-4 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md"
                required
              />
            </div>

            <div className="flex justify-between items-center text-white text-[11px] font-medium px-2 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded-sm" />
                Recordarme
              </label>
              <a href="#" className="hover:text-orange-300 transition-colors">¿Olvidaste tu NIP?</a>
            </div>

            <button type="submit" className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-lg py-4 rounded-full shadow-lg mt-6 transition-transform active:scale-95 flex justify-center items-center gap-2">
              INGRESAR 
            </button>
          </form>
        </div>

        <div className="w-full flex justify-center gap-8 text-sm font-bold pb-8 z-10 relative mt-auto">
          <button
            type="button"
            onClick={() => setRol('comprador')}
            className={`pb-2 transition-all border-b-[3px] ${
              rol === 'comprador' ? 'text-white border-white' : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            Soy Comprador
          </button>
          
          <button
            type="button"
            onClick={() => setRol('vendedor')}
            className={`pb-2 transition-all border-b-[3px] ${
              rol === 'vendedor' ? 'text-white border-white' : 'text-white/40 border-transparent hover:text-white/60'
            }`}
          >
            Soy Vendedor
          </button>
        </div>

      </div>
    </div>
  );
};

export default CampyLogin;