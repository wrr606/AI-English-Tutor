from flask import Flask, session, render_template, request, send_from_directory, jsonify
import os
from datetime import timedelta
from openai import OpenAI
from flask_session import Session
import tempfile
import subprocess
from faster_whisper import WhisperModel

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
Session(app)
# os.environ["PATH"] += os.environ["PATH"] \
#         +  ";" +  r"C:\Users\Function\AppData\Local\Programs\Python\Python312\Lib\site-packages\nvidia\cudnn\bin" \
#         +  ";" +  r"C:\Users\Function\AppData\Local\Programs\Python\Python312\Lib\site-packages\nvidia\cublas\bin"
model = WhisperModel("large-v3", device="cpu", compute_type="int8")
# model = WhisperModel("large-v3", device="cuda", compute_type="float16")
app.permanent_session_lifetime = timedelta(minutes=30)

@app.route('/', methods=['GET'])
def chat():
    user_ip = request.remote_addr
    if 'user' not in session:
        session['user'] = user_ip
        session['message'] = [{"role": "assistant", "content": "Hello, how are you today?"}]
        print(f"新對話，IP：{user_ip}")
    else:
        print(f"回復歷史對話，IP：{session['user']}")
    print(f"session['message']: \t{session['message']}")
    return render_template("chat.html", list = session['message'])

@app.route('/reset-session', methods=['GET'])
def reset_session():
    session.clear()
    return '', 204

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    message = data.get('message', 'No Found')
    session['message'].append({"role": "user", "content": message})
    client = OpenAI(
        api_key=os.environ["GENAI_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/"
    )
    messages=[
        {"role": "system", "content": 
         """你是一名英語老師。接下來，學生會說出他的英文句子，
         請根據他的句子使用英文進行回應，盡量找新的話題讓談話不會被中斷。
         使用生活化的語句，避免過度困難的句子，以免學生感到困難。
         """
         },
    ]
    messages.extend(session['message'])
    response = client.chat.completions.create(
        model="gemini-2.0-flash",
        temperature = 0.7,
        messages=messages,
    )
    response = response.choices[0].message.content
    session['message'].append({"role": "assistant", "content": response})
    return jsonify({"status": "ok", "response": response}), 200

@app.route('/improve', methods=['POST'])
def improve():
    data = request.get_json()
    message = data.get('message', 'No Found message')
    id = data.get('id', 'No Found ID')
    client = OpenAI(
        api_key=os.environ["GENAI_API_KEY"],
        base_url="https://generativelanguage.googleapis.com/v1beta/"
    )
    response = client.chat.completions.create(
        model="gemini-2.0-flash",
        temperature = 0.7,
        messages=[
            {"role": "system", "content": "你是一名英語老師。接下來，學生會說出他的英文句子。請根據他的文法和詞彙選擇給出建議，並用中文回答，如果句子已經足夠完善，就不需要給予建議了。"},
            {
                "role": "user",
                "content": message
            },
        ]
    )
    response = response.choices[0].message.content
    return jsonify({"status": "ok", "response": response}), 200

@app.route("/whisper", methods=["POST"])
def whisper():
    if "audio" not in request.files:
        return jsonify({"error": "沒有提供音訊檔"}), 400
    audio_file = request.files["audio"]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        audio_path = temp_audio.name
        audio_file.save(audio_path)
    try:
        segments, info = model.transcribe(audio_path, beam_size=5, language="en")
        transcript = "".join([segment.text for segment in segments])
        return jsonify({"text": transcript})
    except Exception as e:
        return jsonify({"error": "辨識失敗", "message": str(e)}), 500
    finally:
        os.remove(audio_path)

@app.route('/<path:path>')
def static_proxy(path):
    print("path =", path)
    if os.path.isdir(path):
        path = os.path.join(path, 'index.html')
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=8000)