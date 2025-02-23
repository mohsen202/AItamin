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

// اتصال به سرور Gradio
async function connectToGradio() {
    try {
        const client = await Client.connect(gradioUrl);
        return client;
    } catch (error) {
        console.error("خطا در اتصال به سرور Gradio:", error);
        addMessage("خطا در اتصال به سرور هوش مصنوعی. لطفا دوباره تلاش کنید.", 'bot');
        return null;
    }
}

// بارگیری سوالات از Google Sheets
async function loadQuestions() {
    try {
        console.log("در حال بارگیری سوالات از:", googleSheetUrl);

        const response = await fetch(googleSheetUrl);
        if (!response.ok) {
            throw new Error(`خطای شبکه: ${response.status}`);
        }
        const text = await response.text();
        console.log("پاسخ دریافت شد:", text);

        // پردازش پاسخ JSON
        const json = JSON.parse(text.substring(47, text.length - 2));
        console.log("داده‌های JSON:", json);

        quizQuestions = json.table.rows.map(row => {
            const question = row.c[0].v; // ستون اول: سوال
            const options = row.c.slice(1, 5).map(cell => cell.v); // ستون‌های ۲ تا ۵: گزینه‌ها
            const correctAnswer = row.c[5].v; // ستون ششم: پاسخ صحیح
            return { question, options, correctAnswer };
        });

        console.log("سوالات بارگیری شدند:", quizQuestions);
    } catch (error) {
        console.error("خطا در بارگیری سوالات:", error);
        addMessage("خطا در بارگیری سوالات. لطفا دوباره تلاش کنید.", 'bot');
    }
}

function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = text;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage(message) {
    const userMessage = message || inputText.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    inputText.value = '';

    loadingContainer.style.display = 'block';

    try {
        const client = await connectToGradio();
        if (!client) return;

        const result = await client.predict("/predict", { 
            input_text: userMessage, 
        });

        const botResponse = result.data[0]; // پاسخ هوش مصنوعی
        addMessage(botResponse, 'bot');
    } catch (error) {
        console.error("An error occurred:", error);
        addMessage("خطا در ارتباط با سرور هوش مصنوعی. لطفا دوباره تلاش کنید.", 'bot');
    } finally {
        loadingContainer.style.display = 'none';
    }
}

function showQuestion(questionData) {
    addMessage(questionData.question, 'bot');
    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('options');
    questionData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.addEventListener('click', () => handleAnswer(index, questionData));
        optionsDiv.appendChild(button);
    });
    chatContainer.appendChild(optionsDiv);
}

function handleAnswer(userAnswer, questionData) {
    if (userAnswer === questionData.correctAnswer) {
        userScore += 1;
        addMessage("✅صحیح!", 'bot');
    } else {
        addMessage(`❌نادرست!  صحیح: ${questionData.options[questionData.correctAnswer]}`, 'bot');
    }
    currentQuestionIndex += 1;
    if (currentQuestionIndex < quizQuestions.length) {
        showQuestion(quizQuestions[currentQuestionIndex]);
    } else {
        addMessage(`آزمون پایان یافت! امتیاز شما: ${userScore}/${quizQuestions.length}`, 'bot');
    }
}

function startQuiz() {
    console.log("دکمه شروع آزمون کلیک شد!");
    if (quizQuestions.length === 0) {
        addMessage("خطا: سوالات بارگیری نشده‌اند. لطفا صفحه را رفرش کنید.", 'bot');
        return;
    }
    currentQuestionIndex = 0;
    userScore = 0;
    chatContainer.innerHTML = ''; // پاک کردن چت قبلی
    showQuestion(quizQuestions[currentQuestionIndex]);
}

// شروع برنامه
(async function init() {
    const urlsLoaded = await loadUrls();
    if (!urlsLoaded) return;

    await loadQuestions();

    sendButton.addEventListener('click', () => sendMessage());
    inputText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const question = button.getAttribute('data-question');
            sendMessage(question);
        });
    });

    startQuizButton.addEventListener('click', startQuiz);
})();
