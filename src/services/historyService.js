import api from "../utils/api";


// ==========================================
// SAVE HISTORY
// ==========================================

export const saveHistory =
  async (
    payload
  ) => {

    const response =
      await api.post(

        "/api/history/add",

        payload
      );

    return response.data;
  };


// ==========================================
// FETCH HISTORY
// ==========================================

export const fetchHistory =
  async (
    search = ""
  ) => {

    const response =
      await api.get(

        `/api/history/all?search=${search}`
      );

    return response.data.data;
  };


// ==========================================
// FETCH SINGLE HISTORY
// ==========================================

export const fetchSingleHistory =
  async (id) => {

    const response =
      await api.get(

        `/api/history/${id}`
      );

    return response.data.data;
  };

  // ==========================================
  // FETCH REPORT
  // ==========================================

 export const fetchReport =
  async (id) => {

    const response =
      await api.get(

        `/api/history/${id}`
      );

    return response.data.data;
  };  


// ==========================================
// DELETE HISTORY
// ==========================================

export const deleteHistory =
  async (id) => {

    const response =
      await api.delete(

        `/api/history/delete/${id}`
      );

    return response.data;
  };

