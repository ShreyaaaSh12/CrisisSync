import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai  # <--- New Import
from google.genai import types

load_dotenv()

app = FastAPI(title="SHCRN AI Service")

# Initialize the NEW client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.get("/")
def read_root():
    return {"status": "AI Service is Online", "engine": "Gemini 1.5 Flash (Modern SDK)"}

@app.post("/extract-incident")
async def extract_incident(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        prompt = """
        Analyze this disaster report. 
        Extract the following into a valid JSON object:
        - category: (Flood, Fire, Medical, Earthquake, or Other)
        - urgency: (1-10)
        - affected_people: (Number)
        - summary: (One sentence)
        - location_context: (Mentioned landmarks)
        
        Return ONLY JSON.
        """

        # The new SDK uses client.models.generate_content
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[
                types.Part.from_bytes(data=content, mime_type=file.content_type),
                prompt
            ]
        )
        
        # Helper to clean up Markdown code blocks if Gemini adds them
        clean_json = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        return json.loads(clean_json)

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal AI Processing Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)