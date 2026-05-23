import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '15px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <h1 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '2.5rem' }}>Thank You!</h1>
                <p style={{ color: '#7f8c8d', fontSize: '1.2rem', marginBottom: '2rem' }}>
                    We hope to see you again soon.
                </p>
                <div style={{ color: '#95a5a6', fontSize: '0.9rem' }}>
                    Redirecting to homepage in 5 seconds...
                </div>
            </div>
        </div>
    );
};

export default ThankYou;
