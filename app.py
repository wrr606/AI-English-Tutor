from flask import Flask, session, render_template, request, send_from_directory, jsonify
import os
from datetime import timedelta

app = Flask(__name__)

app.secret_key = 'secret_key'
app.permanent_session_lifetime = timedelta(minutes=30)

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/', methods=['GET'])
def chat():
    user_ip = request.remote_addr
    if 'user' not in session:
        session['user'] = user_ip
        session['message'] = [{"role": "assistant", "content": "Hello, how are you today?"}]
        print(f"新對話，IP：{user_ip}")
    else:
        print(f"回復歷史對話，IP：{session['user']}")
    print(f"session['message']: {session['message']}")
    return render_template("chat.html", list=session['message'])

@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json()
    message = data.get('message', 'No Found')
    session['message'].append({"role": "user", "content": message})
    return jsonify({'status': 'ok'})

@app.route('/improve', methods=['POST'])
def improve():
    data = request.get_json()
    message = data.get('message', 'No Found')
    
    return jsonify({"status": "任務完成"}), 200

@app.route('/<path:path>')
def static_proxy(path):
    print("path =", path)
    if os.path.isdir(path):
        path = os.path.join(path, 'index.html')
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=8000)