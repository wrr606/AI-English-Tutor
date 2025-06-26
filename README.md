# AI-English-Tutor
使用 LLM 與 whisper 的英文對話練習網頁

## 後端部分
Python 的 Flask 作為後端，Session 紀錄當前對話，使用 OpenAI Python SDK 串接 Google Gemini Model API 實現回答功能，部屬本地端的 OpenAI Whisper Model 將使用者聲音轉文字。

### 具備功能：
- 短暫紀錄當前使用者對話歷史
- 對方文字生成語音
- 可開關的對方文字翻譯功能
- 隱藏對方文字
- 複製文字功能
- 語法糾正功能

## 前端部分
使用 HTML、CSS、JavaScript 製作

### 展示：
![image](https://github.com/wrr606/AI-English-Tutor/blob/main/exhibit_image/front.png)

![image](https://github.com/wrr606/AI-English-Tutor/blob/main/exhibit_image/hidden.png)
