import React from 'react';
import { useLocation } from 'react-router-dom';
import { useState,useEffect } from 'react';
import Header from './Header';
import EditProfile from './EditProfile';
import ChatWindow from './ChatArea';
const uri= import.meta.env.VITE_API_URL;
function HomePage({isAuthenticated,setIsAuthenticated}) {
    const [seconds, setSeconds] = useState(1000);
    const [user,setUser]= useState(null);
    const [tokens,setTokens] = useState(null);
    const [isEditing,setIsEditing] = useState(false);
    useEffect(() => {
      // Get the stored expiry time from localStorage
      const storedExpiryTime = localStorage.getItem('tokenExpiryTime');
      
      if (storedExpiryTime) {
        const now = Date.now();
        const remainingTime = Math.floor((storedExpiryTime - now) / 1000);
  
        if (remainingTime > 0) {
          setSeconds(remainingTime);
        } else {
          // Token has expired, handle it (e.g., redirect to login)
          handleTokenExpiration();
          return;
        }
      } else {
        const expiryTime = Date.now() + 3600*24*1000; // 60 seconds from now
        localStorage.setItem('tokenExpiryTime', expiryTime);
        setSeconds(3600*24);
      }
  
      const countdown = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds > 1) {
            return prevSeconds - 1;
          } else {
            clearInterval(countdown);
            // Handle token expiration when the countdown reaches 0
            handleTokenExpiration();
            return 0;
          }
        });
      }, 1000);
  
      return () => clearInterval(countdown);
    }, []);
  
    const handleTokenExpiration = () => {
      // Redirect to login or refresh token
      localStorage.removeItem('tokenExpiryTime');
      window.location.href = '/login';
    };
const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      setTokens(token);
      if (!token) return;
      try {
        const response = await fetch(`${uri}/api/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
    
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setUser(data); // Store the user data in state
    } catch (error) {
        console.error('Error fetching user profile:', error);
        // Handle error (e.g., log out the user)
    }
  };
useEffect(() => {
    fetchUserProfile();
}, []);
const toggleEditProfile = () => {
  setIsEditing(!isEditing);
};
const handleLogout = () => {
  // Remove token and other user-related data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiryTime');
  setIsAuthenticated(false);
  navigate('/login');
};
    return (
        <div>
           {user && <Header user={user} toggleEditProfile={toggleEditProfile} isEditing={isEditing} onlogout={handleLogout}/>}
          { isEditing &&<EditProfile token={tokens} user={user} updateUser={setUser} toggleEditProfile={toggleEditProfile}/>}
          {user && <ChatWindow user={user}/>}
        </div>
    );
}

export default HomePage;
