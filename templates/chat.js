function sendMessage() {
    const input = document.getElementById('userInput');
    const chat = document.getElementById('chat');
    const userText = input.value.trim();
    if (userText === '') return;

    const userWrapper = document.createElement('div');
    userWrapper.className = 'message-wrapper';
    userWrapper.id = `message-${document.querySelectorAll('.message-wrapper').length}`

    const userMsg = document.createElement('div');
    userMsg.className = 'message';
    userMsg.textContent = userText;

    const actions = document.createElement('div');
    actions.className = 'actions';

    const copyBtn = document.createElement('button');
    const _copy_img = document.createElement('img');
    _copy_img.src = './templates/copy.png';
    _copy_img.alt = '複製';
    _copy_img.style.width = '24px';
    _copy_img.style.height = '24px';
    copyBtn.appendChild(_copy_img);
    copyBtn.onclick = () => copyToClipboard(copyBtn);

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

    const loadingWrapper = document.createElement('div');
    loadingWrapper.className = 'message-wrapper bot-wrapper';
    loadingWrapper.id = `loading-${document.querySelectorAll('.message-wrapper').length}`;

    const loadingImg = document.createElement('img');
    loadingImg.src = './templates/loading.gif';
    loadingImg.alt = '載入中...';
    loadingImg.style.width = '32px';
    loadingImg.style.height = '32px';

    loadingWrapper.appendChild(loadingImg);
    chat.appendChild(loadingWrapper);
    chat.scrollTop = chat.scrollHeight;
    
    fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            chat.removeChild(loadingWrapper);
            const botWrapper = document.createElement('div');
            botWrapper.className = 'message-wrapper bot-wrapper';

            const botMsg = document.createElement('div');
            botMsg.className = 'message';
            botMsg.textContent = data.response;

            botWrapper.appendChild(botMsg);
            chat.appendChild(botWrapper);

            chat.scrollTop = chat.scrollHeight;
        }
    });
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
    const id_number = btn.closest('.message-wrapper').id.match(/message-(\d+)/)[1];
    fetch('/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent, id: parseInt(id_number, 10)}) 
    })
    .then(response => {
        if (!response.ok) throw new Error('回應失敗');
        return response.json();
    })
    .then(data => {
        console.log(data.status)
        if(data.status === 'ok'){
            img.src = './templates/light bulb.png';
            const existingImproved = btn.closest('.message-wrapper').querySelector('.improved-message');
            if (existingImproved) {
                existingImproved.remove();
            }
            const improvedDiv = document.createElement('div');
            improvedDiv.className = 'improved-message';
            console.log(improvedDiv)
            const markdown = data.response || '未收到改進內容';
            console.log(data.response)
            improvedDiv.innerHTML = marked.parse(markdown);
            
            btn.closest('.actions').after(improvedDiv);
        }
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

// 辨識聲音
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        document.getElementById('recordIcon').src = './templates/loading.gif';
        sendAudioToWhisper(audioBlob);
        audioChunks = [];
      };

      mediaRecorder.start();
      isRecording = true;
      document.getElementById('recordIcon').src = './templates/stop.png';
    })
    .catch(error => {
      console.error("無法開始錄音：", error);
    });
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
  isRecording = false;
  document.getElementById('recordIcon').src = './templates/recording.png';
}

function sendAudioToWhisper(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  fetch('/whisper', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.text) {
      document.getElementById('userInput').value = data.text;
      document.getElementById('recordIcon').src = './templates/recording.png';
    } else {
      console.error("語音辨識失敗：", data);
      document.getElementById('recordIcon').src = './templates/recording.png';
    }
  })
  .catch(error => {
    console.error("上傳語音失敗：", error);
  });
}