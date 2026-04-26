import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai  
from google.genai import types

load_dotenv()

app = FastAPI(title="SHCRN AI Service")

# --- Drop the Shields so Next.js can connect ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the NEW client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.get("/")
def read_root():
    return {"status": "AI Service is Online", "engine": "Gemini 2.0 Flash Fallback Architecture"}

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

        try:
            # 1st Attempt: Try the bleeding-edge 2.0 model
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[
                    types.Part.from_bytes(data=content, mime_type=file.content_type),
                    prompt
                ]
            )
        except Exception as api_error:
            if "RESOURCE_EXHAUSTED" in str(api_error) or "429" in str(api_error):
                print("⚠️ 2.0 Rate Limited! Falling back to 1.5-flash-8b...")
                try:
                    # 2nd Attempt: Use the official lightweight fallback model
                    response = client.models.generate_content(
                        model="gemini-1.5-flash-8b", # <--- THE FIXED MODEL NAME
                        contents=[
                            types.Part.from_bytes(data=content, mime_type=file.content_type),
                            prompt
                        ]
                    )
                except Exception as fallback_error:
                    # THE SAFETY NET: If both models are locked, send a System Alert Card to the UI!
                    print(f"⚠️ Backup Model also locked. Alerting UI.")
                    return {
                        "category": "Other",
                        "urgency": 10,
                        "affected_people": 0,
                        "summary": "SYSTEM ALERT: AI capacity reached. Please wait 60 seconds and submit again.",
                        "location_context": "SHCRN Command"
                    }
            else:
                raise api_error
        
        # Clean and return successful AI generation
        clean_json = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        return json.loads(clean_json)

    except Exception as e:
        print(f"🔥 Critical Backend Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)