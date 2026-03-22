import os
from dotenv import load_dotenv

# Try importing the new SDK first, fallback to the old one to test
try:
    from google import genai
    sdk = "google-genai"
except ImportError:
    try:
        import google.generativeai as genai
        sdk = "google-generativeai"
    except ImportError:
        print("No SDK installed")
        exit(1)

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print("="*50)
print(f"Diagnostics: Testing Gemini API Key")
print(f"SDK Version: {sdk}")
print("="*50)

if not api_key:
    print("❌ No API key found in .env")
    exit(1)

print(f"✅ Key found: {api_key[:8]}...{api_key[-4:]}")

try:
    if sdk == "google-genai":
        client = genai.Client(api_key=api_key)
        print("\n🔍 Querying available models for this key...")
        models = client.models.list()
        
        valid_models = []
        for m in models:
            if "generateContent" in m.supported_actions: # type: ignore
                valid_models.append(m.name)
        
        print(f"Found {len(valid_models)} models supporting generation.")
        for name in valid_models[:10]:
            print(f" - {name}")
            
        if not valid_models:
            print("❌ Your key has 0 models enabled for generation.")
            
    else:
        genai.configure(api_key=api_key)
        print("\n🔍 Querying available models for this key...")
        models = genai.list_models()
        valid_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        print(f"Found {len(valid_models)} models supporting generation.")
        for name in valid_models[:10]:
            print(f" - {name}")
            
except Exception as e:
    print(f"\n❌ Error listing models: {e}")

print("="*50)
