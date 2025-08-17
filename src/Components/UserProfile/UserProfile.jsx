import React, { useState, useContext, useEffect, useRef } from 'react';
import './UserProfile.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import Swal from "sweetalert2";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);
  const fileInputRef = useRef();
  const profileImageRef = useRef();

  const defaultProfile = {
    name: "",
    email: user?.email || "",
    phone: "",
    Adress: "",
    Categories: "",
    City: "",
    State:""
  };

  const [profile, setProfile] = useState(defaultProfile);
  const [profileImage, setProfileImage] = useState(null);
  const [showRemoveBtn, setShowRemoveBtn] = useState(false);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    const savedImage = localStorage.getItem("profileImage");
    if (savedProfile) setProfile(savedProfile);
    if (savedImage) setProfileImage(savedImage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileImageRef.current &&
        !profileImageRef.current.contains(e.target)
      ) {
        setShowRemoveBtn(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("userProfile", JSON.stringify(profile));
    toast.success("Profile saved locally!");
  };

  const handleLogout = async() => {
      const result = await Swal.fire({
        text: "Are you sure you want to logout?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "logout",
        background: "#fff",
        customClass: {
          popup: "blur-popup"
        }
      });

      if(!result.isConfirmed) return
      logout();
      toast.info("Logged out successfully");
      navigate('/');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem("profileImage", reader.result);
        toast.success("Photo updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage(null);
    localStorage.removeItem("profileImage");
    toast.info("Photo removed.");
    setShowRemoveBtn(false);
  };

  return (
    <div className="profile-container">
      <h2>Profile Information</h2>
      <p className="subtitle">Update your personal information</p>

      <div className="profile-card">
        <div className="profile-left" ref={profileImageRef}>
          {profileImage ? (
            <div className="profile-image-wrapper" onClick={() => setShowRemoveBtn(!showRemoveBtn)}>
              <img src={profileImage} alt="profile" className="profile-photo" />
              {showRemoveBtn && (
                <button className="remove-photo-btn" onClick={handleRemovePhoto}>
                  Remove Photo
                </button>
              )}
            </div>
          ) : (
            <div className="avatar-circle">
              {(user?.name?.charAt(0) || 'U').toUpperCase()}
            </div>
          )}
          <button
            className="change-btn"
            onClick={() => fileInputRef.current.click()}
          >
            Change Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            style={{ display: "none" }}
            accept="image/*"
          />
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-row">
            <div>
              <label>Full Name</label>
              <input type="text" name="name" value={profile.name} onChange={handleChange} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={user.email} disabled />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleChange({ target: { name: 'phone', value } });
                }}
                placeholder="1234567890"
                maxLength="10"
                pattern="\d{10}"
                inputMode="numeric"
              />
            </div>

            <div>
              <label>Address</label>
              <input type="text" name="Adress" value={profile.Adress} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="full">
              <label>City</label>
              <input type="text" name="City" value={profile.City} onChange={handleChange}/>
            </div>
            <div className="full">
              <label>State</label>
              <input type="text" name="State" value={profile.State} onChange={handleChange}/>
            </div>
          </div>

          <div className="form-row">
            <div className="full">
              <label>Preferred clothing categories</label>
              <input type="text" name="Categories" value={profile.Categories} onChange={handleChange} placeholder='e.g., Casual, Formal, Traditional'/>
            </div>
          </div>

          <button type="submit" className="save-btn">Save Changes</button>
        </form>
      </div>

      <div className="logout-section">
        <h4>Danger Zone</h4>
        <p>If you log out, your current session will end. You can always log back in later.</p>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default UserProfile;
