from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import json
import databutton as db
import datetime
import uuid
import re
import time
from app.apis.ted_brain_categories import sanitize_key

# Import LangChain components
try:
    from langchain.embeddings import GoogleGenerativeAIEmbeddings
    from langchain.vectorstores import Chroma
    from langchain.schema.document import Document
    LANGCHAIN_AVAILABLE = True
    print("LangChain and VectorStore components available")
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("LangChain or VectorStore components not available - using mock storage")

# Create router
router = APIRouter(tags=["Brain Store"])

# Define models
class BrainItem(BaseModel):
    id: str
    user_id: str
    content: str
    metadata: Dict[str, Any]
    source: str
    timestamp: str

class AddToBrainRequest(BaseModel):
    user_id: str
    content: str
    source: str = Field(description="Source of the content, e.g., 'stock-chart', 'market-analysis', 'user-note'")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata about the content")
    context: Optional[Dict[str, Any]] = Field(default={}, description="Contextual information about where the content was added from")

class AddToBrainResponse(BaseModel):
    id: str
    status: str
    timestamp: str
    message: Optional[str] = None

class QueryBrainRequest(BaseModel):
    user_id: str
    query: str
    limit: Optional[int] = 5

class QueryBrainResponse(BaseModel):
    results: List[BrainItem]
    query: str

# We're using the sanitize_key function from ted_brain_categories module

# Initialize embeddings and vector store
def get_embeddings():
    """Get embeddings model based on available API keys"""
    if not LANGCHAIN_AVAILABLE:
        return None
        
    try:
        gemini_api_key = db.secrets.get("GEMINI_API_KEY")
        return GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=gemini_api_key)
    except Exception as e:
        print(f"Error initializing embeddings: {e}")
        return None

# Vector store persistence layer
class VectorStoreManager:
    """Manages persistent vector stores for each user"""
    def __init__(self):
        self.embeddings = get_embeddings()
        self.stores = {}
    
    def get_store_for_user(self, user_id: str):
        """Get or create a vector store for a specific user"""
        if not LANGCHAIN_AVAILABLE or not self.embeddings:
            return None
            
        if user_id not in self.stores:
            # Load existing data if available
            try:
                existing_data = self._load_user_data(user_id)
                if existing_data and len(existing_data) > 0:
                    documents = [
                        Document(page_content=item["content"], metadata=item["metadata"])
                        for item in existing_data
                    ]
                    self.stores[user_id] = Chroma.from_documents(documents, self.embeddings)
                else:
                    # Create new empty store
                    self.stores[user_id] = Chroma(embedding_function=self.embeddings)
            except Exception as e:
                print(f"Error creating vector store for user {user_id}: {e}")
                return None
        
        return self.stores[user_id]
    
    def add_to_store(self, user_id: str, content: str, metadata: Dict[str, Any]):
        """Add content to a user's vector store"""
        store = self.get_store_for_user(user_id)
        if not store:
            return False
            
        try:
            document = Document(page_content=content, metadata=metadata)
            store.add_documents([document])
            self._save_user_data(user_id, content, metadata)
            return True
        except Exception as e:
            print(f"Error adding to vector store for user {user_id}: {e}")
            return False
    
    def query_store(self, user_id: str, query: str, limit: int = 5):
        """Query a user's vector store"""
        store = self.get_store_for_user(user_id)
        if not store:
            return []
            
        try:
            results = store.similarity_search(query, k=limit)
            return [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "id": doc.metadata.get("id", str(uuid.uuid4()))
                }
                for doc in results
            ]
        except Exception as e:
            print(f"Error querying vector store for user {user_id}: {e}")
            return []
    
    def _save_user_data(self, user_id: str, content: str, metadata: Dict[str, Any]):
        """Save user data to persistent storage"""
        key = sanitize_key(f"brain_store_{user_id}")
        
        try:
            # Generate a unique ID for this item
            item_id = str(uuid.uuid4())
            metadata["id"] = item_id
            
            # Add timestamp
            timestamp = datetime.datetime.now().isoformat()
            metadata["timestamp"] = timestamp
            
            # Load existing data
            try:
                existing_data = db.storage.json.get(key, default=[])
            except:
                existing_data = []
            
            # Add new item
            new_item = {
                "id": item_id,
                "content": content,
                "metadata": metadata,
                "timestamp": timestamp
            }
            
            existing_data.append(new_item)
            
            # Store updated data
            db.storage.json.put(key, existing_data)
            return True
        except Exception as e:
            print(f"Error saving user data: {e}")
            return False
    
    def _load_user_data(self, user_id: str):
        """Load user data from persistent storage"""
        key = sanitize_key(f"brain_store_{user_id}")
        
        try:
            return db.storage.json.get(key, default=[])
        except Exception as e:
            print(f"Error loading user data: {e}")
            return []

# Create global instance
vector_store_manager = VectorStoreManager()

# Mock implementation for testing without vector database
class MockBrainStore:
    """Mock implementation of brain store for testing"""
    def __init__(self):
        self.data = {}
    
    def add_to_store(self, user_id: str, content: str, metadata: Dict[str, Any]):
        """Add content to a user's store"""
        if user_id not in self.data:
            self.data[user_id] = []
            
        item_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now().isoformat()
        
        item = {
            "id": item_id,
            "content": content,
            "metadata": metadata,
            "timestamp": timestamp
        }
        
        self.data[user_id].append(item)
        
        # Also save to persistent storage
        key = sanitize_key(f"brain_store_{user_id}")
        try:
            existing_data = db.storage.json.get(key, default=[])
        except:
            existing_data = []
            
        existing_data.append(item)
        db.storage.json.put(key, existing_data)
        
        return True
    
    def query_store(self, user_id: str, query: str, limit: int = 5):
        """Query a user's store using simple keyword matching"""
        if user_id not in self.data:
            try:
                # Try to load from storage
                key = sanitize_key(f"brain_store_{user_id}")
                self.data[user_id] = db.storage.json.get(key, default=[])
            except:
                self.data[user_id] = []
        
        # Simple keyword matching
        results = []
        for item in self.data[user_id]:
            # Check if any words in the query appear in the content
            query_words = query.lower().split()
            content_lower = item["content"].lower()
            
            # Count matches
            matches = sum(1 for word in query_words if word in content_lower)
            
            if matches > 0:
                results.append({
                    "content": item["content"],
                    "metadata": item["metadata"],
                    "id": item["id"],
                    "matches": matches  # For sorting
                })
        
        # Sort by number of matches and take top results
        results.sort(key=lambda x: x.pop("matches", 0), reverse=True)
        return results[:limit]

# Create mock store
mock_brain_store = MockBrainStore()

@router.post("/add")
async def add_to_brain_store(request: AddToBrainRequest) -> AddToBrainResponse:
    """Add content to a user's brain store"""
    user_id = request.user_id
    content = request.content
    source = request.source
    metadata = request.metadata.copy() if request.metadata else {}
    
    # Add source and context to metadata
    metadata["source"] = source
    if request.context:
        metadata["context"] = request.context
    
    # Add timestamp
    timestamp = datetime.datetime.now().isoformat()
    metadata["timestamp"] = timestamp
    
    # Try to add to vector store first
    if LANGCHAIN_AVAILABLE and vector_store_manager.embeddings:
        success = vector_store_manager.add_to_store(user_id, content, metadata)
    else:
        # Fall back to mock implementation
        success = mock_brain_store.add_to_store(user_id, content, metadata)
    
    if success:
        return AddToBrainResponse(
            id=metadata.get("id", str(uuid.uuid4())),
            status="success",
            timestamp=timestamp,
            message="Content added to your knowledge store"
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to add content to knowledge store")

@router.post("/query")
async def query_brain_store(request: QueryBrainRequest) -> QueryBrainResponse:
    """Query a user's brain store"""
    user_id = request.user_id
    query = request.query
    limit = request.limit
    
    # Try vector store first
    if LANGCHAIN_AVAILABLE and vector_store_manager.embeddings:
        results = vector_store_manager.query_store(user_id, query, limit)
    else:
        # Fall back to mock implementation
        results = mock_brain_store.query_store(user_id, query, limit)
    
    # Format results
    formatted_results = [
        BrainItem(
            id=result["id"],
            user_id=user_id,
            content=result["content"],
            metadata=result["metadata"],
            source=result["metadata"].get("source", "unknown"),
            timestamp=result["metadata"].get("timestamp", datetime.datetime.now().isoformat())
        )
        for result in results
    ]
    
    return QueryBrainResponse(
        results=formatted_results,
        query=query
    )

@router.get("/status")
async def brain_store_status_check():
    """Get the status of the brain store"""
    return {
        "langchain_available": LANGCHAIN_AVAILABLE,
        "embeddings_available": vector_store_manager.embeddings is not None,
        "storage_method": "vector_store" if LANGCHAIN_AVAILABLE and vector_store_manager.embeddings else "mock_store"
    }
