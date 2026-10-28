import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function initDB() {
  try {
    // Creación de Tablas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        correo VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        carrera VARCHAR(255),
        telefono VARCHAR(50),
        es_emprendedor INTEGER DEFAULT 0,
        metodo_pago_pref VARCHAR(100) DEFAULT 'Efectivo',
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        tienda VARCHAR(255) NOT NULL,
        ubicacion VARCHAR(255) NOT NULL,
        precio NUMERIC(10, 2) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        vendedor_id INTEGER REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        comprador_id INTEGER NOT NULL REFERENCES usuarios(id),
        estado VARCHAR(50) DEFAULT 'Confirmado',
        total NUMERIC(10, 2) NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS detalles_pedido (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        cantidad INTEGER NOT NULL,
        precio_unitario NUMERIC(10, 2) NOT NULL
      );
    `);

    // Insertar catálogo inicial si está vacío
    const resCount = await pool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(resCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO productos (nombre, tienda, ubicacion, precio, categoria) VALUES
        ('Torta de Jamón', 'Vende: Juan Pérez', 'Edificio L', 35, 'Comida'),
        ('Croissant Preparado', 'Vende: Ana Gómez', 'Kiosco Central', 45, 'Comida'),
        ('Rebanada de Pizza', 'Vende: Luis', 'Canchas', 25, 'Comida'),
        ('Fresas con Crema', 'Vende: María', 'Entrada Principal', 45, 'Postres'),
        ('Tartaletas de Frutas', 'Vende: Sofía', 'Edificio D', 30, 'Postres'),
        ('Memoria USB 32GB', 'Vende: Carlos', 'Biblioteca', 120, 'Tecnología'),
        ('Paquete 5 Folders', 'Vende: Diana', 'Biblioteca', 15, 'Papelería'),
        ('Coca-Cola 600ml', 'Vende: Juan Pérez', 'Edificio L', 20, 'Bebidas'),
        ('Arizona de Sandía', 'Vende: Luis', 'Canchas', 25, 'Bebidas'),
        ('Electrolit Fresa', 'Vende: Ana Gómez', 'Kiosco Central', 32, 'Bebidas'),
        ('Doritos Nacho', 'Vende: Pedro', 'Pasillo Central', 18, 'Sabritas'),
        ('Picafresas (10pz)', 'Vende: María', 'Entrada Principal', 15, 'Dulces');
      `);
    }

    console.log('📦 Conectado exitosamente a Supabase (PostgreSQL)');
  } catch (error) {
    console.error('❌ Error al conectar o inicializar la BD:', error.message);
  }
}