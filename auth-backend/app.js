const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

const serviceAccount = require('./firebaseServiceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://auth-react-fire.firebaseio.com"
});

const db = admin.firestore();

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { email: user.email, uid: user.uid },
        process.env.JWT_SECRET, { expiresIn: '2m' }
    );
    const refreshToken = jwt.sign(
        { uid: user.uid },
        process.env.JWT_REFRESH_SECRET, { expiresIn: '4m' }
    );

    return { accessToken, refreshToken };
};

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const userRecord = await admin.auth().createUser({ email, password });
        await db.collection('users').doc(userRecord.uid).set({
            email,
            password: hashedPassword,
            createdAt: new Date(),
            uid: userRecord.uid
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error creating new user:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userSnapshot = await db.collection('users')
            .where('email', '==', email).get();

        if (userSnapshot.empty) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens({ email: userData.email, uid: userDoc.id });

        // Save Refresh token in HttpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 4 * 60 * 1000,
        });

        res.json({ accessToken });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
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
    console.log(`Server running on port ${PORT}`);
});
