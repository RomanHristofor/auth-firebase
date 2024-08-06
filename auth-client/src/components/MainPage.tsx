import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from "../services/authApi";
import { useAuth } from "../hooks/useAuth";
import './MainPage.css';


const TIME = 5 * 60;

const MainPage: React.FC = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(TIME);

    const { handleRefreshToken } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const refreshAccessToken = async () => {
        const response = await handleRefreshToken();
        if (response?.message) {
            handleLogout();
        }
    };

    useEffect(() => {
        const interval = setInterval(refreshAccessToken, (TIME / 2) * 1000);
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
