export const shareReport =
  async (reportId) => {

    const url =

      `${window.location.origin}/report/${reportId}`;

    try {

      if (
        navigator.share
      ) {

        await navigator.share({

          title:
            "ANGELIC AI Report",

          text:
            "Check out my AI fashion analysis report.",

          url
        });

      } else {

        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Report link copied!"
        );
      }

    } catch (err) {

      console.error(err);
    }
  };