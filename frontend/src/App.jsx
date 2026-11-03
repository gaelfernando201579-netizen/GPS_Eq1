import React, { useState } from 'react';
import CampyLogin from './CampyLogin';
import CampyRegistro from './CampyRegistro';
import HomeComprador from './HomeComprador';
import MisPedidos from './MisPedidos';
import MiPerfil from './MiPerfil';

function App() {
  const [pantallaActual, setPantallaActual] = useState('login');
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  const [carritoGlobal, setCarritoGlobal] = useState({});
  const [pedidoActivo, setPedidoActivo] = useState(null);

  const procesarCompra = (itemsComprados) => {
    setPedidoActivo(itemsComprados);
    setPantallaActual('pedidos');
  };

  return (
    <>
      {pantallaActual === 'login' && (
        <CampyLogin
          alIngresar={(usuario) => {
            setUsuarioActual(usuario);
            setPantallaActual('home');
          }}
          irARegistro={() => setPantallaActual('registro')}
          registroExitoso={registroExitoso}
        />
      )}

      {pantallaActual === 'registro' && (
        <CampyRegistro
          alRegistrar={() => {
            setRegistroExitoso(true);
            setPantallaActual('login');
          }}
          volverAlLogin={() => setPantallaActual('login')}
        />
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
          usuario={usuarioActual}
          irAInicio={() => setPantallaActual('home')}
          irAPedidos={() => setPantallaActual('pedidos')}
          cerrarSesion={() => {
            // Vaciamos el carrito al cerrar sesión
            setCarritoGlobal({});
            setPedidoActivo(null);
            setUsuarioActual(null);
            setPantallaActual('login');
          }}
        />
      )}
    </>
  );
}

export default App;