import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const opcionesCarrera = [
  'Licenciatura en Administración',
  'Contador Público',
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Electrónica',
  'Ingeniería en Gestión Empresarial',
  'Ingeniería Industrial',
  'Ingeniería Mecánica',
  'Ingeniería Química',
  'Ingeniería en Sistemas Computacionales'
];

const CampyLogin = ({ alIngresar }) => {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [carreras, setCarreras] = useState([]);
  const [selectorCarrerasAbierto, setSelectorCarrerasAbierto] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const cambiarCarrera = (opcion) => {
    setCarreras((actuales) =>
      actuales.includes(opcion)
        ? actuales.filter((item) => item !== opcion)
        : [...actuales, opcion]
    );
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (modoRegistro && carreras.length === 0) {
      setError('Selecciona al menos una carrera.');
      return;
    }
    setCargando(true);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const endpoint = modoRegistro ? '/api/auth/registro' : '/api/auth/login';
    const payload = modoRegistro
      ? { nombre: nombre.trim(), correo: correo.trim(), telefono: telefono.trim(), password, carrera: carreras.join(', ') }
      : { correo: correo.trim(), password };

    try {
      const respuesta = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (respuesta.ok) {
        const datos = await respuesta.json();
        alIngresar(
          datos.usuario || {
            nombre: modoRegistro ? nombre.trim() : correo.split('@')[0],
            correo: correo.trim(),
            carrera: carreras.join(', ')
          }
        );
        return;
      } else {
        const errData = await respuesta.json().catch(() => ({}));
        setError(errData.mensaje || 'Credenciales inválidas o error en la cuenta.');
      }
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
    } finally {
      setCargando(false);
    }
  };

  const iniciarConProveedor = (proveedor) => {
    setError('');
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      alIngresar({
        nombre: proveedor === 'Google' ? 'Usuario Google ITO' : 'Usuario GitHub ITO',
        correo: proveedor === 'Google' ? 'google.ito@itoaxaca.edu.mx' : 'github.dev@itoaxaca.edu.mx',
        carrera: 'Ing. Sistemas Computacionales'
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] min-h-screen sm:min-h-[780px] bg-[#0A3895] relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        
        {/* Onda decorativa original */}
        <div className="absolute top-0 left-0 w-full opacity-30 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>

        <div className="flex-1 flex flex-col items-center px-8 relative z-10 pt-12 pb-6">
          
          {/* Logo Campy */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src={logoCampy} 
              alt="Logo Campy" 
              className="w-32 h-auto drop-shadow-2xl mb-2" 
            />
            <p className="text-white font-bold tracking-[0.15em] text-[10px] uppercase opacity-90">
              CAMPUS DELIVERY ITO
            </p>
          </div>

          {/* Selector Iniciar Sesión / Registrarse */}
          <div className="w-full bg-white/10 p-1 rounded-full flex mb-5">
            <button
              type="button"
              onClick={() => { setModoRegistro(false); setError(''); }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                !modoRegistro ? 'bg-[#FF8C00] text-white shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setModoRegistro(true); setError(''); }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                modoRegistro ? 'bg-[#FF8C00] text-white shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={manejarSubmit} className="w-full flex flex-col gap-3.5">
            {modoRegistro && (
              <>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full bg-white rounded-full py-3.5 px-5 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md"
                  required
                />
                <div className="relative w-full">
                  <button
                    type="button"
                    aria-expanded={selectorCarrerasAbierto}
                    aria-controls="opciones-carreras"
                    onClick={() => setSelectorCarrerasAbierto(!selectorCarrerasAbierto)}
                    className="w-full bg-white rounded-full py-3.5 pl-5 pr-12 text-left text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md flex items-center"
                  >
                    <span className={`block truncate ${carreras.length ? 'text-gray-800' : 'text-gray-400'}`}>
                      {carreras.length === 0
                        ? 'Selecciona tu(s) carrera(s)'
                        : carreras.length === 1
                          ? carreras[0]
                          : `${carreras.length} carreras seleccionadas`}
                    </span>
                    <svg className="absolute right-5 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {selectorCarrerasAbierto && (
                    <div id="opciones-carreras" className="absolute z-30 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                      <div className="max-h-56 overflow-y-auto py-2">
                        {opcionesCarrera.map((opcion) => (
                          <label key={opcion} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-800 cursor-pointer hover:bg-orange-50">
                            <input
                              type="checkbox"
                              checked={carreras.includes(opcion)}
                              onChange={() => cambiarCarrera(opcion)}
                              className="w-4 h-4 shrink-0 accent-[#FF8C00]"
                            />
                            <span>{opcion}</span>
                          </label>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 px-3 py-2 flex justify-end">
                        <button type="button" onClick={() => setSelectorCarrerasAbierto(false)} className="text-[#0A3895] text-sm font-bold px-3 py-1 rounded-lg hover:bg-gray-100">
                          Listo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Teléfono (10 dígitos)"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Ingresa un teléfono de 10 dígitos"
                  className="w-full bg-white rounded-full py-3.5 px-5 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md"
                  required
                />
              </>
            )}

            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full bg-white rounded-full py-3.5 px-5 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md"
              required
            />

            <div className="relative w-full">
              <input
                type={!modoRegistro && verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className={`w-full bg-white rounded-full py-3.5 pl-5 ${!modoRegistro ? 'pr-16' : 'pr-5'} text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md`}
                required
              />
              {!modoRegistro && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    title={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-pressed={verPassword}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0A3895] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {verPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 4.2 10 7-.2 1.1-1.4 3-3 4.4" />
                        <path d="M6.6 6.6C4.4 8 2.6 10 2 12c.7 2.8 5 7 10 7 1.4 0 2.7-.3 4-.8" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {!modoRegistro && (
              <div className="flex justify-between items-center text-white text-[11px] font-medium px-2 mt-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded-sm accent-[#FF8C00]" />
                  Recordarme
                </label>
                <a href="#recuperar" onClick={(e) => e.preventDefault()} className="hover:text-orange-300 transition-colors">
                  ¿Olvidaste tu NIP?
                </a>
              </div>
            )}

            {error && (
              <p role="alert" className="bg-red-500/20 border border-red-300/40 text-white text-xs py-2 px-3 rounded-xl text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#FF8C00] hover:bg-[#e67e00] text-white font-black text-base py-3.5 rounded-full shadow-lg mt-2 transition-transform active:scale-95 flex justify-center items-center gap-2"
            >
              {cargando ? 'PROCESANDO...' : modoRegistro ? 'CREAR CUENTA' : 'INGRESAR'}
            </button>
          </form>

          {/* Separador OAuth */}
          <div className="w-full flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-white/70 text-[11px] font-bold uppercase tracking-wider">O continúa con</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Botones de Google y GitHub */}
          <div className="w-full grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => iniciarConProveedor('Google')}
              className="bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs py-3 px-4 rounded-full shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z" />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => iniciarConProveedor('GitHub')}
              className="bg-gray-900 hover:bg-black text-white font-bold text-xs py-3 px-4 rounded-full shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 border border-white/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>

          <p className="text-white/70 text-[10px] text-center mt-auto pt-4">
            Ingresarás al catálogo estudiantil como <span className="text-white font-bold">Comprador</span>. Podrás darte de alta como vendedor desde tu perfil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampyLogin;
