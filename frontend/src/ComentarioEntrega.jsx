import React, { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default function ComentarioEntrega({ pedidoId, comentarioInicial = '', otros = [], onGuardado = () => {}, permitir = true }) {
  const [texto, setTexto] = useState(comentarioInicial || '');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    setMensaje('');
    try {
      const token = localStorage.getItem('campy_token');
      if (!token) throw new Error('Inicia sesión para comentar.');
      const r = await fetch(`${API_URL}/api/pedidos/${pedidoId}/comentario-entrega`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({comentario:texto.trim()})
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(datos.mensaje || 'No se pudo guardar el comentario.');
      setMensaje('Comentario guardado.');
      onGuardado();
    } catch (e) { setMensaje(e.message); }
    finally { setGuardando(false); }
  };
  return (
    <section className="rounded-2xl bg-blue-50/60 border border-blue-100 p-3 space-y-2" onClick={e=>e.stopPropagation()}>
      <h4 className="font-black text-xs text-[#0A3895]">Comentarios de la entrega</h4>
      {otros.filter(o => o.texto).map((o,i)=><p key={i} className="text-xs text-gray-700"><strong>{o.nombre}:</strong> {o.texto}</p>)}
      {permitir && <>
        <textarea value={texto} onChange={e=>setTexto(e.target.value)} maxLength={500} rows={2}
          placeholder="Indicaciones para la entrega (máximo 500 caracteres)"
          className="w-full rounded-xl border border-blue-100 bg-white p-2 text-xs text-gray-800" />
        <button type="button" disabled={guardando} onClick={guardar}
          className="rounded-xl bg-[#0A3895] text-white px-4 py-2 text-xs font-bold disabled:opacity-50">
          {guardando?'Guardando...':'Guardar comentario'}
        </button>
      </>}
      {mensaje && <p role="status" className="text-[11px] text-gray-700">{mensaje}</p>}
    </section>
  );
}
