-- Guardar exclusivamente el método elegido. Esto NO acredita pagos reales.
-- Requiere public.pedidos, public.usuarios y public.tarjetas_guardadas.
CREATE TABLE IF NOT EXISTS public.pedido_metodos_pago (
    pedido_id INTEGER PRIMARY KEY
        REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
    id_comprador INTEGER NOT NULL
        REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    metodo VARCHAR(20) NOT NULL
        CHECK (metodo IN ('Efectivo', 'Transferencia', 'Tarjeta')),
    id_tarjeta BIGINT
        REFERENCES public.tarjetas_guardadas(id_tarjeta) ON DELETE SET NULL,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pedido_metodos_pago_comprador_idx
    ON public.pedido_metodos_pago (id_comprador);

REVOKE ALL ON public.pedido_metodos_pago FROM anon, authenticated;
