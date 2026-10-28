# Campy — Backend de arranque

Node.js + Express con endpoints **solo de lectura**, usando la clave publicable
para respetar RLS. No incluye autenticación real ni creación de pedidos todavía.

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Edita backend/.env con la URL y publishable key en Supabase Settings > API Keys
npm run dev
```

Comprueba `http://localhost:3001/api/health`, `.../api/productos`
y `.../api/categorias`. Si RLS no permite SELECT para anon, el backend no devolverá
los registros hasta que definas políticas seguras. No desactives RLS como solución.

Jamás guardes claves secretas en `frontend/` ni en GitHub. El backend todavía
no implementa inicio de sesión ni operaciones de escritura.
