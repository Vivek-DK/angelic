export const getReportData = (
  location
) => {

  try {

    const stateReport =
      location.state?.report;

    if (stateReport) {

      localStorage.setItem(

        "selectedReport",

        JSON.stringify(
          stateReport
        )
      );

      return stateReport;
    }

    const storedReport =

      localStorage.getItem(
        "selectedReport"
      );

    return storedReport

      ? JSON.parse(
          storedReport
        )

      : null;

  } catch (err) {

    console.error(
      "Failed to load report:",
      err
    );

    return null;
  }
};


export const formatDate = (
  date
) => {

  if (!date)
    return "N/A";

  return new Date(date)
    .toLocaleDateString(
      "en-IN",
      {

        day: "2-digit",

        month: "short",

        year: "numeric"
      }
    );
};


export const getSuitableColors = (
  report
) => {

  return (

    report?.suitableColors ||

    report?.colors ||

    []
  );
};


export const getSuitableColorNames = (
  report
) => {

  return (

    report?.suitableColorsName ||

    report?.colorsName ||

    []
  );
};


export const getAvoidColors = (
  report
) => {

  return (

    report?.avoidColors ||

    []
  );
};


export const getAvoidColorNames = (
  report
) => {

  return (

    report?.avoidColorsName ||

    []
  );
};


export const getShareableReportLink = (
  id
) => {

  return `${window.location.origin}/report/${id}`;
};