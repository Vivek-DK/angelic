import React, {
  useContext
} from "react";

import {
  Navigate
} from "react-router-dom";

import {
  UserContext
} from "../context/UserContext";


const PrivateRoute = ({
  children
}) => {

  const {

    user,

    loading

  } = useContext(
    UserContext
  );


  // =========================================
  // LOADING STATE
  // =========================================

  if (loading) {

    return (

      <div className="page-loader">

        Loading...

      </div>
    );
  }


  // =========================================
  // NOT AUTHENTICATED
  // =========================================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // =========================================
  // AUTHORIZED
  // =========================================

  return children;
};

export default PrivateRoute;