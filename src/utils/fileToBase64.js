const fileToBase64 = (
  file
) => {

  return new Promise(

    (resolve, reject) => {

      if (!file) {

        reject(

          new Error(
            "File is missing"
          )
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload = () =>

        resolve(
          reader.result
        );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
};

export default fileToBase64;