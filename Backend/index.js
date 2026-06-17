require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Database!"))
    .catch(err => console.error("MongoDB error:", err));

// 2. Updated Schema (Now includes 'role')
const MessageSchema = new mongoose.Schema({
    role: String, // Will be either 'user' or 'bot'
    text: String,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

// 3. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash",
    systemInstruction: "You are GPT-X, a helpful and concise AI."
});

// 4. GET Route: Fetch history
app.get('/api/messages', async (req, res) => {
    try {
        // Find messages and sort oldest to newest (1) so chat reads top-to-bottom
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

        // A. Save the User's message to MongoDB
        const userMessage = new Message({ role: 'user', text: userText });
        await userMessage.save();

        // B. Send the text to Gemini and wait for the response
        const result = await aiModel.generateContent(userText);
        const botText = result.response.text();

        // C. Save Gemini's response to MongoDB
        const botMessage = new Message({ role: 'bot', text: botText });
        await botMessage.save();

        // D. Tell React everything was successful
        res.json({ success: true });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Failed to generate response" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend server is running on http://localhost:${PORT}`));