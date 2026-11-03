import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const CampyRegistro = ({ alRegistrar, volverAlLogin }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim(),
          password
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.mensaje || 'No fue posible registrar tu cuenta.');
        return;
      }

      alRegistrar();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const estiloCampo = 'w-full bg-white rounded-full py-4 px-7 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md';

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] min-h-screen sm:min-h-[750px] bg-[#0A3895] relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full opacity-30 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
          </svg>
        </div>

        <div className="flex-1 flex flex-col items-center px-8 relative z-10 pt-10 pb-8">
          <div className="flex flex-col items-center mb-7">
            <img src={logoCampy} alt="Logo Campy" className="w-28 h-auto drop-shadow-2xl mb-2" />
            <p className="text-white font-bold tracking-[0.15em] text-[10px] uppercase opacity-90">
              CAMPUS DELIVERY ITO
            </p>
          </div>

          <h1 className="text-white text-2xl font-black mb-2">CREAR CUENTA</h1>
          <p className="text-white/80 text-xs text-center mb-7">Regístrate como comprador en Campy</p>

          <form onSubmit={manejarRegistro} className="w-full flex flex-col gap-4">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              autoComplete="name"
              maxLength={120}
              className={estiloCampo}
              required
            />
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="email"
              maxLength={255}
              className={estiloCampo}
              required
            />
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Teléfono (10 dígitos)"
              autoComplete="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              title="Ingresa un teléfono de 10 dígitos"
              className={estiloCampo}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña (mínimo 8 caracteres)"
              autoComplete="new-password"
              minLength={8}
              className={estiloCampo}
              required
            />
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
              minLength={8}
              className={estiloCampo}
              required
            />

            {error && <p role="alert" className="text-white text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#FF8C00] hover:bg-[#e67e00] disabled:opacity-60 text-white font-black text-lg py-4 rounded-full shadow-lg mt-3 transition-transform active:scale-95"
            >
              {cargando ? 'REGISTRANDO...' : 'REGISTRARME'}
            </button>
          </form>

          <button
            type="button"
            onClick={volverAlLogin}
            className="text-white font-bold text-sm mt-6 hover:text-orange-300 transition-colors"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampyRegistro;
