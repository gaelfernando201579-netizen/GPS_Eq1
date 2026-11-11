
import { useState } from 'react';
import { guardarTarjeta } from './tarjetasDemo.js';

export default function FormularioTarjetaDemo({
  usuarioId,
  alGuardar,
  alCancelar
}) {
  const [titular, setTitular] = useState('');
  const [numero, setNumero] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');

  function guardar(e) {
    e.preventDefault();

    try {
      const tarjeta = guardarTarjeta(usuarioId, {
        titular,
        numero,
        vencimiento,
        cvv
      });

      setNumero('');
      setCvv('');

      alGuardar?.(tarjeta);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form
      onSubmit={guardar}
      autoComplete="off"
      className="space-y-3 rounded-2xl border border-blue-100 bg-white p-3"
    >
      <h4 className="font-black text-[#0A3895]">
        Agregar tarjeta
      </h4>

      <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg p-2">
        Solo se aceptan tarjetas de prueba.
        No introduzcas información bancaria real.
      </p>

      <label className="block text-xs font-semibold">
        Nombre del titular

        <input
          className="mt-1 w-full rounded-lg border p-2"
          required
          maxLength={80}
          value={titular}
          onChange={e => setTitular(e.target.value)}
          placeholder="Nombre y apellido"
          autoComplete="off"
        />
      </label>

      <label className="block text-xs font-semibold">
        Número de tarjeta

        <input
          className="mt-1 w-full rounded-lg border p-2"
          required
          inputMode="numeric"
          value={numero}
          onChange={e =>
            setNumero(
              e.target.value
                .replace(/[^\d ]/g, '')
                .slice(0, 19)
            )
          }
          placeholder="4242 4242 4242 4242"
          autoComplete="off"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-semibold">
          Vencimiento

          <input
            className="mt-1 w-full rounded-lg border p-2"
            required
            inputMode="numeric"
            placeholder="12/30"
            value={vencimiento}
            onChange={e =>
              setVencimiento(
                e.target.value
                  .replace(/[^\d/]/g, '')
                  .slice(0, 5)
              )
            }
            autoComplete="off"
          />
        </label>

        <label className="block text-xs font-semibold">
          CVV

          <input
            className="mt-1 w-full rounded-lg border p-2"
            required
            type="password"
            inputMode="numeric"
            placeholder="123"
            value={cvv}
            onChange={e =>
              setCvv(
                e.target.value
                  .replace(/\D/g, '')
                  .slice(0, 3)
              )
            }
            autoComplete="off"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {alCancelar && (
          <button
            type="button"
            onClick={alCancelar}
            className="flex-1 rounded-xl border px-3 py-3 font-bold text-sm"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          className="flex-1 rounded-xl bg-[#FF8C00] px-3 py-3 font-bold text-white text-sm"
        >
          Guardar tarjeta
        </button>
      </div>
    </form>
  );
}
