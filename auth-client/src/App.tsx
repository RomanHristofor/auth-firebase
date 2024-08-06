import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import MainPage from './components/MainPage';
import { logout } from './services/authApi';


const isTokenExpired = (token: string) => {
    try {
        const decoded: { exp: number } = jwtDecode(token);
        return decoded.exp * 1000 < Date.now();

    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
    const token = sessionStorage.getItem('token');
    if (token && isTokenExpired(token)) {
        logout().then(() => {
            window.location.href = '/';
        });
        return null;
    }
    return token ? element : <Navigate to="/" />;
};

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
    const token = sessionStorage.getItem('token');
    return token ? <Navigate to="/main" /> : element;
};

const App: React.FC = () => {
    const token = sessionStorage.getItem('token');

    return (
        <Router>
            <Routes>
                <Route path="/" element={<ProtectedRoute element={<LoginForm />} />} />
                <Route path="/register" element={<ProtectedRoute element={<RegisterForm />} />} />
                <Route path="/main" element={<PrivateRoute element={<MainPage />} />} />
                <Route path="*" element={<Navigate to={token ? "/main" : "/"} />} />
            </Routes>
        </Router>
    );
};

export default App;
