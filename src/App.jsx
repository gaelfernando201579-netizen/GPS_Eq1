import React, { useState } from 'react';
import CampyLogin from './CampyLogin';
import HomeComprador from './HomeComprador';
import MisPedidos from './MisPedidos';
import MiPerfil from './MiPerfil';

function App() {
  const [pantallaActual, setPantallaActual] = useState('login');
  
  const [carritoGlobal, setCarritoGlobal] = useState({});
  const [pedidoActivo, setPedidoActivo] = useState(null);

  const procesarCompra = (itemsComprados) => {
    setPedidoActivo(itemsComprados);
    setPantallaActual('pedidos');
  };

  return (
    <>
      {pantallaActual === 'login' && (
        <CampyLogin alIngresar={() => setPantallaActual('home')} />
      )}
      
      {pantallaActual === 'home' && (
        <HomeComprador 
          carrito={carritoGlobal} 
          setCarrito={setCarritoGlobal}
          irAPedidos={procesarCompra} 
          irAPerfil={() => setPantallaActual('perfil')} 
        />
      )}

      {pantallaActual === 'pedidos' && (
        <MisPedidos 
          pedido={pedidoActivo} 
          irAInicio={() => setPantallaActual('home')} 
          irAPerfil={() => setPantallaActual('perfil')} 
        />
      )}

      {pantallaActual === 'perfil' && (
        <MiPerfil 
          irAInicio={() => setPantallaActual('home')}
          irAPedidos={() => setPantallaActual('pedidos')}
          cerrarSesion={() => {
            // Vaciamos el carrito al cerrar sesión
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