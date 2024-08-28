import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
const uri= import.meta.env.VITE_API_URL;
function ResetPasswordForm() {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${uri}/api/reset/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newpass: newPassword }),
        });

        const data = await response.json();
        if (data.message === 'Password updated successfully') {
            alert('Password has been reset successfully. You can now log in.');
        } else {
            alert('Failed to reset password. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2 className="login-title">Reset Password</h2>
                <div className="form-group">
                    <label>New Password:</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <button type="submit" className="login-button">Reset Password</button>
            </form>

            <div className="login-links">
                <p>
                    Back to <Link to="/login" className="link">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPasswordForm;
