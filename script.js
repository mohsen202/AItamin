import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@latest/dist/index.min.js";

const chatContainer = document.getElementById('chat-container');
const inputText = document.getElementById('input-text');
const sendButton = document.getElementById('send-button');
const loadingContainer = document.getElementById('loading-container');
const suggestionButtons = document.querySelectorAll('.suggestion-button');

let gradioUrl = 'https://16c48d5ac81c4be8f8.gradio.live'; // آدرس سرور Gradio

// تابع برای خواندن فایل متنی از هاست
async function readTextFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`خطای شبکه: ${response.status}`);
        const text = await response.text();
        return text.trim();
    } catch (error) {
        console.error(`خطا در خواندن فایل ${filePath}:`, error);
        return null;
    }
}

// بارگیری آدرس سرور
async function loadUrl() {
    gradioUrl = await readTextFile('gradio_url.txt');
    if (!gradioUrl) {
        addMessage("خطا در بارگیری آدرس. لطفا دوباره تلاش کنید.", 'bot');
        return false;
    }
    return true;
}

// اتصال به سرور Gradio
async function connectToGradio() {
    try {
        return await Client.connect(gradioUrl);
    } catch (error) {
        console.error("خطا در اتصال به سرور:", error);
        addMessage("خطا در اتصال به سرور هوش مصنوعی. لطفا دوباره تلاش کنید.", 'bot');
        return null;
    }
}

// اضافه کردن پیام به چت
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = text;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ارسال پیام
async function sendMessage(message) {
    const userMessage = message || inputText.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    inputText.value = '';
    loadingContainer.style.display = 'block';

    try {
        const client = await connectToGradio();
        if (!client) return;

        const result = await client.predict("/predict", { input_text: userMessage });
        const botResponse = result.data[0];
        addMessage(botResponse, 'bot');
    } catch (error) {
        console.error("An error occurred:", error);
        addMessage("خطا در ارتباط با سرور. لطفا دوباره تلاش کنید.", 'bot');
    } finally {
        loadingContainer.style.display = 'none';
    }
}

// شروع برنامه
(async function init() {
    const urlLoaded = await loadUrl();
    if (!urlLoaded) return;

    sendButton.addEventListener('click', () => sendMessage());
    inputText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') sendMessage();
    });

    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const question = button.getAttribute('data-question');
            sendMessage(question);
        });
    });
})();
