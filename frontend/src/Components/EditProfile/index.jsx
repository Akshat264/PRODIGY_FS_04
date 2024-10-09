// client/src/components/EditProfile.js
import React, { useState } from 'react';
import './index.css';
const uri= import.meta.env.VITE_API_URL;
const EditProfile = ({ token, user, updateUser,toggledEditProfile }) => {
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [profileImage, setProfileImage] = useState(null);

    const handleImageChange = (e) => {
        setProfileImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        if (profileImage) {
            formData.append('profileImage', profileImage);
        }

        try {
            const response = await fetch(`${uri}/api/edit-profile`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData, // Send formData directly
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            const data = await response.json();
            updateUser(data.user); // Update the user data in the parent component
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update profile');
        }
    };

    return (
        <form className="edit-profile-form" onSubmit={handleSubmit}>
            <div>
                <label>Username</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label>Profile Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
            </div>
            <button type="submit">Save Changes</button>
        </form>
    );
};

export default EditProfile;
