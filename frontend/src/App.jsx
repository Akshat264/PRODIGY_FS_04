import React, { useState } from 'react';
import "./App.css"
import LoginForm from './Components/LoginForm';
import RegisterForm from './Components/RegisterForm';
import ForgotPasswordForm from './Components/ForgotPassword';
import ResetPasswordForm from './Components/ResetPassword';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './Components/Homepage';
import ProtectedRoute from './Components/ProtectedRoute';
function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={<LoginForm/>} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
                    <Route
                    path="/"
                    element={<ProtectedRoute component={Homepage}/>}
                />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
