function sendMessage() {
    const input = document.getElementById('userInput');
    const chat = document.getElementById('chat');
    const userText = input.value.trim();
    fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input.value })
      })
      .then(response => response.json())
    if (userText === '') return;

    // 使用者訊息
    const userWrapper = document.createElement('div');
    userWrapper.className = 'message-wrapper';

    const userMsg = document.createElement('div');
    userMsg.className = 'message';
    userMsg.textContent = userText;

    const actions = document.createElement('div');
    actions.className = 'actions';

    // 複製按鈕
    const copyBtn = document.createElement('button');
    const _copy_img = document.createElement('img');
    _copy_img.src = './templates/copy.png';
    _copy_img.alt = '複製';
    _copy_img.style.width = '24px';
    _copy_img.style.height = '24px';
    copyBtn.appendChild(_copy_img);
    copyBtn.onclick = () => copyToClipboard(copyBtn);

    // 文法改進按鈕
    const improve = document.createElement('button');
    const _improve_img = document.createElement('img');
    _improve_img.src = './templates/bulb.png';
    _improve_img.alt = '改進';
    _improve_img.style.width = '24px';
    _improve_img.style.height = '24px';
    improve.appendChild(_improve_img);
    improve.onclick = () => improveMessage(improve);

    actions.appendChild(copyBtn);
    actions.appendChild(improve);

    userWrapper.appendChild(userMsg);
    userWrapper.appendChild(actions);
    chat.appendChild(userWrapper);

    input.value = '';
    chat.scrollTop = chat.scrollHeight;
}

// 複製按鈕觸發
function copyToClipboard(btn) {
    const text = btn.closest('.message-wrapper').querySelector('.message').textContent;
    const img = btn.querySelector('img');
    navigator.clipboard.writeText(text);
    img.src = './templates/tick.png';
    setTimeout(() => img.src = './templates/copy.png', 1000);
}

// 改進按鈕觸發
function improveMessage(btn) {
    const img = btn.querySelector('img');
    img.src = './templates/loading.gif';

    const messageDiv = btn.closest('.message-wrapper').querySelector('.message');
    const messageContent = messageDiv ? messageDiv.textContent : '';

    fetch('/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }) 
        
    })
    .then(response => {
        if (!response.ok) throw new Error('回應失敗');
        return response.json();
    })
    .then(data => {
        img.src = './templates/light bulb.png';
        console.log('伺服器回應：', data);
    })
    .catch(error => {
        console.error('錯誤：', error);
    });
}

// 監聽 Enter 鍵
const messageBox = document.getElementById("userInput");
messageBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});