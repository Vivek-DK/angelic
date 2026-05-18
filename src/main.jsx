  import { createRoot } from 'react-dom/client'
  import './index.css'
  import App from './App.jsx'
  import { 
    UserProvider 
  } from './context/UserContext.jsx'

  import {
    SocketProvider
  } from "./context/SocketContext";

  createRoot(document.getElementById('root')).render(
      <UserProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </UserProvider>,
  )
