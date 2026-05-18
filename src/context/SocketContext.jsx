import {

  createContext,

  useContext,

  useEffect,

  useState

} from "react";

import { io } from "socket.io-client";


const SocketContext =
  createContext();


export const useSocket = () =>
  useContext(SocketContext);


export const SocketProvider =
  ({ children }) => {

    const [socket, setSocket] =
      useState(null);


    useEffect(() => {

      const newSocket = io(

        import.meta.env
          .VITE_NODE_API_URL ||

        "http://localhost:5000"
      );

      setSocket(newSocket);

      return () => {

        newSocket.disconnect();
      };

    }, []);


    return (

      <SocketContext.Provider
        value={socket}
      >

        {children}

      </SocketContext.Provider>
    );
};