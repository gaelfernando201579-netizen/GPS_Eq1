import React, { useState, useEffect } from 'react';
import CampyLogin from './CampyLogin';
import HomeComprador from './HomeComprador';
import MisPedidos from './MisPedidos';
import MiPerfil from './MiPerfil';
import PanelVendedor from './PanelVendedor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PRODUCTOS_INICIALES = [
  { id: 1, nombre: 'Torta de Jamón', tienda: 'Vende: Juan Pérez', ubicacion: 'Edificio L', precio: 35, categoria: 'Comida', definicion: 'Torta recién hecha con jamón de pavo, queso, aguacate y jitomate.', comentario: 'Incluye sobrecito de chiles jalapeños', imagen: null },
  { id: 2, nombre: 'Croissant Preparado', tienda: 'Vende: Ana Gómez', ubicacion: 'Kiosco Central', precio: 45, categoria: 'Comida', definicion: 'Croissant dorado a la plancha con pechuga de pavo y queso manchego.', comentario: 'Calientito, recién salido', imagen: null },
  { id: 3, nombre: 'Rebanada de Pizza', tienda: 'Vende: Luis', ubicacion: 'Canchas', precio: 25, categoria: 'Comida', definicion: 'Rebanada grande de pepperoni con extra queso.', comentario: 'Entregas rápidas en las gradas', imagen: null },
  { id: 4, nombre: 'Fresas con Crema', tienda: 'Vende: María', ubicacion: 'Entrada Principal', precio: 45, categoria: 'Postres', definicion: 'Vaso de 12oz con fresas frescas y crema dulce casera.', comentario: 'Puedes pedir topping de granola o nuez sin costo', imagen: null },
  { id: 5, nombre: 'Tartaletas de Frutas', tienda: 'Vende: Sofía', ubicacion: 'Edificio D', precio: 30, categoria: 'Postres', definicion: 'Base crujiente con crema pastelera, kiwi, fresa y durazno.', comentario: 'Hechas hoy por la mañana', imagen: null },
  { id: 6, nombre: 'Memoria USB 32GB', tienda: 'Vende: Carlos', ubicacion: 'Biblioteca', precio: 120, categoria: 'Tecnología', definicion: 'Memoria Kingston 32GB USB 3.2 totalmente nueva en blíster.', comentario: 'Garantía de 1 mes', imagen: null },
  { id: 7, nombre: 'Paquete 5 Folders', tienda: 'Vende: Diana', ubicacion: 'Biblioteca', precio: 15, categoria: 'Papelería', definicion: 'Folders tamaño carta color crema para entregas escolares.', comentario: 'Incluye broches Baco si los necesitas (+$3)', imagen: null },
  { id: 8, nombre: 'Coca-Cola 600ml', tienda: 'Vende: Juan Pérez', ubicacion: 'Edificio L', precio: 20, categoria: 'Bebidas', definicion: 'Refresco bien frío en botella de 600ml.', comentario: 'Directo de hielera', imagen: null },
  { id: 9, nombre: 'Arizona de Sandía', tienda: 'Vende: Luis', ubicacion: 'Canchas', precio: 25, categoria: 'Bebidas', definicion: 'Lata grande de 680ml sabor sandía bien fría.', comentario: 'Ideal para después de jugar', imagen: null },
  { id: 10, nombre: 'Electrolit Fresa', tienda: 'Vende: Ana Gómez', ubicacion: 'Kiosco Central', precio: 32, categoria: 'Bebidas', definicion: 'Suero rehidratante sabor fresa de 625ml.', comentario: 'Muy frío', imagen: null },
  { id: 11, nombre: 'Doritos Nacho', tienda: 'Vende: Pedro', ubicacion: 'Pasillo Central', precio: 18, categoria: 'Sabritas', definicion: 'Bolsa individual de Doritos Nacho con queso.', comentario: 'Le pongo salsa Valentina y limón gratis', imagen: null },
  { id: 12, nombre: 'Picafresas (10pz)', tienda: 'Vende: María', ubicacion: 'Entrada Principal', precio: 15, categoria: 'Dulces', definicion: 'Bolsita con 10 picafresas Vero.', comentario: 'También vendo sueltas a $2', imagen: null },
];

const PEDIDOS_VENDEDOR_INICIALES = [
  {
    id: 48201,
    compradorNombre: 'Dalia Montserrat Caballero Silva',
    compradorCarrera: 'Ing. Sistemas Computacionales',
    puntoEntrega: 'Edificio L - Salón L3',
    hora: '10:30 AM',
    metodoPago: 'Efectivo',
    estado: 'Pendiente',
    notaCancelacion: '',
    total: 70,
    items: [
      { nombre: 'Pay de Limón Casero', cantidad: 2, precio: 35 }
    ]
  },
  {
    id: 48209,
    compradorNombre: 'Gael Fernando Ortíz Pérez',
    compradorCarrera: 'Ing. Sistemas Computacionales',
    puntoEntrega: 'Bancas de Biblioteca Central',
    hora: '11:15 AM',
    metodoPago: 'Transferencia',
    estado: 'Pendiente',
    notaCancelacion: '',
    total: 45,
    items: [
      { nombre: 'Brownie con Nuez', cantidad: 1, precio: 45 }
    ]
  }
];

function App() {
  const [pantallaActual, setPantallaActual] = useState('login');
  const [tokenAuth, setTokenAuth] = useState(localStorage.getItem('campy_token') || null);
  const [usuarioActual, setUsuarioActual] = useState({
    nombre: 'Carlos Yahel Alemán Cruz',
    correo: 'estudiante@itoaxaca.edu.mx',
    carrera: 'Ing. Sistemas Computacionales',
    esVendedor: false,
    datosVendedor: null
  });

  const [productosCatalogo, setProductosCatalogo] = useState(PRODUCTOS_INICIALES);
  const [carritoGlobal, setCarritoGlobal] = useState({});
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [pedidosPorCumplir, setPedidosPorCumplir] = useState(PEDIDOS_VENDEDOR_INICIALES);

  // Sincronización inicial con el backend (Supabase) si está disponible
  useEffect(() => {
    fetch(`${API_URL}/api/productos`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProductosCatalogo(data);
        }
      })
      .catch(() => {
        // Mantiene catálogo semilla si el backend está apagado
      });
  }, []);

  const manejarIngreso = (datosUsuario, token = null) => {
    if (token) {
      localStorage.setItem('campy_token', token);
      setTokenAuth(token);
    }
    if (datosUsuario) {
      setUsuarioActual((prev) => ({
        ...prev,
        nombre: datosUsuario.nombre || prev.nombre,
        correo: datosUsuario.correo || prev.correo,
        carrera: datosUsuario.carrera || prev.carrera
      }));
    }
    setPantallaActual('home');
  };

  const procesarCompra = async (itemsComprados) => {
    setPedidoActivo(itemsComprados);

    // También agrega el pedido a la bandeja de pedidos por cumplir para demostración en vivo
    const totalOrden = itemsComprados.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const nuevoPedidoId = Math.floor(Math.random() * 90000) + 10000;
    const nuevoPedido = {
      id: nuevoPedidoId,
      compradorNombre: usuarioActual.nombre,
      compradorCarrera: usuarioActual.carrera,
      puntoEntrega: 'Edificio L - Planta Baja',
      hora: 'Hace un momento',
      metodoPago: 'Efectivo',
      estado: 'Pendiente',
      notaCancelacion: '',
      total: totalOrden,
      items: itemsComprados
    };
    setPedidosPorCumplir((prev) => [nuevoPedido, ...prev]);

    try {
      if (tokenAuth) {
        await fetch(`${API_URL}/api/pedidos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAuth}`
          },
          body: JSON.stringify({ items: itemsComprados })
        });
      }
    } catch {
      // Fallback local activo
    }

    setPantallaActual('pedidos');
  };

  // Al darse de alta como vendedor, guarda en backend y SACA al usuario de la vista cliente hacia 'vendedor'
  const registrarComoVendedor = async (datosVendedor) => {
    setUsuarioActual((prev) => ({
      ...prev,
      esVendedor: true,
      datosVendedor
    }));

    try {
      if (tokenAuth) {
        await fetch(`${API_URL}/api/usuarios/perfil`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAuth}`
          },
          body: JSON.stringify({
            nombre: datosVendedor.nombre,
            es_emprendedor: 1,
            datos_vendedor: datosVendedor
          })
        });
      }
    } catch {
      // Continúa en estado local si el backend no responde
    }

    // Saca de la vista de cliente y abre el nuevo menú exclusivo de vendedor
    setPantallaActual('vendedor');
  };

  const agregarNuevoProducto = async (nuevoProd) => {
    let idGenerado = Date.now();
    try {
      if (tokenAuth) {
        const resp = await fetch(`${API_URL}/api/productos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAuth}`
          },
          body: JSON.stringify(nuevoProd)
        });
        if (resp.ok) {
          const guardado = await resp.json();
          if (guardado.id) idGenerado = guardado.id;
        }
      }
    } catch {
      // Fallback local
    }

    setProductosCatalogo((prev) => [
      { ...nuevoProd, id: idGenerado },
      ...prev
    ]);
  };

  const editarProducto = async (idProducto, datosActualizados) => {
    setProductosCatalogo((prev) =>
      prev.map((prod) => (prod.id === idProducto ? { ...prod, ...datosActualizados } : prod))
    );
  };

  const eliminarProducto = async (idProducto) => {
    setProductosCatalogo((prev) => prev.filter((prod) => prod.id !== idProducto));
    setCarritoGlobal((prev) => {
      const copia = { ...prev };
      delete copia[idProducto];
      return copia;
    });
  };

  const cambiarEstadoPedidoVendedor = async (pedidoId, nuevoEstado, notaCancelacion = '') => {
    setPedidosPorCumplir((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado, notaCancelacion } : p
      )
    );
  };

  return (
    <>
      {pantallaActual === 'login' && (
        <CampyLogin alIngresar={manejarIngreso} />
      )}
      
      {pantallaActual === 'home' && (
        <HomeComprador 
          productos={productosCatalogo}
          carrito={carritoGlobal} 
          setCarrito={setCarritoGlobal}
          irAPedidos={procesarCompra} 
          irAPerfil={() => setPantallaActual('perfil')} 
        />
      )}

      {pantallaActual === 'pedidos' && (
        <MisPedidos 
          pedido={pedidoActivo} 
          pedidosVendedor={pedidosPorCumplir}
          irAInicio={() => setPantallaActual('home')} 
          irAPerfil={() => setPantallaActual('perfil')} 
        />
      )}

      {pantallaActual === 'perfil' && (
        <MiPerfil 
          usuario={usuarioActual}
          setUsuario={setUsuarioActual}
          registrarComoVendedor={registrarComoVendedor}
          irAPanelVendedor={() => setPantallaActual('vendedor')}
          irAInicio={() => setPantallaActual('home')}
          irAPedidos={() => setPantallaActual('pedidos')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setCarritoGlobal({});
            setPedidoActivo(null);
            setPantallaActual('login');
          }}
        />
      )}

      {pantallaActual === 'vendedor' && (
        <PanelVendedor
          usuario={usuarioActual}
          actualizarDatosVendedor={(nuevosDatos) =>
            setUsuarioActual((prev) => ({ ...prev, datosVendedor: nuevosDatos }))
          }
          misProductos={productosCatalogo.filter((p) => p.esMio)}
          agregarNuevoProducto={agregarNuevoProducto}
          editarProducto={editarProducto}
          eliminarProducto={eliminarProducto}
          pedidosVendedor={pedidosPorCumplir}
          cambiarEstadoPedidoVendedor={cambiarEstadoPedidoVendedor}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setCarritoGlobal({});
            setPedidoActivo(null);
            setPantallaActual('login');
          }}
        />
      )}
    </>
  );
}

export default App;
