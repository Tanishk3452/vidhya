import re
import json
import httpx
import html
import traceback
import xml.etree.ElementTree as ET
from typing import Optional
from services.ai_service import ai_service

class YouTubeService:
    def extract_video_id(self, url: str) -> Optional[str]:
        # Robust regex to extract YouTube ID from standard, shortened, or embed URLs
        match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
        return match.group(1) if match else None

    def get_transcript(self, video_id: str) -> str:
        try:
            import traceback, json, re, html
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            response = httpx.get(f"https://www.youtube.com/watch?v={video_id}", headers=headers, follow_redirects=True)
            page_html = response.text
            
            # Dangerously beautiful extraction: Directly scan the HTML for the backend API endpoints
            # This completely bypasses the fragile ytInitialPlayerResponse JSON decoding DOM!
            # We use `[\\/]+` because YouTube often escapes forward slashes in JSON as `\/`
            urls = re.findall(r'"baseUrl"\s*:\s*"([^"]+api[\\/]+timedtext[^"]+)"', page_html)
            
            if not urls:
                return "Error: No caption tracks found for this video. The video might not have English subtitles enabled."
                
            # Safely decode the unicode escaped \u0026 parameters back into valid URL ampersands &
            track_urls = [json.loads(f'"{u}"') for u in urls]
            
            # Prefer explicitly generated English tracks (lang=en), otherwise take the first available
            en_urls = [u for u in track_urls if 'lang=en' in u]
            track_url = en_urls[0] if en_urls else track_urls[0]
            
            # Fetch the parsed XML transcript payload
            xml_data = httpx.get(track_url, headers=headers).text
            
            if not xml_data.strip():
                return "Error: YouTube returned an empty transcript payload for this video."
            
            # Traverse XML nodes safely and pull text blocks
            root = ET.fromstring(xml_data)
            transcript_words = []
            for child in root.iter():
                if child.text and child.text.strip():
                    transcript_words.append(child.text.strip())
            transcript = " ".join(transcript_words)
            
            # Flush legacy HTML entities (like &#39; -> ')
            return html.unescape(transcript)
            
        except xml.etree.ElementTree.ParseError:
            return "Error: Failed to parse the XML transcript file. YouTube might have changed their format."
        except Exception as e:
            return f"Error manually scraping transcript: {e}\nTraceback: {traceback.format_exc()}"

    def process_video(self, url: str) -> dict:
        video_id = self.extract_video_id(url)
        if not video_id:
            return {"error": "Invalid YouTube URL"}
            
        transcript = self.get_transcript(video_id)
        if transcript.startswith("Error"):
            return {"error": transcript}
            
        # Truncate extremely long videos to prevent token limit errors
        safe_transcript = transcript[:25000] 
            
        prompt = (
            "You are an expert AI Study Assistant. I am providing you with the transcript of an educational video (usually a lecture or tutorial).\n"
            "Please analyze it and generate the following structured output:\n\n"
            "### 1. Concise Summary\n"
            "(A fast 2-3 paragraph overview of the exact concepts taught in the video)\n\n"
            "### 2. Structured Notes\n"
            "(Highly detailed notes using markdown, headers, bullet points, and **bolding** key terms. Include formulas or key definitions mentioned.)\n\n"
            "### 3. Flashcards for Revision\n"
            "(Create 5 Question and Answer pairs based on the most important concepts to help the student test their memory.)\n\n"
            f"--- VIDEO TRANSCRIPT ---\n{safe_transcript}\n--- END TRANSCRIPT ---\n"
        )
        
        # We reuse the main AI service core generation
        result = ai_service._call_gemini(prompt)
        
        if not result:
            return {"error": "Failed to generate AI notes from transcript. AI API might be unavailable."}
            
        return {
            "video_id": video_id,
            "notes_markdown": result
        }

youtube_service = YouTubeService()
