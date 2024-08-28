// client/src/components/Header.js
import React, { useState } from 'react';
import './index.css';
import logo from "./assets/logo.png";
import avatar from "./assets/default-avatar.png";
const uri= import.meta.env.VITE_API_URL;
const Header = ({user,toggleEditProfile,isEditing, onlogout}) => {
    const [showProfile, setShowProfile] = useState(false);
    const toggleProfile = () => {
        setShowProfile(!showProfile);
    };
    return (
        <header className="header-container">
            <div className="header-logo">
                <img src={logo} alt="Logo" width="50vw"/>
            </div>
            <div className="header-user">
            <button className={`edit-profile ${isEditing ? "editing edit-profile" : ""}`} onClick={toggleEditProfile}>Edit Profile</button>
                <img
                    src={user.profileImage ? `${uri}${user.profileImage}` : avatar}
                    alt="User Avatar"
                    className="user-avatar"
                    onClick={toggleProfile}
                />
                {showProfile && (
                    <div className="profile-dropdown">
                        <h3>{user.username}</h3>
                        <p>Email: {user.email}</p>
                        <button onClick={onlogout}>Log Out</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
