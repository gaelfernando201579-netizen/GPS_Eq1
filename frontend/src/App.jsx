import React, { useState, useEffect } from 'react';
import CampyLogin from './CampyLogin';
import CampyRegistro from './CampyRegistro';
import HomeComprador from './HomeComprador';
import MisPedidos from './MisPedidos';
import MiPerfil from './MiPerfil';
import PanelVendedor from './PanelVendedor';
import PanelRepartidor from './PanelRepartidor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [pantallaActual, setPantallaActual] = useState('login');
  const [registroExitoso, setRegistroExitoso] = useState(false);
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
  const [pedidosPorCumplir, setPedidosPorCumplir] = useState([]);
  const [pedidosParaVendedor, setPedidosParaVendedor] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState('');

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
        esRepartidor: datosUsuario.esRepartidor === true,
        datosRepartidor: null
      }));
    }
    setPantallaActual(
      datosUsuario?.esVendedor === true
        ? 'vendedor'
        : datosUsuario?.esRepartidor === true
          ? 'repartidor'
          : 'home'
    );
    setRecargaCatalogo((n) => n + 1);
  };

  useEffect(() => {
    if (!tokenAuth || pantallaActual === 'login' || pantallaActual === 'repartidor') return;
    let vigente = true;
    const vendedor = pantallaActual === 'vendedor';
    const ruta = vendedor ? '/api/pedidos/vendedor' : '/api/pedidos';

    const cargar = async () => {
      if (!vendedor) setCargandoPedidos(true);
      setErrorPedidos('');
      try {
        const respuesta = await fetch(`${API_URL}${ruta}`, {
          headers: { Authorization: `Bearer ${tokenAuth}` }
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron consultar los pedidos.');
        if (!Array.isArray(datos)) throw new Error('La respuesta de pedidos no es válida.');
        if (vigente) {
          if (vendedor) setPedidosParaVendedor(datos);
          else setPedidosPorCumplir(datos);
        }
      } catch (error) {
        if (vigente) setErrorPedidos(error.message || 'No se pudieron consultar los pedidos.');
      } finally {
        if (vigente) setCargandoPedidos(false);
      }
    };
    cargar();
    return () => { vigente = false; };
  }, [pantallaActual, tokenAuth]);

  const procesarCompra = async (itemsComprados, datosEntrega) => {
    const token = localStorage.getItem('campy_token') || tokenAuth;
    if (!token) throw new Error('Tu sesión no tiene token. Cierra sesión y vuelve a ingresar.');

    const respuesta = await fetch(`${API_URL}/api/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        items: itemsComprados.map((item) => ({
          id_producto: Number(item.id_producto || item.id),
          cantidad: Number(item.cantidad)
        })),
        puntoEntrega: datosEntrega.puntoEntrega,
        horarioEntrega: datosEntrega.horarioEntrega
      })
    });
    const resultado = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo guardar el pedido en Supabase.');

    setCarritoGlobal({});
    setPantallaActual('pedidos');
    return resultado;
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
    setPedidosParaVendedor((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, ...config } : p))
    );
  };

  // Cuando el vendedor o repartidor cambia el estado (En preparación, En camino, En el punto de entrega, Entregado, Cancelado)
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado, notaCancelacion = '') => {
    setPedidosPorCumplir((prev) =>
      prev.map((p) => p.id === pedidoId
        ? { ...p, estado: nuevoEstado, notaCancelacion: notaCancelacion || p.notaCancelacion }
        : p)
    );
    setPedidosParaVendedor((prev) =>
      prev.map((p) => p.id === pedidoId
        ? { ...p, estado: nuevoEstado, notaCancelacion: notaCancelacion || p.notaCancelacion }
        : p)
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
        <CampyLogin alIngresar={manejarIngreso} irARegistro={() => setPantallaActual('registro')} registroExitoso={registroExitoso} />
      )}
      
      {pantallaActual === 'registro' && (
        <CampyRegistro
          volverAlLogin={() => setPantallaActual('login')}
          alRegistrar={() => { setRegistroExitoso(true); setPantallaActual('login'); }}
        />
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
          cargandoPedidos={cargandoPedidos}
          errorPedidos={errorPedidos}
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
            setTokenAuth(null);
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
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
          misProductos={productosCatalogo.filter(
            (p) => Number(p.id_vendedor) === Number(usuarioActual.id_usuario)
          )}
          agregarNuevoProducto={agregarNuevoProducto}
          editarProducto={editarProducto}
          eliminarProducto={eliminarProducto}
          pedidosVendedor={pedidosParaVendedor}
          cargandoPedidos={cargandoPedidos}
          errorPedidos={errorPedidos}
          configurarAceptacionPedido={configurarAceptacionPedido}
          cambiarEstadoPedidoVendedor={cambiarEstadoPedido}
          volverAModoCliente={() => setPantallaActual('home')}
          cerrarSesion={() => {
            localStorage.removeItem('campy_token');
            setTokenAuth(null);
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
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
            setTokenAuth(null);
            setPedidosPorCumplir([]);
            setPedidosParaVendedor([]);
            setCarritoGlobal({});
            setPantallaActual('login');
          }}
        />
      )}
    </>
  );
}

export default App;