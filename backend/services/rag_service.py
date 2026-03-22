"""
NeuroLearn AI — RAG Service (Retrieval-Augmented Generation)
Uses Google GenAI embeddings & numpy cosine similarity for purely local, zero-dependency RAG.
Embeddings are cached to avoid API rate limits on startups.
"""
import os
import json
import time
from typing import List

try:
    import numpy as np
    _has_numpy = True
except ImportError:
    _has_numpy = False
    print("  ⚠️  numpy not installed. RAG search will be disabled. Run: pip install numpy")

try:
    from google import genai
    _has_gemini = True
except ImportError:
    _has_gemini = False


DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
EMBEDDINGS_CACHE = os.path.join(DATA_DIR, "embeddings_cache.json")


class RAGService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.client = None
        self.chunks = []
        self.embeddings = []
        
        if self.api_key and _has_gemini and _has_numpy:
            self.client = genai.Client(api_key=self.api_key)
            self.embed_model = 'text-embedding-004'
            try:
                # Find the first valid embedding model allowed by this API key
                models = self.client.models.list()
                embed_models = [m.name for m in models if getattr(m, 'supported_actions', None) and "embedContent" in m.supported_actions]
                if embed_models:
                    self.embed_model = embed_models[0]
            except Exception:
                pass
                
            # Pre-load knowledge base in the background
            self._init_knowledge_base()

    def _chunk_text(self, text: str) -> List[str]:
        """Simple chunking by sections/paragraphs."""
        # Split by markdown headers or double newlines
        paragraphs = text.split("\n\n")
        chunks = []
        current = ""
        for p in paragraphs:
            if len(current) + len(p) < 800:
                current += p + "\n\n"
            else:
                chunks.append(current.strip())
                current = p + "\n\n"
        if current:
            chunks.append(current.strip())
        return [c for c in chunks if c.strip()]

    def _get_embedding(self, text: str) -> List[float]:
        try:
            response = self.client.models.embed_content(
                model=self.embed_model,
                contents=text
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"  ⚠️  Embedding error with {self.embed_model}: {e}")
            return [0.0] * 768

    def _init_knowledge_base(self):
        # 1. Try loading from cache
        if os.path.exists(EMBEDDINGS_CACHE):
            try:
                with open(EMBEDDINGS_CACHE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                    # Prevent loading a corrupt cache full of 0s
                    test_emb = data.get("embeddings", [])
                    if test_emb and sum(test_emb[0]) == 0:
                        print("  ⚠️  Found corrupted cache (0s). Regenerating...")
                        os.remove(EMBEDDINGS_CACHE)
                    else:
                        self.chunks = data.get("chunks", [])
                        self.embeddings = test_emb
                        print(f"  📚 RAG Engine: Loaded {len(self.chunks)} knowledge chunks from cache.")
                        return
            except Exception as e:
                print(f"  ⚠️  Cache load failed: {e}")
                
        # 2. Re-process files if no cache
        print("  ⏳ RAG Engine: Processing documents and generating embeddings...")
        
        # Ensure data dir exists
        os.makedirs(DATA_DIR, exist_ok=True)
        
        all_text = ""
        for filename in os.listdir(DATA_DIR):
            if filename.endswith(".txt"):
                filepath = os.path.join(DATA_DIR, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    all_text += f"Source: {filename}\n" + f.read() + "\n\n"
                    
        if not all_text.strip():
            print("  ℹ️  RAG Engine: No .txt files found in data/ folder.")
            return
            
        self.chunks = self._chunk_text(all_text)
        
        for i, chunk in enumerate(self.chunks):
            print(f"    Embedding chunk {i+1}/{len(self.chunks)}...")
            emb = self._get_embedding(chunk)
            self.embeddings.append(emb)
            time.sleep(0.5)  # Respect free-tier rate limits
            
        # 3. Save cache
        try:
            with open(EMBEDDINGS_CACHE, "w", encoding="utf-8") as f:
                json.dump({"chunks": self.chunks, "embeddings": self.embeddings}, f)
            print("  ✅ RAG Engine: Knowledge base vectorized and cached!")
        except Exception as e:
            print(f"  ⚠️  Cache save failed: {e}")

    def search(self, query: str, top_k: int = 2) -> str:
        """Search the knowledge base for chunks most similar to the query."""
        if not self.chunks or not self.embeddings or not _has_numpy:
            return ""
            
        query_emb = self._get_embedding(query)
        if sum(query_emb) == 0:
            return ""
            
        import numpy as np
        query_vec = np.array(query_emb)
        doc_vecs = np.array(self.embeddings)
        
        # Calculate Cosine Similarity efficiently using NumPy
        norms_doc = np.linalg.norm(doc_vecs, axis=1)
        norm_q = np.linalg.norm(query_vec)
        
        norms_doc[norms_doc == 0] = 1.0
        if norm_q == 0: norm_q = 1.0
            
        similarities = np.dot(doc_vecs, query_vec) / (norms_doc * norm_q)
        
        # Get top K indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        # Only return results with decent similarity (e.g. > 0.5)
        results = [self.chunks[i] for i in top_indices if similarities[i] > 0.45]
        
        if results:
            print(f"  🔍 RAG Search Hit! Found {len(results)} relevant contexts.")
            return "\n\n---\n\n".join(results)
        return ""


# Singleton instance
rag_service = RAGService()
