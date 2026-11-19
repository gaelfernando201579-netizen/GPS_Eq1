import React, { useCallback, useEffect, useState } from 'react';
import logoCampy from './assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const REQUISITOS_PASSWORD = [
  { texto: 'Mínimo 8 caracteres', cumple: (valor) => valor.length >= 8 },
  { texto: 'Máximo 10 caracteres', cumple: (valor) => valor.length <= 10 },
  { texto: 'Una letra mayúscula', cumple: (valor) => /[A-Z]/.test(valor) },
  { texto: 'Una letra minúscula', cumple: (valor) => /[a-z]/.test(valor) },
  { texto: 'Un número', cumple: (valor) => /[0-9]/.test(valor) },
  { texto: 'Un símbolo (por ejemplo: ! @ # $ %)', cumple: (valor) => /[^A-Za-z0-9\s]/.test(valor) },
  { texto: 'Sin espacios', cumple: (valor) => !/\s/.test(valor) }
];

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

function ReglasPassword({ valor }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
      <p className="mb-2 text-xs font-bold text-[#0A3895]">Tu contraseña debe cumplir con:</p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
        {REQUISITOS_PASSWORD.map((regla) => {
          const cumple = valor.length > 0 && regla.cumple(valor);
          return (
            <li key={regla.texto} className={`flex items-start gap-1.5 text-[11px] ${cumple ? 'text-green-700' : 'text-gray-600'}`}>
              <span className="shrink-0 font-black" aria-hidden="true">{cumple ? '✓' : '○'}</span>
              <span>{regla.texto}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


export default function PanelModerador({ token, usuario, productos = [], cargandoProductos = false, errorProductos = '', eliminarPublicacion, alCambiarCatalogo = () => {}, cerrarSesion }) {
  const [pestana, setPestana] = useState('vendedor');
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesRepartidor, setSolicitudesRepartidor] = useState([]);
  const [cargandoRepartidores, setCargandoRepartidores] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [comentarios, setComentarios] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [vendedores, setVendedores] = useState([]);
  const [cargandoVendedores, setCargandoVendedores] = useState(true);
  const [errorVendedores, setErrorVendedores] = useState('');
  const [vendedorPorQuitar, setVendedorPorQuitar] = useState(null);
  const [quitandoVendedor, setQuitandoVendedor] = useState(false);
  const [productoPorInhabilitar, setProductoPorInhabilitar] = useState(null);
  const [inhabilitandoProducto, setInhabilitandoProducto] = useState(false);
  const [filtroProducto, setFiltroProducto] = useState('');
  const [textoFiltro, setTextoFiltro] = useState('');
  const [tipoBusqueda, setTipoBusqueda] = useState('producto');

  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verPasswordActual, setVerPasswordActual] = useState(false);
  const [verNuevaPassword, setVerNuevaPassword] = useState(false);
  const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState('');
  const [mensajePassword, setMensajePassword] = useState('');

  const guardarCambioPassword = async (evento) => {
    evento.preventDefault();
    setErrorPassword('');
    setMensajePassword('');

    if (REQUISITOS_PASSWORD.some((regla) => !regla.cumple(nuevaPassword))) {
      setErrorPassword(nuevaPassword.length > 10
        ? 'La contraseña no puede tener más de 10 caracteres.'
        : 'La nueva contraseña no cumple todos los requisitos de seguridad.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (!token) {
      setErrorPassword('Tu sesión no es válida. Inicia sesión nuevamente.');
      return;
    }

    setGuardandoPassword(true);
    try {
      const respuesta = await fetch(`${API_URL}/api/auth/cambiar-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passwordActual, nuevaPassword, confirmarPassword })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo actualizar la contraseña.');
      setMensajePassword(datos.mensaje || '¡Tu contraseña se actualizó correctamente!');
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setMostrarCambioPassword(false);
    } catch (e) {
      setErrorPassword(e.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardandoPassword(false);
    }
  };


  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor/pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No fue posible cargar las solicitudes.');
      setSolicitudes(Array.isArray(datos) ? datos : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  const cargarVendedores = useCallback(async () => {
    setCargandoVendedores(true);
    setErrorVendedores('');
    try {
      const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor/vendedores-activos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No fue posible cargar los vendedores activos.');
      setVendedores(Array.isArray(datos) ? datos : []);
    } catch (e) {
      setErrorVendedores(e.message);
    } finally {
      setCargandoVendedores(false);
    }
  }, [token]);

  const cargarRepartidores = useCallback(async () => {
    setCargandoRepartidores(true);
    try {
      const r = await fetch(`${API_URL}/api/solicitudes-repartidor/pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(datos.mensaje || 'No se pudieron consultar las solicitudes de reparto.');
      setSolicitudesRepartidor(Array.isArray(datos) ? datos : []);
    } catch (e) { setError(e.message); }
    finally { setCargandoRepartidores(false); }
  }, [token]);

  const revisarRepartidor = async (s, decision) => {
    setProcesando(`rep-${s.id_solicitud}`);
    setError('');
    try {
      const r = await fetch(`${API_URL}/api/solicitudes-repartidor/${s.id_solicitud}/revisar`, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({ decision, comentario: comentarios[`rep-${s.id_solicitud}`] || '' })
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(datos.mensaje || 'No se pudo revisar al repartidor.');
      setSolicitudesRepartidor(actual => actual.filter(x => x.id_solicitud !== s.id_solicitud));
      setAviso(datos.mensaje);
    } catch(e) { setError(e.message); }
    finally { setProcesando(null); }
  };

  useEffect(() => { cargar(); cargarVendedores(); cargarRepartidores(); }, [cargar, cargarVendedores, cargarRepartidores]);

  const quitarVendedor = async () => {
    if (!vendedorPorQuitar || quitandoVendedor) return;
    setQuitandoVendedor(true);
    setErrorVendedores('');
    setAviso('');
    try {
      const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor/vendedores/${vendedorPorQuitar.id_usuario}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo quitar el rol Vendedor.');
      setVendedores((actuales) => actuales.filter((v) => v.id_usuario !== vendedorPorQuitar.id_usuario));
      setVendedorPorQuitar(null);
      setAviso(datos.mensaje || 'Se retiró el rol Vendedor.');
      alCambiarCatalogo();
    } catch (e) {
      setErrorVendedores(e.message);
    } finally {
      setQuitandoVendedor(false);
    }
  };

  const revisar = async (id, decision) => {
    setError('');
    setAviso('');
    setProcesando(id);
    try {
      const respuesta = await fetch(`${API_URL}/api/solicitudes-vendedor/${id}/revisar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, comentario: comentarios[id] || '' })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo revisar la solicitud.');
      setSolicitudes((actual) => actual.filter((s) => s.id_solicitud !== id));
      setAviso(datos.mensaje);
      if (decision === 'Aprobada') cargarVendedores();
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(null);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const texto = filtroProducto.trim().toLocaleLowerCase('es-MX');
    if (!texto) return true;
    const campo = tipoBusqueda === 'vendedor'
      ? (producto.nombre_vendedor || producto.tienda || '')
      : (producto.nombre || '');
    return String(campo).toLocaleLowerCase('es-MX').includes(texto);
  });

  const confirmarInhabilitacion = async () => {
    if (!productoPorInhabilitar || inhabilitandoProducto) return;
    setInhabilitandoProducto(true);
    setError('');
    try {
      await eliminarPublicacion(productoPorInhabilitar.id_producto ?? productoPorInhabilitar.id);
      setAviso(`La publicación "${productoPorInhabilitar.nombre}" fue inhabilitada.`);
      setProductoPorInhabilitar(null);
    } catch (error) {
      setError(error.message || 'No se pudo inhabilitar la publicación.');
    } finally {
      setInhabilitandoProducto(false);
    }
  };

  const titulo = pestana === 'comprador'
    ? 'Catálogo de productos'
    : pestana === 'cuenta'
      ? 'Mi cuenta'
      : 'Solicitudes de vendedor';

  const roles = [
    'Moderador',
    ...(usuario?.esVendedor ? ['Vendedor'] : []),
    ...(usuario?.esRepartidor ? ['Repartidor'] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-[400px] h-screen sm:h-[800px] bg-[#F9FAFB] relative flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden">
        <div className="bg-[#0A3895] text-white px-6 pt-7 pb-9 rounded-b-[35px] shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-widest">CAMPY</h1>
            <img src={logoCampy} alt="Campy" className="w-14 h-auto" />
          </div>
          <span className="inline-block bg-[#FF8C00] text-white px-3 py-1 rounded-full font-bold text-[10px] mt-3">MODO MODERADOR</span>
          <h2 className="text-2xl font-black mt-3">{titulo}</h2>
          <p className="text-sm text-white/80 mt-1">{usuario?.nombre}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 pb-32">
          {pestana === 'comprador' && (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-5 text-sm text-[#0A3895]">
                Vista previa del catálogo. Puedes consultar los productos, pero no agregarlos al carrito ni hacer pedidos desde el modo moderador.
              </div>
              <div className="mb-4 flex flex-col gap-2">
                <label className="text-xs font-bold text-[#0A3895]" htmlFor="filtro-catalogo-moderador">Buscar publicaciones</label>
                <div className="flex gap-2">
                  <select
                    value={tipoBusqueda}
                    onChange={e => setTipoBusqueda(e.target.value)}
                    className="w-36 min-w-0 bg-white text-gray-900 border border-gray-200 rounded-xl px-2 py-3 text-xs"
                  >
                    <option value="producto">Producto</option>
                    <option value="vendedor">Vendedor</option>
                  </select>
                  <input
                    id="filtro-catalogo-moderador"
                    type="search"
                    value={textoFiltro}
                    onChange={e => setTextoFiltro(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();setFiltroProducto(textoFiltro);} }}
                    placeholder={tipoBusqueda === 'producto' ? 'Nombre del producto' : 'Nombre del vendedor'}
                    className="min-w-0 flex-1 bg-white text-gray-900 border border-gray-200 rounded-xl px-3 py-3 text-xs"
                  />
                  <button type="button" className="bg-[#0A3895] text-white rounded-xl px-3 text-xs font-bold" onClick={() => setFiltroProducto(textoFiltro)}>Buscar</button>
                </div>
              </div>
              {error && <p role="alert" className="mb-3 text-xs text-red-700">{error}</p>}
              {aviso && <p role="status" className="mb-3 text-xs text-green-800">{aviso}</p>}
              {cargandoProductos ? (
                <p className="text-gray-600 text-center py-10">Cargando productos...</p>
              ) : errorProductos ? (
                <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-sm">{errorProductos}</p>
              ) : productosFiltrados.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
                  No hay productos para mostrar.
                </div>
              ) : (
                <>
                  <h3 className="font-black text-[#0A3895] text-sm mb-4">Productos disponibles ({productosFiltrados.length})</h3>
                  {productosFiltrados.map((producto) => (
                    <div key={producto.id_producto ?? producto.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden">
                        {producto.imagen_url ? (
                          <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-400 text-xs font-black">SIN FOTO</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase text-[#FF8C00]">{producto.categoria || 'Sin categoría'}</p>
                        <h4 className="font-black text-gray-900 text-sm leading-snug mt-1">{producto.nombre}</h4>
                        <p className="text-xs text-gray-500 mt-1">{producto.tienda || (producto.nombre_vendedor ? `Vende: ${producto.nombre_vendedor}` : 'Vendedor no disponible')}</p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <p className="font-black text-[#FF8C00]">${Number(producto.precio || 0).toFixed(2)}</p>
                          <button
                            type="button"
                            onClick={() => { setError(''); setProductoPorInhabilitar(producto); }}
                            className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold"
                          >Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {pestana === 'vendedor' && (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-[#0A3895] text-sm">Pendientes ({solicitudes.length})</h3>
                <button type="button" onClick={() => { cargar(); cargarVendedores(); cargarRepartidores(); }} className="text-xs font-bold text-[#0A3895] bg-blue-50 rounded-xl px-3 py-2">Actualizar</button>
              </div>
              {error && <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-sm mb-4">{error}</p>}
              {aviso && <p role="status" className="text-green-800 bg-green-50 border border-green-200 p-3 rounded-xl text-sm mb-4">{aviso}</p>}
              {cargando ? <p className="text-gray-600 text-center py-10">Cargando solicitudes...</p> : solicitudes.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
                  No hay solicitudes pendientes de revisión.
                </div>
              ) : solicitudes.map((solicitud) => (
                <div key={solicitud.id_solicitud} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black rounded-full px-3 py-1">PENDIENTE</span>
                  <h4 className="font-black text-gray-900 text-lg mt-3">{solicitud.solicitante}</h4>
                  <p className="text-xs text-gray-500 break-words">{solicitud.correo}</p>
                  <div className="mt-4 space-y-2 text-sm text-gray-700">
                    <p><strong>No. control:</strong> {solicitud.numero_control}</p>
                    <p><strong>Tienda:</strong> {solicitud.nombre_tienda}</p>
                    <p><strong>Qué vende:</strong> {solicitud.giro}</p>
                    <p><strong>Ubicación:</strong> {solicitud.ubicacion}</p>
                    <p><strong>Horarios:</strong> {solicitud.horario_resumen}</p>
                    {solicitud.nota_horario && <p><strong>Notas:</strong> {solicitud.nota_horario}</p>}
                  </div>
                  <label className="block mt-4 text-xs font-bold text-gray-700" htmlFor={`comentario-${solicitud.id_solicitud}`}>Motivo o comentario (opcional)</label>
                  <textarea
                    id={`comentario-${solicitud.id_solicitud}`}
                    value={comentarios[solicitud.id_solicitud] || ''}
                    onChange={(e) => setComentarios((actual) => ({ ...actual, [solicitud.id_solicitud]: e.target.value }))}
                    maxLength={500}
                    rows={2}
                    placeholder="Se mostrará al solicitante"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={() => revisar(solicitud.id_solicitud, 'Rechazada')} disabled={procesando !== null}
                      className="bg-red-50 text-red-700 rounded-xl py-3 font-black text-xs disabled:opacity-50">Rechazar</button>
                    <button type="button" onClick={() => revisar(solicitud.id_solicitud, 'Aprobada')} disabled={procesando !== null}
                      className="bg-[#FF8C00] text-white rounded-xl py-3 font-black text-xs disabled:opacity-50">Aprobar</button>
                  </div>
                </div>
              ))}

              <section className="mt-8 border-t border-gray-200 pt-6" aria-label="Solicitudes de repartidor">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#0A3895] text-sm">Solicitudes de repartidor ({solicitudesRepartidor.length})</h3>
                  <button type="button" onClick={cargarRepartidores} className="text-xs font-bold text-[#0A3895] bg-blue-50 rounded-xl px-3 py-2">Actualizar</button>
                </div>
                {cargandoRepartidores ? <p className="text-xs text-gray-500">Consultando solicitudes...</p> :
                  !solicitudesRepartidor.length ? <p className="text-xs text-gray-500 mb-4">Sin solicitudes pendientes.</p> :
                  solicitudesRepartidor.map(s => (
                    <div key={s.id_solicitud} className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 space-y-2">
                      <p className="font-black text-sm">{s.nombre}</p>
                      <p className="text-xs text-gray-500">{s.correo} · {s.numero_control}</p>
                      <p className="text-xs text-gray-700"><strong>Zonas:</strong> {s.zonas}</p>
                      <textarea rows={2} value={comentarios[`rep-${s.id_solicitud}`] || ''}
                        onChange={e => setComentarios(prev => ({...prev,[`rep-${s.id_solicitud}`]:e.target.value}))}
                        placeholder="Motivo o comentario (opcional)" maxLength={500}
                        className="w-full text-xs border border-gray-200 rounded-xl p-3" />
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" disabled={procesando!==null} onClick={() => revisarRepartidor(s,'Rechazada')}
                          className="bg-red-50 text-red-700 rounded-xl py-3 text-xs font-black">Rechazar</button>
                        <button type="button" disabled={procesando!==null} onClick={() => revisarRepartidor(s,'Aprobada')}
                          className="bg-[#22C55E] text-white rounded-xl py-3 text-xs font-black">Aprobar</button>
                      </div>
                    </div>
                  ))}
              </section>

              <section className="mt-8 border-t border-gray-200 pt-6" aria-label="Vendedores activos">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-black text-[#0A3895] text-sm">Vendedores activos ({vendedores.length})</h3>
                  <button type="button" onClick={cargarVendedores}
                    className="text-xs font-bold text-[#0A3895] bg-blue-50 rounded-xl px-3 py-2">Actualizar</button>
                </div>
                {errorVendedores && <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-sm mb-4">{errorVendedores}</p>}
                {cargandoVendedores ? (
                  <p className="text-gray-600 text-center py-7">Cargando vendedores...</p>
                ) : vendedores.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 text-center text-gray-500">
                    No hay vendedores activos.
                  </div>
                ) : vendedores.map((vendedor) => (
                  <div key={vendedor.id_usuario} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
                    <h4 className="font-black text-gray-900 text-base">{vendedor.nombre}</h4>
                    <p className="text-xs text-gray-500 break-all mt-1">{vendedor.correo}</p>
                    <p className="text-sm text-gray-600 mt-2">Productos registrados: {vendedor.total_productos}</p>
                    <button type="button" onClick={() => setVendedorPorQuitar(vendedor)}
                      className="mt-4 w-full bg-red-50 text-red-700 border border-red-100 rounded-xl py-3 font-black text-sm">
                      Quitar vendedor
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}

          {pestana === 'cuenta' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-black text-[#0A3895] mb-4">Información de mi cuenta</p>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-bold text-gray-900 mb-4 break-words">{usuario?.nombre || 'Sin nombre'}</p>
                <p className="text-xs text-gray-500">Correo electrónico</p>
                <p className="font-bold text-gray-900 mb-4 break-all">{usuario?.correo || 'Sin correo'}</p>
                {usuario?.carrera && (
                  <>
                    <p className="text-xs text-gray-500">Carrera</p>
                    <p className="font-bold text-gray-900 mb-4 break-words">{usuario.carrera}</p>
                  </>
                )}
                <p className="text-xs text-gray-500">Roles</p>
                <p className="font-bold text-gray-900">{roles.join(', ')}</p>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarCambioPassword((actual) => !actual);
                    setErrorPassword('');
                    setMensajePassword('');
                  }}
                  aria-expanded={mostrarCambioPassword}
                  className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-3.5 text-sm font-black text-[#0A3895]"
                >
                  Cambiar contraseña {mostrarCambioPassword ? '−' : '+'}
                </button>

                {mensajePassword && (
                  <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-semibold text-green-700">
                    {mensajePassword}
                  </p>
                )}

                {mostrarCambioPassword && (
                  <form onSubmit={guardarCambioPassword} className="mt-4 space-y-3">
                    <p className="text-xs text-gray-600">Ingresa tu contraseña actual y elige una nueva para proteger tu cuenta.</p>

                    <div>
                      <label htmlFor="moderador-password-actual" className="mb-1 block text-xs font-bold text-gray-700">Contraseña actual</label>
                      <div className="relative">
                        <input id="moderador-password-actual" type={verPasswordActual ? 'text' : 'password'} value={passwordActual}
                          onChange={(e) => setPasswordActual(e.target.value)} autoComplete="current-password" required
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 pr-12 text-sm text-gray-900 outline-none focus:border-[#0A3895]" />
                        <button type="button" onClick={() => setVerPasswordActual((actual) => !actual)}
                          aria-label={verPasswordActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                          className="absolute inset-y-0 right-2 flex w-9 items-center justify-center text-gray-500">
                          <IconoOjo visible={verPasswordActual} />
                        </button>
                      </div>
                    </div>

                    <ReglasPassword valor={nuevaPassword} />

                    <div>
                      <label htmlFor="moderador-password-nueva" className="mb-1 block text-xs font-bold text-gray-700">Nueva contraseña</label>
                      <div className="relative">
                        <input id="moderador-password-nueva" type={verNuevaPassword ? 'text' : 'password'} value={nuevaPassword}
                          onChange={(e) => setNuevaPassword(e.target.value)} autoComplete="new-password" required
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 pr-12 text-sm text-gray-900 outline-none focus:border-[#0A3895]" />
                        <button type="button" onClick={() => setVerNuevaPassword((actual) => !actual)}
                          aria-label={verNuevaPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                          className="absolute inset-y-0 right-2 flex w-9 items-center justify-center text-gray-500">
                          <IconoOjo visible={verNuevaPassword} />
                        </button>
                      </div>
                      {nuevaPassword.length > 10 && <p role="alert" className="mt-1 text-xs text-red-600">La contraseña no puede tener más de 10 caracteres.</p>}
                    </div>

                    <div>
                      <label htmlFor="moderador-password-confirmar" className="mb-1 block text-xs font-bold text-gray-700">Confirmar nueva contraseña</label>
                      <div className="relative">
                        <input id="moderador-password-confirmar" type={verConfirmarPassword ? 'text' : 'password'} value={confirmarPassword}
                          onChange={(e) => setConfirmarPassword(e.target.value)} autoComplete="new-password" required
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 pr-12 text-sm text-gray-900 outline-none focus:border-[#0A3895]" />
                        <button type="button" onClick={() => setVerConfirmarPassword((actual) => !actual)}
                          aria-label={verConfirmarPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                          className="absolute inset-y-0 right-2 flex w-9 items-center justify-center text-gray-500">
                          <IconoOjo visible={verConfirmarPassword} />
                        </button>
                      </div>
                      {confirmarPassword && (
                        <p role="status" className={`mt-1 text-xs font-semibold ${confirmarPassword === nuevaPassword ? 'text-green-700' : 'text-amber-700'}`}>
                          {confirmarPassword === nuevaPassword ? '✓ Las contraseñas coinciden.' : 'Las contraseñas no coinciden.'}
                        </p>
                      )}
                    </div>

                    {errorPassword && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{errorPassword}</p>}
                    <button type="submit" disabled={guardandoPassword}
                      className="w-full rounded-xl bg-[#0A3895] py-3.5 text-sm font-black text-white disabled:opacity-50">
                      {guardandoPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </form>
                )}
              </div>

              <button type="button" onClick={cerrarSesion} className="w-full bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 font-black text-sm">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {productoPorInhabilitar && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
            <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-inhabilitar-producto"
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-gray-900">
              <h3 id="titulo-inhabilitar-producto" className="text-xl font-black">¿Estás seguro?</h3>
              <p className="text-sm text-gray-700 mt-3">
                ¿Quieres retirar permanentemente la publicación <strong>{productoPorInhabilitar.nombre}</strong>?
              </p>
              <p className="text-xs text-gray-500 mt-2">El registro permanecerá en la base de datos, pero dejará de mostrarse.</p>
              {error && <p role="alert" className="text-red-700 text-xs mt-3">{error}</p>}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button type="button" disabled={inhabilitandoProducto} onClick={() => setProductoPorInhabilitar(null)}
                  className="py-3 rounded-xl bg-gray-100 text-gray-800 font-black">Cancelar</button>
                <button type="button" disabled={inhabilitandoProducto} onClick={confirmarInhabilitacion}
                  className="py-3 rounded-xl bg-red-600 text-white font-black disabled:opacity-50">
                  {inhabilitandoProducto ? 'Retirando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {vendedorPorQuitar && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-5">
            <div role="alertdialog" aria-modal="true" aria-labelledby="titulo-quitar-vendedor"
              aria-describedby="descripcion-quitar-vendedor"
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
              <h3 id="titulo-quitar-vendedor" className="text-xl font-black text-gray-900">¿Quitar vendedor?</h3>
              <p id="descripcion-quitar-vendedor" className="text-sm text-gray-700 mt-3">
                ¿Seguro que quieres retirar el rol de Vendedor a <strong>{vendedorPorQuitar.nombre}</strong>?
              </p>
              <p className="text-xs text-gray-600 mt-3">
                Su cuenta y sus registros seguirán en la base de datos, pero sus productos y pedidos antiguos dejarán de mostrarse definitivamente en Campy.
              </p>
              {errorVendedores && <p role="alert" className="text-red-700 text-xs mt-3">{errorVendedores}</p>}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button type="button" disabled={quitandoVendedor} onClick={() => { setVendedorPorQuitar(null); setErrorVendedores(''); }}
                  className="py-3 rounded-xl bg-gray-100 text-gray-800 font-black disabled:opacity-50">
                  Cancelar
                </button>
                <button type="button" disabled={quitandoVendedor} onClick={quitarVendedor}
                  className="py-3 rounded-xl bg-red-600 text-white font-black disabled:opacity-50">
                  {quitandoVendedor ? 'Procesando...' : 'Sí, quitar'}
                </button>
              </div>
            </div>
          </div>
        )}

        <nav aria-label="Menú del moderador" className="absolute bottom-0 inset-x-0 bg-white rounded-t-[28px] border-t border-gray-100 shadow-lg p-4 flex justify-center gap-2">
          <button type="button" aria-current={pestana === 'comprador' ? 'page' : undefined} onClick={() => setPestana('comprador')}
            className={`flex-1 px-2 py-3 rounded-xl text-xs font-bold ${pestana === 'comprador' ? 'bg-[#0A3895] text-white' : 'bg-gray-100 text-[#0A3895]'}`}>
            Comprador
          </button>
          <button type="button" aria-current={pestana === 'vendedor' ? 'page' : undefined} onClick={() => setPestana('vendedor')}
            className={`flex-1 px-2 py-3 rounded-xl text-xs font-bold ${pestana === 'vendedor' ? 'bg-[#0A3895] text-white' : 'bg-orange-100 text-[#0A3895]'}`}>
            Vendedor
          </button>
          <button type="button" aria-current={pestana === 'cuenta' ? 'page' : undefined} onClick={() => setPestana('cuenta')}
            className={`flex-1 px-2 py-3 rounded-xl text-xs font-bold ${pestana === 'cuenta' ? 'bg-[#0A3895] text-white' : 'bg-blue-100 text-[#0A3895]'}`}>
            Mi cuenta
          </button>
        </nav>
      </div>
    </div>
  );
}
