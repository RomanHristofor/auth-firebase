const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:3000', 'https://auth-client-five.vercel.app'],
    credentials: true
}));
app.use(express.json());

const users = [
    {
        id: 1,
        email: 'user@example.com',
        password: bcrypt.hashSync('password123', 10),
        createdAt: new Date(),
    }
];

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { email: user.email, uid: user.id },
        process.env.JWT_SECRET, { expiresIn: '2m' }
    );
    const refreshToken = jwt.sign(
        { uid: user.id },
        process.env.JWT_REFRESH_SECRET, { expiresIn: '4m' }
    );

    return { accessToken, refreshToken };
};

app.post('/register', (req, res) => {
    const { email, password } = req.body;

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: Date.now(),
        email,
        password: hashedPassword,
        createdAt: new Date(),
    };
    users.push(newUser);

    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 4 * 60 * 1000,
    });

    res.json({ accessToken });
});

app.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token not provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = jwt.sign({ uid: decoded.uid }, process.env.JWT_SECRET, { expiresIn: '2m' });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    res.json({ message: 'Logged out successfully' });
});

app.listen(PORT, () => {
    console.log(`Mock server running on port ${PORT}`);
});