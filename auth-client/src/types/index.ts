export interface AuthCredentials {
    email: string;
    password: string;
}

export interface User {
    id: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user?: User;
    token?: string;
    accessToken?: string;
    message?: string;
}
