import { AuthCredentials, AuthResponse } from '../types';

export const BASE_URL = 'https://9c6f-46-53-252-46.ngrok-free.app';

const setToken = (token: string) => {
    sessionStorage.setItem('token', token);
};

const removeToken = () => {
    sessionStorage.removeItem('token');
};

const apiRequest = async (
    endpoint: string,
    data?: AuthCredentials,
    options?: RequestInit
): Promise<AuthResponse> => {
    const config: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}/${endpoint}`, config);
    const result: AuthResponse = await response.json();

    if (response.ok) {
        const token = result.token || result.accessToken;
        if (token) {
            setToken(token);
        }
    }

    return result;
};

export const login = (creds: AuthCredentials): Promise<AuthResponse> => {
    return apiRequest('login', creds, { credentials: 'include' });
};

export const register = (creds: AuthCredentials): Promise<AuthResponse> => {
    return apiRequest('register', creds);
};

export const refreshToken = () => {
    return apiRequest(
        'refresh-token',
        undefined,
        { credentials: 'include' }
    );
};

export const logout = async () => {
    await apiRequest('logout',undefined, { credentials: 'include' });
    removeToken();
};