# CAMPY — instalación y restricciones del módulo de pagos

## Estado y arquitectura detectada

El ZIP tiene React/Vite, Express y PostgreSQL/Supabase. Solo trae la migración de solicitudes de vendedor; **no trae un respaldo completo del esquema SQL real**. El archivo `backend/src/config/db.js` contiene `initDB()` obsoleto que NO se llama desde `server.js`; se respetó la gestión por migraciones.

La tabla real de pedidos usada por el backend tiene `id_pedido`, `id_comprador`, `id_vendedor`, `subtotal`, `total`; detalle usa `id_pedido`, `cantidad`, `precio_unitario`. Se debe validar contra la base real antes del despliegue. No se migran ni confirman pedidos históricos automáticamente.

El modelo de pedidos actual crea un pedido por vendedor. No persiste un repartidor por pedido ni su tarifa; por eso se implementa la infraestructura de distribución, pero **no se cobra ni liquida automáticamente entrega**. La estructura de pago reserva los campos `repartidor_id` y `tarifa_entrega` para una futura integración verificada. Los pedidos nuevos cobran precio del vendedor + comisión por unidad; el catálogo muestra ese precio final. Las compras anteriores no reciben comisión retroactiva.

## Preparación

1. Respalda la BD de Supabase y trabaja primero en un proyecto de pruebas.
2. Confirma en PostgreSQL los nombres/tipos de `usuarios`, `pedidos`, `detalle_pedido`, `productos`, `usuario_roles`, `roles`; en particular que los IDs referenciados sean `INTEGER`. No ejecutar a ciegas si difieren.
3. Ejecuta `supabase/migrations/20261110090000_pagos.sql` usando el flujo habitual de migraciones; no uses `initDB()`.
4. `cd backend && npm install` (nuevas: `multer`, `sharp`, `file-type`). `npm test` para pruebas unitarias básicas.
5. Copia los nombres de `backend/.env.example` a tu `.env` existente y rellena los valores **sin publicar credenciales**. `PRIVATE_RECEIPTS_DIR` debe apuntar a una carpeta privada persistente fuera del directorio público, accesible solo al servidor y respaldada; en despliegues efímeros usa un almacenamiento privado persistente antes de habilitar la subida.
6. Reinicia el backend. Recompila frontend con `cd frontend && npm install && npm run build`.

## Endpoints

Comprador autenticado: `GET /api/pagos/cuenta-campy`, `GET /api/pagos/:pedidoId/estado`, `POST /api/pagos/:pedidoId/comprobante` (multipart campo `comprobante`, JPG/PNG/WEBP, 5 MB), `GET /api/pagos/:pedidoId/comprobante`, `POST /api/pagos/:pedidoId/verificar` (informa el mecanismo manual, no confirma).

Personal con rol `moderador`, `administrador` o `admin`: `GET /api/admin/pagos/pendientes`, `GET /api/admin/pagos/:id/comprobante`, `POST /api/admin/pagos/:id/resolver` (`decision`, `evidenciaBancaria`, `motivo`), `GET /api/admin/distribuciones`, `POST /api/admin/distribuciones/:id/liquidar` (`referencia`, `evidencia`), `POST /api/admin/comisiones` (`comisionFija`). Repartos propios: `GET /api/admin/distribuciones/mias` (usuario autenticado, filtrado por ID).

## Advertencias críticas

- Un comprobante, IA o CEP no demuestra por sí solo acreditación bancaria. Solo un moderador que cotejó el **ingreso real en la banca de CAMPY** debe confirmar con evidencia. El sistema no transfiere dinero.
- Sin `OPENAI_API_KEY` y `OPENAI_RECEIPT_MODEL` el análisis es no disponible, y se permite revisar manualmente. No existe consulta CEP automática implementada ni se sortea CAPTCHA.
- No se incluyen claves o cuentas reales. **Revisa y rota los secretos del ZIP original, que contenía archivos `.env`**, aunque se omiten del ZIP entregado.
- No se ha probado contra la base de datos real ni con transferencias reales, y las pruebas unitarias no sustituyen pruebas de integración de roles, SQL, concurrencia, almacenamiento privado ni operaciones bancarias.
- La funcionalidad de repartidores en React es parcialmente local y no soporta una distribución bancaria real con repartidor; integrar solo después de persistir asignación y tarifa en el backend y aplicar migración adicional.
- El panel muestra los pagos y permite resolverlos; la descarga de comprobantes del administrador requiere llamar a su endpoint autenticado. No compartir esos bytes ni enlaces públicos.
- Mantener el cambio de comisión mediante `POST /api/admin/comisiones`, no alterando pedidos ya existentes.

## Pruebas manuales antes de producción

Comprueba en una BD de pruebas: carga JPG, PNG, WEBP; rechaza SVG, PDF, archivos falsos y mayores a 5 MB; monto/cuenta discordantes; rastreos duplicados; CEP no disponible; cancelación; permisos de otro comprador; pedido nuevo separado por vendedor; confirmación manual con evidencia bancaria real; distribución exacta; duplicación de liquidación; y que pedidos sin pago confirmado no puedan avanzar. Prueba además reinicios del servidor, conservación privada de archivos y rollback de transacciones.
