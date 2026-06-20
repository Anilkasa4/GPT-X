import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './Routes/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));
app.use(express.json());
app.use('/api/auth', authRoutes);

// 1. Database Connection with Auto-Retry
const connectWithRetry = () => {
    console.log("Attempting to connect to MongoDB...");
    
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log("Success: Connected to MongoDB Database!");
        })
        .catch((err) => {
            console.error("Database is not ready yet. Retrying in 5 seconds...");
            setTimeout(connectWithRetry, 5000); 
        });
};

connectWithRetry();

// 2. Updated Schema (Now includes 'role')
const MessageSchema = new mongoose.Schema({
    role: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// 3. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite",
    systemInstruction: "You are GPT-X, a helpful and concise AI."
});

// 4. GET Route: Fetch history
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// 5. POST Route: The Chat Logic
app.post('/api/messages', async (req, res) => {
    try {
        const userText = req.body.text;

        const userMessage = new Message({ role: 'user', text: userText });
        await userMessage.save();

        const result = await aiModel.generateContent(userText);
        const botText = result.response.text();

        const botMessage = new Message({ role: 'bot', text: botText });
        await botMessage.save();

        res.json({ success: true });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend server is running on http://localhost:${PORT}`));