import React, { useState, useEffect } from 'react';
import CampyLogin from './CampyLogin';
import HomeComprador from './HomeComprador';
import MisPedidos from './MisPedidos';
import MiPerfil from './MiPerfil';
import PanelVendedor from './PanelVendedor';
import PanelRepartidor from './PanelRepartidor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PEDIDOS_INICIALES = [
  {
    id: 48201,
    tienda: 'Vende: Juan Pérez',
    compradorNombre: 'Dalia Montserrat Caballero Silva',
    compradorCarrera: 'Ing. Sistemas Computacionales',
    lugarRecoleccion: 'Kiosco Central',
    puntoEntrega: 'Edificio L - Salón L3',
    hora: '10:30 AM',
    metodoPago: 'Efectivo',
    estado: 'Pendiente',
    requiereRepartidor: false,
    repartidorAsignado: null,
    costoProductoRepartidor: 70,
    comisionRepartidor: 10,
    notaCancelacion: '',
    total: 70,
    items: [
      { nombre: 'Pay de Limón Casero', cantidad: 2, precio: 35 }
    ]
  },
  {
    id: 48209,
    tienda: 'Vende: Ana Gómez',
    compradorNombre: 'Gael Fernando Ortíz Pérez',
    compradorCarrera: 'Ing. Sistemas Computacionales',
    lugarRecoleccion: 'Mesas de Kiosco Central',
    puntoEntrega: 'Bancas de Biblioteca Central',
    hora: '11:15 AM',
    metodoPago: 'Transferencia',
    estado: 'En preparación',
    requiereRepartidor: true,
    repartidorAsignado: null,
    costoProductoRepartidor: 45,
    comisionRepartidor: 12,
    notaCancelacion: '',
    total: 45,
    items: [
      { nombre: 'Croissant Preparado', cantidad: 1, precio: 45 }
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
    datosVendedor: null,
    esRepartidor: false,
    datosRepartidor: null
  });

  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');
  const [recargaCatalogo, setRecargaCatalogo] = useState(0);
  const [carritoGlobal, setCarritoGlobal] = useState({});
  const [pedidosPorCumplir, setPedidosPorCumplir] = useState(PEDIDOS_INICIALES);

  useEffect(() => {
    let vigente = true;

    const obtenerCatalogo = async () => {
      setCargandoProductos(true);
      setErrorProductos('');
      try {
        const respuesta = await fetch(`${API_URL}/api/productos`);
        if (!respuesta.ok) throw new Error('No fue posible consultar el catálogo.');
        const datos = await respuesta.json();
        if (!Array.isArray(datos)) throw new Error('La respuesta del catálogo no es válida.');

        if (vigente) {
          setProductosCatalogo(datos.map((producto) => ({
            ...producto,
            id: producto.id_producto,
            precio: Number(producto.precio),
            categoria: producto.categoria || 'Sin categoría',
            tienda: producto.nombre_vendedor ? `Vende: ${producto.nombre_vendedor}` : 'Vendedor no disponible',
            ubicacion: 'Por acordar con el vendedor',
          })));
        }
      } catch (error) {
        if (vigente) {
          setProductosCatalogo([]);
          setErrorProductos('No se pudieron cargar los productos de Supabase.');
        }
      } finally {
        if (vigente) setCargandoProductos(false);
      }
    };

    obtenerCatalogo();
    return () => { vigente = false; };
  }, [recargaCatalogo]);

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
        carrera: datosUsuario.carrera || prev.carrera,
        id_usuario: datosUsuario.id_usuario,
        esVendedor: datosUsuario.esVendedor === true,
        datosVendedor: null,
        esRepartidor: false,
        datosRepartidor: null
      }));
    }
    setPantallaActual(datosUsuario?.esVendedor === true ? 'vendedor' : 'home');
    setRecargaCatalogo((n) => n + 1);
  };

  const procesarCompra = async (itemsComprados) => {
    const totalOrden = itemsComprados.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const nuevoPedidoId = Math.floor(Math.random() * 90000) + 10000;
    const primerItem = itemsComprados[0] || {};

    const nuevoPedido = {
      id: nuevoPedidoId,
      tienda: primerItem.tienda || 'Vendedor Campus ITO',
      compradorNombre: usuarioActual.nombre,
      compradorCarrera: usuarioActual.carrera,
      lugarRecoleccion: primerItem.ubicacion || 'Edificio L',
      puntoEntrega: 'Edificio L - Salón L3',
      hora: 'Hace un momento',
      metodoPago: 'Efectivo',
      estado: 'Pendiente',
      requiereRepartidor: false,
      repartidorAsignado: null,
      costoProductoRepartidor: totalOrden,
      comisionRepartidor: 10,
      notaCancelacion: '',
      total: totalOrden,
      items: itemsComprados
    };

    setPedidosPorCumplir((prev) => [nuevoPedido, ...prev]);
    setCarritoGlobal({});
    setPantallaActual('pedidos');
  };

  const registrarComoVendedor = async (datosVendedor) => {
    setUsuarioActual((prev) => ({
      ...prev,
      esVendedor: true,
      datosVendedor
    }));
    setPantallaActual('vendedor');
  };

  const registrarComoRepartidor = async (datosRepartidor) => {
    setUsuarioActual((prev) => ({
      ...prev,
      esRepartidor: true,
      datosRepartidor
    }));
    setPantallaActual('repartidor');
  };

  const agregarNuevoProducto = async (nuevoProd) => {
    setProductosCatalogo((prev) => [
      { ...nuevoProd, id: Date.now() },
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

  // Cuando el vendedor acepta un pedido y configura si lo lleva él o un repartidor
  const configurarAceptacionPedido = async (pedidoId, config) => {
    setPedidosPorCumplir((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, ...config } : p))
    );
  };

  // Cuando el vendedor o repartidor cambia el estado (En preparación, En camino, En el punto de entrega, Entregado, Cancelado)
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado, notaCancelacion = '') => {
    setPedidosPorCumplir((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? { ...p, estado: nuevoEstado, notaCancelacion: notaCancelacion || p.notaCancelacion }
          : p
      )
    );
  };

  // Cuando un repartidor acepta llevar un pedido disponible
  const tomarPedidoRepartidor = (pedidoId, nombreRepartidor) => {
    setPedidosPorCumplir((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? { ...p, repartidorAsignado: nombreRepartidor, estado: 'En camino' }
          : p
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
          cargandoProductos={cargandoProductos}
          errorProductos={errorProductos}
          recargarProductos={() => setRecargaCatalogo((n) => n + 1)}
          carrito={carritoGlobal} 
          setCarrito={setCarritoGlobal}
          irAPedidos={procesarCompra} 
          irAPerfil={() => setPantallaActual('perfil')} 
        />
      )}

      {pantallaActual === 'pedidos' && (
        <MisPedidos 
          pedidosVendedor={pedidosPorCumplir}
          cambiarEstadoPedido={cambiarEstadoPedido}
          irAInicio={() => setPantallaActual('home')} 
          irAPerfil={() => setPantallaActual('perfil')} 
        />
      )}

      {pantallaActual === 'perfil' && (
        <MiPerfil 
          usuario={usuarioActual}
          setUsuario={setUsuarioActual}
          registrarComoVendedor={registrarComoVendedor}
          registrarComoRepartidor={registrarComoRepartidor}
          irAPanelVendedor={() => setPantallaActual('vendedor')}
          irAPanelRepartidor={() => setPantallaActual('repartidor')}
          irAInicio={() => setPantallaActual('home')}
          irAPedidos={() => setPantallaActual('pedidos')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setCarritoGlobal({});
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
          configurarAceptacionPedido={configurarAceptacionPedido}
          cambiarEstadoPedidoVendedor={cambiarEstadoPedido}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setCarritoGlobal({});
            setPantallaActual('login');
          }}
        />
      )}

      {pantallaActual === 'repartidor' && (
        <PanelRepartidor
          usuario={usuarioActual}
          pedidos={pedidosPorCumplir}
          tomarPedidoRepartidor={tomarPedidoRepartidor}
          cambiarEstadoPedido={cambiarEstadoPedido}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setCarritoGlobal({});
            setPantallaActual('login');
          }}
        />
      )}
    </>
  );
}

export default App;