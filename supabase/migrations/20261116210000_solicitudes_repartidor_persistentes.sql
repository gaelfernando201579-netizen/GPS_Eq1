CREATE TABLE IF NOT EXISTS public.pedido_repartos (
  id_pedido INTEGER PRIMARY KEY REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
  id_repartidor INTEGER REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT,
  lugar_recoleccion TEXT NOT NULL,
  punto_entrega TEXT NOT NULL,
  comision NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (comision >= 0),
  estado TEXT NOT NULL DEFAULT 'Buscando repartidor'
    CHECK (estado IN ('Buscando repartidor','Aceptado','Listo','Repartidor llegó','Recibido','En camino','En el punto de entrega','Entregado')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pedido_repartos_estado
  ON public.pedido_repartos(estado, id_repartidor);
REVOKE ALL ON public.pedido_repartos FROM anon, authenticated;
