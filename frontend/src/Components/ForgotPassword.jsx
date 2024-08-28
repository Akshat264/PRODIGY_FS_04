import React, { useState } from 'react';
const uri= import.meta.env.VITE_API_URL;
function ForgotPasswordForm() {
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${uri}/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();
        if (data.message === 'Reset password link sent to your email') {
            alert('Please check your email for the reset link.');
        } else {
            alert('Failed to send reset link. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2 className="login-title">Forgot Password</h2>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <button type="submit" className="login-button">Send Reset Link</button>
            </form>

            <div className="login-links">
                <p>
                    Remember your password? <a href="/login" className="link">Login here</a>
                </p>
            </div>
        </div>
    );
}

export default ForgotPasswordForm;
