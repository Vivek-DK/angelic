import { useEffect } from "react";

import { toast } from "react-toastify";

import socket from "../services/socketService";


const useSocketNotifications = () => {

  useEffect(() => {

    const handleNotification = (
      data
    ) => {

      toast.info(

        `${data.title}: ${data.message}`,

        {

          position: "top-right",

          autoClose: 5000
        }
      );
    };

    socket.on(

      "system_notification",

      handleNotification
    );

    return () => {

      socket.off(

        "system_notification",

        handleNotification
      );
    };

  }, []);
};

export default useSocketNotifications;