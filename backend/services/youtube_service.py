import re
import json
import httpx
import html
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
            # Bypass the corrupted Third-Party Library and scrape YouTube natively!
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            response = httpx.get(f"https://www.youtube.com/watch?v={video_id}", headers=headers, follow_redirects=True)
            page_html = response.text
            
            # YouTube stores an array of caption tracks directly in the HTML
            # Extract only the clean JSON array without trying to parse nested parent structures
            tracks_match = re.search(r'"captionTracks":(\[.*?\])', page_html)
            
            if not tracks_match:
                return "Error: No caption tracks found for this video. Make sure subtitles are enabled."
                
            # Properly decode the JSON array (handles all nested characters, `\u0026`, etc. natively)
            tracks_json = tracks_match.group(1)
            tracks = json.loads(tracks_json)
            
            if not tracks:
                return "Error: Empty caption tracks array."
                
            track_url = tracks[0]['baseUrl']
            
            # Fetch the XML formatted captions
            xml_data = httpx.get(track_url, headers=headers).text
            
            # Parse XML to extract pure text
            root = ET.fromstring(xml_data)
            transcript_words = [child.text for child in root if child.text]
            transcript = " ".join(transcript_words)
            
            # Fix escaped HTML entities like &amp;
            transcript = html.unescape(transcript)
            
            return transcript
        except Exception as e:
            import traceback
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
        
        if not result or result.startswith("⚠️"):
            return {"error": "Failed to generate AI notes from transcript. AI API might be unavailable."}
            
        return {
            "video_id": video_id,
            "notes_markdown": result
        }

youtube_service = YouTubeService()
