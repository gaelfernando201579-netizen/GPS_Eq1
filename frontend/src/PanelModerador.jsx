import React, { useCallback, useEffect, useState } from 'react';
import logoCampy from './assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PanelModerador({ token, usuario, productos = [], cargandoProductos = false, errorProductos = '', cerrarSesion }) {
  const [pestana, setPestana] = useState('vendedor');
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [comentarios, setComentarios] = useState({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

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

  useEffect(() => { cargar(); }, [cargar]);

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
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(null);
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
              {cargandoProductos ? (
                <p className="text-gray-600 text-center py-10">Cargando productos...</p>
              ) : errorProductos ? (
                <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-sm">{errorProductos}</p>
              ) : productos.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
                  No hay productos para mostrar.
                </div>
              ) : (
                <>
                  <h3 className="font-black text-[#0A3895] text-sm mb-4">Productos disponibles ({productos.length})</h3>
                  {productos.map((producto) => (
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
                        <p className="font-black text-[#FF8C00] mt-2">${Number(producto.precio || 0).toFixed(2)}</p>
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
                <button type="button" onClick={cargar} className="text-xs font-bold text-[#0A3895] bg-blue-50 rounded-xl px-3 py-2">Actualizar</button>
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
              <button type="button" onClick={cerrarSesion} className="w-full bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 font-black text-sm">
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

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
