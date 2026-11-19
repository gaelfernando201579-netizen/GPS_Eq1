import React, { useState } from 'react';
import logoCampy from './assets/logo.png';

const REQUISITOS_PASSWORD = [
  { texto: 'Mínimo 8 caracteres', cumple: (valor) => valor.length >= 8 },
  { texto: 'Máximo 10 caracteres', cumple: (valor) => valor.length <= 10 },
  { texto: 'Una letra mayúscula', cumple: (valor) => /[A-Z]/.test(valor) },
  { texto: 'Una letra minúscula', cumple: (valor) => /[a-z]/.test(valor) },
  { texto: 'Un número', cumple: (valor) => /[0-9]/.test(valor) },
  { texto: 'Un símbolo (por ejemplo: ! @ # $ %)', cumple: (valor) => /[^A-Za-z0-9\s]/.test(valor) },
  { texto: 'Sin espacios', cumple: (valor) => !/\s/.test(valor) }
];

const passwordSegura = (valor) => REQUISITOS_PASSWORD.every((regla) => regla.cumple(valor));

function ReglasPassword({ valor }) {
  const iniciado = valor.length > 0;
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white" aria-label="Requisitos de contraseña">
      <p className="text-xs font-semibold mb-2">Contraseña segura</p>
      <p className="text-[11px] text-white/75 mb-2">De 8 a 10 caracteres, combinando:</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {REQUISITOS_PASSWORD.map((regla) => {
          const cumple = iniciado && regla.cumple(valor);
          return (
            <li key={regla.texto} className={`flex items-start gap-1.5 text-[10px] leading-4 ${cumple ? 'text-green-200' : 'text-white/80'}`}>
              <span aria-hidden="true" className="w-3 shrink-0 font-bold">{cumple ? '✓' : '○'}</span>
              <span>{regla.texto}</span>
            </li>
          );
        })}
      </ul>
      {iniciado && (
        <p className={`mt-2 text-[11px] font-semibold ${passwordSegura(valor) ? 'text-green-200' : 'text-amber-200'}`}>
          {passwordSegura(valor) ? '✓ Contraseña válida' : 'Faltan requisitos por cumplir'}
        </p>
      )}
    </div>
  );
}


const CLASE_ERROR_CAMPO = 'ring-2 ring-red-500 border-2 border-red-500 focus:ring-red-500';
const CLASE_ERROR_TEXTO = 'text-red-100 text-xs font-semibold px-3';

function detectarCampoError(mensaje = '') {
  const texto = String(mensaje).toLowerCase();
  if (texto.includes('revisa tu nombre, correo')) return '';
  if (texto.includes('correo')) return 'correo';
  if (texto.includes('teléfono') || texto.includes('telefono')) return 'telefono';
  if (texto.includes('contraseña') || texto.includes('contrasena')) return 'password';
  if (texto.includes('nombre')) return 'nombre';
  return '';
}

function IconoOjo({ visible }) {
  return visible ? (
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
  );
}

const CampyRegistro = ({ alRegistrar, volverAlLogin }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [confirmarTelefono, setConfirmarTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmacion, setVerConfirmacion] = useState(false);
  const [error, setError] = useState('');
  const [erroresCampos, setErroresCampos] = useState({});
  const [cargando, setCargando] = useState(false);

  const limpiarCampo = (campo) => {
    setErroresCampos((prev) => ({ ...prev, [campo]: '' }));
    setError('');
  };

  const marcarError = (campo, mensaje) => {
    setErroresCampos({ [campo]: mensaje });
    setError('');
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setErroresCampos({});

    if (nombre.trim().length < 3 || nombre.trim().length > 120) {
      marcarError('nombre', 'El nombre debe tener entre 3 y 120 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      marcarError('correo', 'Ingresa un correo electrónico válido.');
      return;
    }
    if (!/^\d{10}$/.test(telefono)) {
      marcarError('telefono', 'El teléfono debe tener exactamente 10 dígitos.');
      return;
    }
    if (telefono !== confirmarTelefono) {
      marcarError('confirmarTelefono', 'Los números de teléfono no coinciden.');
      return;
    }
    if (!passwordSegura(password)) {
      const fallo = REQUISITOS_PASSWORD.find((r) => !r.cumple(password));
      marcarError('password', fallo ? `Tu contraseña no cumple: ${fallo.texto}.` : 'Revisa los requisitos de contraseña.');
      return;
    }
    if (password !== confirmarPassword) {
      marcarError('confirmarPassword', 'Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), correo: correo.trim(), telefono: telefono.trim(), password })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        const campo = datos.campo || detectarCampoError(datos.mensaje);
        if (campo) marcarError(campo, datos.mensaje || 'Revisa este campo.');
        else setError(datos.mensaje || 'No fue posible registrar tu cuenta.');
        return;
      }
      alRegistrar();
    } catch {
      setError('Espera unos momentos y vuelve a intentar.');
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

          <form onSubmit={manejarRegistro} noValidate className="w-full flex flex-col gap-4">
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); limpiarCampo('nombre'); }}
              placeholder="Nombre completo"
              autoComplete="name"
              maxLength={120}
              className={`${estiloCampo} ${erroresCampos.nombre ? CLASE_ERROR_CAMPO : ''}`}
              required
              aria-invalid={!!erroresCampos.nombre}
              />
            {erroresCampos.nombre && <p role="alert" className={CLASE_ERROR_TEXTO}>{erroresCampos.nombre}</p>}
            <input
              type="email"
              value={correo}
              onChange={(e) => { setCorreo(e.target.value); limpiarCampo('correo'); }}
              placeholder="Correo electrónico"
              autoComplete="email"
              maxLength={255}
              className={`${estiloCampo} ${erroresCampos.correo ? CLASE_ERROR_CAMPO : ''}`}
              required
              aria-invalid={!!erroresCampos.correo}
              />
            {erroresCampos.correo && <p role="alert" className={CLASE_ERROR_TEXTO}>{erroresCampos.correo}</p>}
            <input
              type="tel"
              value={telefono}
              onChange={(e) => { setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10)); limpiarCampo('telefono'); limpiarCampo('confirmarTelefono'); }}
              placeholder="Teléfono (10 dígitos)"
              autoComplete="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              title="Ingresa un teléfono de 10 dígitos"
              className={`${estiloCampo} ${erroresCampos.telefono ? CLASE_ERROR_CAMPO : ''}`}
              required
              aria-invalid={!!erroresCampos.telefono}
              />
            {erroresCampos.telefono && <p role="alert" className={CLASE_ERROR_TEXTO}>{erroresCampos.telefono}</p>}
            <input
              type="tel"
              value={confirmarTelefono}
              onChange={(e) => { setConfirmarTelefono(e.target.value.replace(/\D/g, '').slice(0, 10)); limpiarCampo('confirmarTelefono'); }}
              placeholder="Confirmar teléfono (10 dígitos)"
              aria-label="Confirmar número de teléfono"
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              className={`w-full bg-white rounded-full py-4 px-7 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md ${erroresCampos.confirmarTelefono ? CLASE_ERROR_CAMPO : ''}`}
              required
              aria-invalid={!!erroresCampos.confirmarTelefono}
              />
            {erroresCampos.confirmarTelefono && <p role="alert" className={CLASE_ERROR_TEXTO}>{erroresCampos.confirmarTelefono}</p>}
            {confirmarTelefono.length > 0 && (
              <p className={`text-xs font-medium px-2 ${confirmarTelefono === telefono && telefono.length === 10 ? 'text-green-200' : 'text-amber-200'}`}>
                {confirmarTelefono === telefono && telefono.length === 10
                  ? '✓ Los teléfonos coinciden.'
                  : 'Los números de teléfono deben coincidir y tener 10 dígitos.'}
              </p>
            )}

            <div id="requisitos-password">
              <ReglasPassword valor={password} />
            </div>

            {/* Contraseña y confirmación con visibilidad independiente */}
            <div className="relative w-full">
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); limpiarCampo('password'); }}
                placeholder="Crear contraseña segura"
                autoComplete="new-password"
                aria-label="Contraseña"
                aria-describedby="requisitos-password"
                className={`w-full bg-white rounded-full py-4 pl-7 pr-16 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md ${erroresCampos.password ? CLASE_ERROR_CAMPO : ''}`}
                required
                aria-invalid={!!erroresCampos.password}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <button
                  type="button"
                  onClick={() => setVerPassword((anterior) => !anterior)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-pressed={verPassword}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0A3895] focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <IconoOjo visible={verPassword} />
                </button>
              </div>
            </div>
            {erroresCampos.password && <p role="alert" className={CLASE_ERROR_TEXTO}>{erroresCampos.password}</p>}

            {password.length > 10 && (
              <p className="text-xs text-red-200 font-semibold px-2">
                La contraseña no puede tener más de 10 caracteres.
              </p>
            )}

            <div className="relative w-full">
              <input
                type={verConfirmacion ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={(e) => { setConfirmarPassword(e.target.value); limpiarCampo('confirmarPassword'); }}
                placeholder="Confirmar contraseña"
                aria-label="Confirmar contraseña"
                autoComplete="new-password"
                className={`w-full bg-white rounded-full py-4 pl-7 pr-16 text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500 shadow-md ${erroresCampos.confirmarPassword ? CLASE_ERROR_CAMPO : ''}`}
                required
                aria-invalid={!!erroresCampos.confirmarPassword}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <button
                  type="button"
                  onClick={() => setVerConfirmacion((anterior) => !anterior)}
                  aria-label={verConfirmacion ? 'Ocultar confirmación' : 'Ver confirmación'}
                  aria-pressed={verConfirmacion}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0A3895] focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <IconoOjo visible={verConfirmacion} />
                </button>
              </div>
            </div>
            {erroresCampos.confirmarPassword && <p role="alert" className={CLASE_ERROR_TEXTO}>{erroresCampos.confirmarPassword}</p>}

            {confirmarPassword && (
              <p className={`text-xs px-2 font-semibold ${password === confirmarPassword ? 'text-green-200' : 'text-amber-200'}`} >
                {password === confirmarPassword ? '✓ Las contraseñas coinciden.' : 'Las contraseñas todavía no coinciden.'}
              </p>
            )}

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