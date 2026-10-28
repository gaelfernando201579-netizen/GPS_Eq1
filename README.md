# CAMPY — GPS Eq1

## Estructura

- `frontend/`: codigo original, sin cambios funcionales ni archivos adicionales.
- `backend/`: API inicial Node.js + Express (separada, no conectada todavia con las pantallas del frontend).
- `supabase/migrations/`: historial de cambios de estructura. Se encuentra vacia hasta ejecutar `supabase db pull` en el proyecto enlazado.
- `supabase/seeds/50_productos.sql`: carga manual de 50 productos de ejemplo en una base de pruebas.
- `supabase/seeds/seed_staging_completo.sql`: carga de prueba extendida, con requisitos adicionales.
- `supabase/seed.sql`: vacia; no ejecuta automaticamente los 50 productos.

## Ejecutar el frontend (exactamente como en el ZIP original)

Desde la raiz del repositorio:

```powershell
cd frontend
npm install
npm run dev
```

## Backend separado

En otra terminal, desde la raiz:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edita `backend/.env` con la URL del proyecto y clave publicable de Supabase.

```powershell
npm run dev
```

La API de lectura incluye `/api/health`, `/api/productos` y `/api/categorias`, pero el frontend original sigue usando sus datos existentes y no consume estas rutas todavia.

## Migraciones de una base de Supabase ya existente

Desde la raiz del repositorio, con Node.js y Docker disponibles cuando se requiera:

```powershell
npm install --save-dev supabase
npx supabase init
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db pull
npx supabase migration list
```

El `db pull` crea una migracion local inicial a partir del esquema remoto, sin sustituir ni duplicar las tablas existentes. Revisa el historial de migraciones y verifica los cambios antes de ejecutar `db push`. Si el CLI te ofrece marcar la migracion base como aplicada en remoto, revisa y confirma que corresponde al mismo esquema ya existente.

## Semillas (solo pruebas/desarrollo)

La carpeta `supabase/seeds` contiene scripts SQL que **no se ejecutan por subirlos a GitHub**. Para agregar productos, usa el SQL Editor del proyecto de pruebas en Supabase y ejecuta SOLO `50_productos.sql`.

Requisitos: al menos una categoria y un producto existente asociado a un vendedor. El script no crea usuarios; genera 50 productos etiquetados como `Campy Demo - ...`, evitando duplicarlos si se ejecuta otra vez.

Alternativamente, `seed_staging_completo.sql` carga varias tablas ademas de los 50 productos, requiere un conjunto mayor de datos previos y no se debe ejecutar junto con `50_productos.sql`.

**ADVERTENCIA:** Tu captura muestra `main (PRODUCTION)`; usa una base de desarrollo o una copia de pruebas, haz respaldo y no ejecutes `db reset --linked` en produccion. La ejecucion de SQL no debe hacerse sin revisar FKs y restricciones reales.

NOTA: El `frontend/README.md` es el archivo original, incluidos los marcadores de conflicto de merge que ya contenia. No fue editado para preservar el codigo original exactamente.
