import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@latest/dist/index.min.js";
}


async function sendMessage(message){
const userMessage = (message ?? inputText.value).trim();
if(!userMessage) return;


addMessage(userMessage, "user");
inputText.value = "";
autoResize();
setLoading(true);


try{
const client = await connect();
if(!client){ return; }


// سازگار با فضای کاری پیش‌فرض Gradio
const result = await client.predict("/predict", { input_text: userMessage });
const botResponse = Array.isArray(result?.data) ? result.data[0] : (result?.data ?? "پاسخی دریافت نشد.");
addMessage(String(botResponse), "bot");
}catch(err){
console.error("خطا:", err);
addMessage("مشکلی پیش آمد. لطفاً دوباره تلاش کنید.", "bot");
}finally{
setLoading(false);
}
}


function autoResize(){
inputText.style.height = "auto";
inputText.style.height = Math.min(inputText.scrollHeight, 180) + "px";
}


// رویدادها
sendButton.addEventListener("click", ()=> sendMessage());
inputText.addEventListener("keydown", (e)=>{
if(e.key === "Enter" && !e.shiftKey){
e.preventDefault();
sendMessage();
}
});
inputText.addEventListener("input", autoResize);


suggestionButtons.forEach(btn=> btn.addEventListener("click", ()=>{
const q = btn.getAttribute("data-question");
sendMessage(q);
}));


clearBtn?.addEventListener("click", ()=>{
chatContainer.innerHTML = "";
addMessage("گفتگوی جدید شروع شد. پرسش خود را بپرسید.", "bot");
});


// شروع
addMessage("سلام! من دستیار هوشمند تأمین هستم. چگونه کمکتان کنم؟", "bot");
