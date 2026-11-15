
CREATE TABLE IF NOT EXISTS public.calificaciones_pedidos (
    id_calificacion BIGSERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL UNIQUE
        REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
    id_comprador INTEGER NOT NULL
        REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    estrellas SMALLINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario TEXT NOT NULL DEFAULT ''
        CHECK (char_length(comentario) <= 1000),
    fecha_calificacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tarjetas_guardadas (
    id_tarjeta BIGSERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL
        REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    titular VARCHAR(80) NOT NULL,
    marca VARCHAR(30) NOT NULL DEFAULT 'Visa (prueba)',
    ultimos4 CHAR(4) NOT NULL
        CHECK (ultimos4 ~ '^[0-9]{4}$'),
    vencimiento CHAR(5) NOT NULL
        CHECK (vencimiento ~ '^(0[1-9]|1[0-2])/[0-9]{2}$'),
    predeterminada BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tarjetas_guardadas_una_default
    ON public.tarjetas_guardadas(id_usuario)
    WHERE predeterminada;

CREATE INDEX IF NOT EXISTS tarjetas_guardadas_usuario
    ON public.tarjetas_guardadas(id_usuario);

REVOKE ALL ON
    public.calificaciones_pedidos,
    public.tarjetas_guardadas
FROM anon, authenticated;
