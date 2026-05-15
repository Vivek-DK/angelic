import React, {

  useContext,

  useEffect,

  useRef,

  useState

} from "react";

import "./UserProfile.css";

import {

  toast

} from "react-toastify";

import {

  useNavigate

} from "react-router-dom";

import Swal from "sweetalert2";

import {

  UserContext

} from "../../context/UserContext";


const UserProfile = () => {

  const navigate =
    useNavigate();

  const {

    user,

    logout

  } = useContext(
    UserContext
  );

  const fileInputRef =
    useRef();

  const imageWrapperRef =
    useRef();


  // ==========================================
  // DEFAULT PROFILE
  // ==========================================

  const defaultProfile = {

    name:
      user?.name || "",

    email:
      user?.email || "",

    phone: "",

    address: "",

    city: "",

    state: "",

    categories: ""
  };


  const [profile, setProfile] =
    useState(defaultProfile);

  const [profileImage,
    setProfileImage] =
      useState(null);

  const [showRemove,
    setShowRemove] =
      useState(false);

  const [saving,
    setSaving] =
      useState(false);


  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {

    const savedProfile =
      JSON.parse(

        localStorage.getItem(
          "userProfile"
        )
      );

    const savedImage =
      localStorage.getItem(
        "profileImage"
      );

    if (savedProfile) {

      setProfile(savedProfile);
    }

    if (savedImage) {

      setProfileImage(
        savedImage
      );
    }

  }, []);


  // ==========================================
  // OUTSIDE CLICK
  // ==========================================

  useEffect(() => {

    const handleOutsideClick =
      (e) => {

        if (

          imageWrapperRef.current &&

          !imageWrapperRef.current.contains(
            e.target
          )

        ) {

          setShowRemove(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };

  }, []);


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange =
    (e) => {

      setProfile({

        ...profile,

        [e.target.name]:
          e.target.value
      });
    };


  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave =
    async (e) => {

      e.preventDefault();

      if (

        profile.phone &&

        profile.phone.length !== 10

      ) {

        return toast.error(
          "Phone number must be 10 digits."
        );
      }

      try {

        setSaving(true);

        localStorage.setItem(

          "userProfile",

          JSON.stringify(profile)
        );

        toast.success(
          "Profile updated successfully!"
        );

      } catch (err) {

        console.error(err);

        toast.error(
          "Failed to save profile."
        );

      } finally {

        setSaving(false);
      }
    };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout =
    async () => {

      const result =
        await Swal.fire({

          title: "Logout?",

          text:
            "Your current session will end.",

          icon: "warning",

          showCancelButton: true,

          confirmButtonText:
            "Logout",

          confirmButtonColor:
            "#d33"
        });

      if (!result.isConfirmed)
        return;

      logout();

      toast.info(
        "Logged out successfully."
      );

      navigate("/login");
    };


  // ==========================================
  // PHOTO CHANGE
  // ==========================================

  const handlePhotoChange =
    (e) => {

      const file =
        e.target.files[0];

      if (!file) return;

      if (

        !file.type.startsWith(
          "image/"
        )

      ) {

        return toast.error(
          "Please upload image only."
        );
      }

      const reader =
        new FileReader();

      reader.onloadend = () => {

        setProfileImage(
          reader.result
        );

        localStorage.setItem(

          "profileImage",

          reader.result
        );

        toast.success(
          "Profile photo updated."
        );
      };

      reader.readAsDataURL(file);
    };


  // ==========================================
  // REMOVE PHOTO
  // ==========================================

  const handleRemovePhoto =
    () => {

      setProfileImage(null);

      localStorage.removeItem(
        "profileImage"
      );

      setShowRemove(false);

      toast.info(
        "Profile photo removed."
      );
    };


  return (

    <div className="profile-container">

      <h2>
        Profile Information
      </h2>

      <p className="subtitle">

        Manage your personal information

      </p>


      <div className="profile-card">


        {/* LEFT */}

        <div
          className="profile-left"
          ref={imageWrapperRef}
        >

          {profileImage ? (

            <div

              className=
                "profile-image-wrapper"

              onClick={() =>

                setShowRemove(
                  !showRemove
                )
              }
            >

              <img

                src={profileImage}

                alt="profile"

                className=
                  "profile-photo"
              />

              {showRemove && (

                <button

                  className=
                    "remove-photo-btn"

                  onClick={
                    handleRemovePhoto
                  }
                >

                  Remove Photo

                </button>
              )}

            </div>

          ) : (

            <div className=
              "avatar-circle"
            >

              {(

                user?.name?.charAt(0) ||

                "U"

              ).toUpperCase()}

            </div>
          )}


          <button

            className="change-btn"

            onClick={() =>

              fileInputRef.current.click()
            }
          >

            Change Photo

          </button>


          <input

            type="file"

            hidden

            ref={fileInputRef}

            accept="image/*"

            onChange={
              handlePhotoChange
            }
          />

        </div>


        {/* RIGHT */}

        <form

          className="profile-form"

          onSubmit={handleSave}
        >

          <div className="form-row">

            <div>

              <label>
                Full Name
              </label>

              <input

                type="text"

                name="name"

                value={profile.name}

                onChange={
                  handleChange
                }
              />

            </div>


            <div>

              <label>
                Email
              </label>

              <input

                type="email"

                value={user.email}

                disabled
              />

            </div>

          </div>


          <div className="form-row">

            <div>

              <label>
                Phone
              </label>

              <input

                type="tel"

                name="phone"

                value={profile.phone}

                onChange={(e) => {

                  const value =
                    e.target.value

                    .replace(/\D/g, "")

                    .slice(0, 10);

                  handleChange({

                    target: {

                      name: "phone",

                      value
                    }
                  });
                }}

                placeholder="1234567890"
              />

            </div>


            <div>

              <label>
                Address
              </label>

              <input

                type="text"

                name="address"

                value={
                  profile.address
                }

                onChange={
                  handleChange
                }
              />

            </div>

          </div>


          <div className="form-row">

            <div>

              <label>
                City
              </label>

              <input

                type="text"

                name="city"

                value={profile.city}

                onChange={
                  handleChange
                }
              />

            </div>


            <div>

              <label>
                State
              </label>

              <input

                type="text"

                name="state"

                value={profile.state}

                onChange={
                  handleChange
                }
              />

            </div>

          </div>


          <div className="form-row">

            <div className="full">

              <label>
                Preferred Categories
              </label>

              <input

                type="text"

                name="categories"

                value={
                  profile.categories
                }

                onChange={
                  handleChange
                }

                placeholder=
                  "Casual, Formal..."
              />

            </div>

          </div>


          <button

            type="submit"

            className="save-btn"

            disabled={saving}
          >

            {saving

              ? "Saving..."

              : "Save Changes"}

          </button>

        </form>

      </div>


      {/* DANGER ZONE */}

      <div className="logout-section">

        <h4>
          Danger Zone
        </h4>

        <p>

          Logging out will end your
          current session.

        </p>

        <button

          className="logout-btn"

          onClick={handleLogout}
        >

          Logout

        </button>

      </div>

    </div>
  );
};

export default UserProfile;