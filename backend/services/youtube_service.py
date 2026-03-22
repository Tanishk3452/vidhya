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
            from youtube_transcript_api import YouTubeTranscriptApi

            ytt = YouTubeTranscriptApi()
            
            # Try English first, then Hindi, then just grab whatever is available
            try:
                fetched = ytt.fetch(video_id, languages=['en', 'en-IN', 'en-GB', 'hi', 'hi-IN'])
            except Exception:
                # Last resort — fetch whatever language is available
                transcript_list = ytt.list(video_id)
                first_available = next(iter(transcript_list), None)
                if not first_available:
                    return "Error: No captions found for this video."
                fetched = first_available.fetch()

            transcript_words = [t.text for t in fetched if t.text.strip()]
            transcript = " ".join(transcript_words)
            return html.unescape(transcript)

        except Exception as e:
            return f"Error: Could not retrieve transcript. ({type(e).__name__}: {e})"

    # def get_transcript(self, video_id: str) -> str:
        try:
            from youtube_transcript_api import YouTubeTranscriptApi

            # New API (v1.0+) — use fetch() instead of get_transcript()
            ytt = YouTubeTranscriptApi()
            fetched = ytt.fetch(video_id)
        
            transcript_words = [t.text for t in fetched if t.text.strip()]
            transcript = " ".join(transcript_words)
            return html.unescape(transcript)

        except Exception as e:
            return f"Error: Could not retrieve transcript. The video may not have captions enabled or may be age-restricted. ({type(e).__name__}: {e})"

    # def get_transcript(self, video_id: str) -> str:
    #     try:
    #         import html
    #         import traceback
    #         from youtube_transcript_api import YouTubeTranscriptApi
            
    #         # Fetch the transcript directly using the robust official library, falling back across common languages
    #         transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-IN', 'en-GB', 'hi'])
            
    #         if not transcript_list:
    #             return "Error: YouTube returned an empty transcript payload for this video."
            
    #         # Extract and join just the text segments
    #         transcript_words = [t['text'] for t in transcript_list if t['text'].strip()]
    #         transcript = " ".join(transcript_words)
            
    #         # Flush legacy HTML entities (like &#39; -> ')
    #         return html.unescape(transcript)
            
    #     except Exception as e:
    #         return f"Error: Could not retrieve transcript. The video may not have captions enabled or may be age-restricted. ({type(e).__name__})"

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
            "You are an expert AI Educational Video Analyst.\n"
            "Analyze this YouTube transcript and output a pure JSON object (no markdown formatting outside of the specified field, no code fences, just raw JSON) with the following structure:\n"
            "{\n"
            '  "summary": "A 2-3 paragraph highly insightful overview of the entire video. Focus on the core thesis and main arguments.",\n'
            '  "key_concepts": [{"title": "Concept 1", "explanation": "Brief 1-sentence explanation..."}],\n'
            '  "notes_markdown": "Highly detailed markdown notes with ## Headers, bullet points, and **bold** terms. Make it read like a premium Notion document.",\n'
            '  "flashcards": [{"q": "Question 1?", "a": "Answer 1!"}, {"q": "Question 2?", "a": "Answer 2!"}]\n'
            "}\n"
            "Ensure the flashcards cover the most counter-intuitive or highly testable points from the lecture. Generate at least 6 flashcards.\n\n"
            f"--- VIDEO TRANSCRIPT ---\n{safe_transcript}\n"
        )
        
        # We reuse the main AI service core generation
        raw_result = ai_service._call_gemini(prompt)
        
        if not raw_result:
            return {"error": "Failed to generate AI notes from transcript. AI API might be unavailable."}
            
        try:
            # Clean up potential markdown fences
            raw_result = raw_result.strip()
            if raw_result.startswith("```json"):
                raw_result = raw_result[7:-3].strip()
            elif raw_result.startswith("```"):
                raw_result = raw_result[3:-3].strip()
            result_json = json.loads(raw_result)
        except Exception as e:
            return {"error": f"Failed to parse AI response into structured notes. Response was malformed. {e}"}
            
        return {
            "video_id": video_id,
            **result_json
        }

youtube_service = YouTubeService()
