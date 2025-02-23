import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@latest/dist/index.min.js";

const chatContainer = document.getElementById('chat-container');
const inputText = document.getElementById('input-text');
const sendButton = document.getElementById('send-button');
const loadingContainer = document.getElementById('loading-container');
const suggestionButtons = document.querySelectorAll('.suggestion-button');
const startQuizButton = document.getElementById('start-quiz-button');

let quizQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;

let gradioUrl = ''; // آدرس سرور Gradio
let googleSheetUrl = ''; // آدرس Google Sheets

// تابع برای خواندن فایل متنی از هاست
async function readTextFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`خطای شبکه: ${response.status}`);
        }
        const text = await response.text();
        return text.trim(); // حذف فاصله‌های اضافی
    } catch (error) {
        console.error(`خطا در خواندن فایل ${filePath}:`, error);
        return null;
    }
}

// بارگیری آدرس‌ها از فایل‌های متنی
async function loadUrls() {
    gradioUrl = await readTextFile('gradio_url.txt');
    googleSheetUrl = await readTextFile('google_sheet_url.txt');

    if (!gradioUrl || !googleSheetUrl) {
        console.error("خطا: آدرس‌ها به درستی بارگیری نشدند.");
        addMessage("خطا در بارگیری آدرس‌ها. لطفا دوباره تلاش کنید.", 'bot');
        return false;
    }

    console.log("آدرس Gradio:", gradioUrl);
    console.log("آدرس Google Sheets:", googleSheetUrl);
    return true;
}

// اتصال به سرور Gradio با استفاده از پروکسی CORS
async function connectToGradio() {
    try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // پروکسی CORS
        const gradioUrlWithProxy = proxyUrl + gradioUrl; // اضافه کردن پروکسی به آدرس Gradio
        const client = await Client.connect(gradioUrlWithProxy);
        return client;
    } catch (error) {
        console.error("خطا در اتصال به سرور Gradio:", error);
        addMessage("خطا در اتصال به سرور هوش مصنوعی. لطفا دوباره تلاش کنید.", 'bot');
        return null;
    }
}

// بقیه کدها بدون تغییر...
