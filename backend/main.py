import os
import uuid
import base64
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "local_uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

def generate_ai_content(prompt: str, file_paths: list = None) -> str:
    if not GEMINI_API_KEY:
        return f"Mock AI response to: {prompt[:100]}...\n\n(Note: Set GEMINI_API_KEY in backend/.env to get real responses)"
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={GEMINI_API_KEY}"
    
    parts = [{"text": prompt}]
    
    if file_paths:
        for fp in file_paths:
            if os.path.exists(fp):
                with open(fp, "rb") as f:
                    pdf_data = base64.b64encode(f.read()).decode("utf-8")
                parts.append({
                    "inlineData": {
                        "mimeType": "application/pdf",
                        "data": pdf_data
                    }
                })
            else:
                return "Error: Attached file not found on server."
        
    payload = {
        "contents": [{"parts": parts}]
    }
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            return "Error parsing Gemini response."
    else:
        return f"Error from Gemini API: {response.text}"

@app.route("/upload", methods=["POST"])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"detail": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"detail": "No selected file"}), 400
    if file.content_type != "application/pdf":
        return jsonify({"detail": "Only PDF files are supported"}), 400
    
    try:
        filename = f"{uuid.uuid4()}-{file.filename}"
        local_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(local_path)
        return jsonify({"gsUri": local_path, "filename": file.filename, "message": "Upload successful"})
    except Exception as e:
        return jsonify({"detail": str(e)}), 500

@app.route("/summary", methods=["GET"])
def get_summary():
    uri = request.args.get("uri")
    if not uri:
        return jsonify({"detail": "Missing uri parameter"}), 400
        
    prompt = (
        "You are an AI legal assistant providing general legal information, not a lawyer. "
        "Please summarize the attached legal document in plain language. "
        "List key parties, dates, and obligations. "
        "IMPORTANT: This is not legal advice."
    )
    
    response_text = generate_ai_content(prompt, [uri])
    
    if response_text.startswith("Error:"):
        return jsonify({"detail": response_text}), 400
        
    return jsonify({"summary": response_text, "disclaimer": "This is for informational purposes only and is not legal advice."})

@app.route("/qa", methods=["POST"])
def ask_question():
    data = request.json or {}
    question = data.get("question")
    gs_uri = data.get("gs_uri")
    
    if not question:
        return jsonify({"detail": "Question is required"}), 400
    if not gs_uri:
        return jsonify({"detail": "Must provide the document URI"}), 400
        
    prompt = (
        "You are an AI legal assistant. Provide general legal information, not a lawyer's advice. "
        f"Answer the following question based ONLY on the attached document.\n"
        f"Question: {question}"
    )
    
    response_text = generate_ai_content(prompt, [gs_uri])
    
    if response_text.startswith("Error:"):
        return jsonify({"detail": response_text}), 400
        
    return jsonify({"answer": response_text, "disclaimer": "This is not legal advice."})

@app.route("/compare", methods=["POST"])
def compare_documents():
    data = request.json or {}
    gs_uri_1 = data.get("gs_uri_1")
    gs_uri_2 = data.get("gs_uri_2")
    
    if not gs_uri_1 or not gs_uri_2:
        return jsonify({"detail": "Missing URIs"}), 400
        
    prompt = (
        "You are an AI legal assistant. Compare the two attached contracts and highlight differences "
        "in liability clauses, obligations, and key terms. Provide plain language explanations."
    )
    
    response_text = generate_ai_content(prompt, [gs_uri_1, gs_uri_2])
    
    if response_text.startswith("Error:"):
        return jsonify({"detail": response_text}), 400
        
    return jsonify({"comparison": response_text, "disclaimer": "This is not legal advice."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
