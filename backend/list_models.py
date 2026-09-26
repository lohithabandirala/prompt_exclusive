import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.environ.get("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
res = requests.get(url)
print(res.json())
