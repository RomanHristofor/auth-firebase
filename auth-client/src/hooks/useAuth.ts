import { login, refreshToken, register } from '../services/authApi';
import { AuthCredentials } from '../types';

export const useAuth = () => {
    const handleLogin = async (creds: AuthCredentials) => {
        return await login(creds);
    };

    const handleRegister = async (creds: AuthCredentials) => {
        return await register(creds);
    };

    const handleRefreshToken = async () => {
        return await refreshToken();
    };

    return {
        handleLogin,
        handleRegister,
        handleRefreshToken
    };
};