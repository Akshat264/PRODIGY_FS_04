import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
const uri= import.meta.env.VITE_API_URL;
const ProtectedRoute = ({ component: Component}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        fetch(`${uri}/api/verify-token`, {
          method: 'GET',
          credentials: 'include', // Make sure to include credentials for cookies
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Token verification failed');
            }
            return response.json(); // Ensure you return response.json() here
          })
          .then((data) => {
            if (data.message === 'Token Verified') {
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
          })
          .catch((error) => {
            console.error('Token verification failed:', error);
            setIsAuthenticated(false);
          });
      }, []);
      

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Show a loading spinner while checking the token
    }

    return isAuthenticated ? <Component isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated}/> : <Navigate to="/login" />;
};

export default ProtectedRoute;
