import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {BASE_URL} from "./LoginForm";
import './MainPage.css';


export const logout = async () => {
    try {
        await fetch(`${BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        sessionStorage.removeItem('token');
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5 * 60);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const refreshAccessToken = async () => {
        try {
            const response = await fetch(`${BASE_URL}/refresh-token`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('token', data.accessToken);
            } else {
                throw new Error('Failed to refresh token');
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            handleLogout();
        }
    };

    useEffect(() => {
        const interval = setInterval(refreshAccessToken, 2.5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSec = seconds % 60;
        return `${minutes}:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
    };

    return (
        <div className="container">
            <h1>You have successfully logged in</h1>
            <p>Countdown: {formatTime(countdown)}</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default MainPage;
