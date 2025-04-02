import google.generativeai as genai
import databutton as db
import json
import re
import uuid
import hashlib
import time
import requests
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
import tempfile
import os
from PIL import Image
import io
from datetime import datetime
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from app.apis.ted_brain_categories import get_user_categories_key, get_item_categories_key, sanitize_key

router = APIRouter()

# Initialize Gemini model with API key
API_KEY = db.secrets.get("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

text_model = genai.GenerativeModel(model_name="gemini-1.5-pro")
multimodal_model = genai.GenerativeModel(model_name="gemini-1.5-pro-vision")

# Models for Brain operations
class BrainItem(BaseModel):
    id: str = Field(..., description="Unique identifier for the brain item")
    content: str = Field(..., description="Content to add to the brain")
    source: str = Field(..., description="Source of the content (e.g., chart, message, article)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    embedding_id: Optional[str] = Field(None, description="ID of the embedding in the vector DB")
    created_at: str = Field(..., description="Timestamp of creation")
    user_id: str = Field("default", description="User ID who added the content")

class AddToBrainRequest(BaseModel):
    content: str = Field(..., description="Content to add to the brain")
    source: str = Field(..., description="Source of the content (e.g., chart, message, article)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    user_id: str = Field("default", description="User ID who's adding the content")

class AddToBrainResponse(BaseModel):
    id: str = Field(..., description="ID of the added brain item")
    status: str = Field(..., description="Status of the operation")
    embedding_id: Optional[str] = Field(None, description="ID of the embedding in the vector DB")

class QueryBrainRequest(BaseModel):
    query: str = Field(..., description="Query to search the brain")
    limit: int = Field(5, description="Maximum number of results to return")
    user_id: str = Field("default", description="User ID who's brain to query")

class QueryResult(BaseModel):
    id: str = Field(..., description="ID of the brain item")
    content: str = Field(..., description="Content from the brain")
    source: str = Field(..., description="Source of the content")
    metadata: Dict[str, Any] = Field(..., description="Additional metadata")
    similarity: float = Field(..., description="Similarity score (0-1)")
    created_at: str = Field(..., description="Timestamp of creation")

class QueryBrainResponse(BaseModel):
    results: List[QueryResult] = Field(..., description="List of query results")
    query: str = Field(..., description="Original query")

class MediaProcessingResponse(BaseModel):
    id: str = Field(..., description="ID of the processed media item")
    status: str = Field(..., description="Status of the processing operation")
    content_type: str = Field(..., description="Type of media content processed")
    description: str = Field(None, description="AI-generated description of the media")
    metadata: Dict[str, Any] = Field(..., description="Media metadata including dimensions, size, etc.")

class BrainStoreStatusResponse(BaseModel):
    total_items: int = Field(..., description="Total number of items in the user's brain")
    sources: Dict[str, int] = Field(..., description="Count of items by source")
    last_added: Optional[str] = Field(None, description="Timestamp of last added item")
    size_kb: float = Field(..., description="Approximate size of brain data in KB")
    user_id: str = Field(..., description="User ID of the brain")

# Use the sanitize_key function from ted_brain_categories module

def extract_url_metadata(url: str) -> Dict[str, Any]:
    """Extract metadata from a URL such as title, description, etc."""
    try:
        # Fetch the page with a timeout
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        # Parse with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract basic metadata
        title = soup.title.string if soup.title else None
        description = None
        
        # Check for meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content")
        
        # If no description, try Open Graph
        if not description:
            og_desc = soup.find("meta", attrs={"property": "og:description"})
            if og_desc:
                description = og_desc.get("content")
        
        # Get main text content (simplified)
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
            
        # Get text content
        text = soup.get_text(separator=' ', strip=True)
        
        # Truncate if too long
        if text and len(text) > 5000:
            text = text[:5000] + "..."
            
        # Get domain
        domain = urlparse(url).netloc
        
        return {
            "url": url,
            "title": title,
            "description": description,
            "domain": domain,
            "content": text,
            "extracted_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error extracting metadata from URL {url}: {e}")
        # Return minimal metadata
        return {
            "url": url,
            "domain": urlparse(url).netloc if url else None,
            "error": str(e),
            "extracted_at": datetime.now().isoformat()
        }

def generate_embedding(text: str) -> List[float]:
    """Generate embedding for text using Google's Generative AI"""
    try:
        embedding = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_query",
        )
        if embedding and embedding.embedding:
            return embedding.embedding
        raise ValueError("Failed to generate embedding")
    except Exception as e:
        print(f"Error generating embedding: {e}")
        # Return a deterministic pseudo-embedding based on content hash
        # This is a fallback for when the API fails
        content_hash = hashlib.md5(text.encode()).digest()
        # Convert the 16 bytes to 768 dimensions by repeating and adding noise
        pseudo_embedding = []
        for i in range(768):
            # Use the hash to generate a deterministic but unique float
            byte_val = content_hash[i % 16]
            # Convert to a float between -1 and 1
            val = (byte_val / 127.5) - 1
            pseudo_embedding.append(val)
        return pseudo_embedding

def get_brain_storage_key(user_id: str = "default"):
    """Get the storage key for the brain items"""
    return sanitize_key(f"brain_items_{user_id}")

def get_brain_embeddings_key(user_id: str = "default"):
    """Get the storage key for the brain embeddings"""
    return sanitize_key(f"brain_embeddings_{user_id}")

@router.post("/add-to-brain")
async def add_to_brain(request: AddToBrainRequest) -> AddToBrainResponse:
    # Extract category IDs from metadata if present
    category_ids = request.metadata.get("category_ids", []) if request.metadata else []
    """Add content to the user's personalized knowledge brain"""
    try:
        # Generate a unique ID for the brain item
        item_id = str(uuid.uuid4())
        
        # Enhanced URL handling
        content = request.content
        metadata = request.metadata.copy() if request.metadata else {}
        
        # If this is a URL import, extract metadata
        if request.source == "url" and metadata.get("url"):
            url = metadata.get("url")
            url_metadata = extract_url_metadata(url)
            
            # Enhance the content with extracted data
            if url_metadata.get("title") and url_metadata.get("description"):
                content = f"Title: {url_metadata['title']}\n\nDescription: {url_metadata['description']}\n\nURL: {url}"
            
            # Add extracted data to metadata
            metadata.update(url_metadata)
            
            # Add full content if available
            if url_metadata.get("content"):
                metadata["full_content"] = url_metadata["content"]
        
        # Create the brain item
        brain_item = BrainItem(
            id=item_id,
            content=content,
            source=request.source,
            metadata=metadata,
            created_at=datetime.now().isoformat(),
            user_id=request.user_id
        )
        
        # Generate embedding for the content
        embedding = generate_embedding(request.content)
        embedding_id = f"{item_id}_embedding"
        
        # Store the brain item and embedding
        brain_items_key = get_brain_storage_key(request.user_id)
        brain_embeddings_key = get_brain_embeddings_key(request.user_id)
        
        # Get existing brain items or initialize new dict
        try:
            brain_items = db.storage.json.get(brain_items_key, default={})
        except:
            brain_items = {}
            
        # Get existing brain embeddings or initialize new dict
        try:
            brain_embeddings = db.storage.json.get(brain_embeddings_key, default={})
        except:
            brain_embeddings = {}
        
        # Add the new item and embedding
        brain_items[item_id] = brain_item.dict()
        brain_embeddings[embedding_id] = {
            "item_id": item_id,
            "embedding": embedding,
            "created_at": datetime.now().isoformat()
        }
        
        # Update the brain item with the embedding ID
        brain_items[item_id]["embedding_id"] = embedding_id
        
        # Save to storage
        db.storage.json.put(sanitize_key(brain_items_key), brain_items)
        db.storage.json.put(sanitize_key(brain_embeddings_key), brain_embeddings)
        
        # If category IDs were provided, store the item-category mapping
        if category_ids:
            try:
                item_categories_key = get_item_categories_key(request.user_id)
                try:
                    item_categories = db.storage.json.get(item_categories_key)
                except FileNotFoundError:
                    item_categories = {}
                    
                item_categories[item_id] = category_ids
                db.storage.json.put(item_categories_key, item_categories)
            except Exception as e:
                print(f"Error storing category assignments: {e}")
                # Continue anyway to ensure the document is stored
        
        return AddToBrainResponse(
            id=item_id,
            status="success",
            embedding_id=embedding_id
        )
    except Exception as e:
        print(f"Error adding to brain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query-brain")
async def query_brain(request: QueryBrainRequest) -> QueryBrainResponse:
    """Search the brain with a natural language query"""
    try:
        # Generate embedding for the query
        query_embedding = generate_embedding(request.query)
        
        # Get brain items and embeddings
        brain_items_key = get_brain_storage_key(request.user_id)
        brain_embeddings_key = get_brain_embeddings_key(request.user_id)
        
        try:
            brain_items = db.storage.json.get(brain_items_key)
            brain_embeddings = db.storage.json.get(brain_embeddings_key)
        except:
            # No brain data found
            return QueryBrainResponse(results=[], query=request.query)
        
        # Calculate similarity scores
        similarity_scores = []
        for embedding_id, embedding_data in brain_embeddings.items():
            item_id = embedding_data["item_id"]
            if item_id not in brain_items:
                continue
                
            embedding_vector = embedding_data["embedding"]
            
            # Calculate cosine similarity
            dot_product = sum(a * b for a, b in zip(query_embedding, embedding_vector))
            magnitude_a = sum(a * a for a in query_embedding) ** 0.5
            magnitude_b = sum(b * b for b in embedding_vector) ** 0.5
            similarity = dot_product / (magnitude_a * magnitude_b) if magnitude_a * magnitude_b > 0 else 0
            
            similarity_scores.append({
                "item_id": item_id,
                "similarity": similarity
            })
        
        # Sort by similarity score (highest first)
        similarity_scores.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Get the top results
        top_results = similarity_scores[:request.limit]
        
        # Format results
        results = []
        for result in top_results:
            item_id = result["item_id"]
            brain_item = brain_items[item_id]
            
            results.append(QueryResult(
                id=item_id,
                content=brain_item["content"],
                source=brain_item["source"],
                metadata=brain_item["metadata"],
                similarity=result["similarity"],
                created_at=brain_item["created_at"]
            ))
        
        return QueryBrainResponse(results=results, query=request.query)
    except Exception as e:
        print(f"Error querying brain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_image(image_data: bytes, filename: str, user_id: str = "default") -> Dict[str, Any]:
    """Process an image file and generate a description using Gemini Vision model"""
    try:
        # Open the image using PIL
        img = Image.open(io.BytesIO(image_data))
        
        # Get image metadata
        metadata = {
            "width": img.width,
            "height": img.height,
            "format": img.format,
            "mode": img.mode,
            "filename": filename,
            "size_bytes": len(image_data),
            "processed_at": datetime.now().isoformat()
        }
        
        # Generate description using Gemini Vision
        response = multimodal_model.generate_content([image_data])
        description = response.text if response and hasattr(response, 'text') else "Image processed without description"
        
        # Generate a unique ID for the media item
        media_id = str(uuid.uuid4())
        
        # Store the image in Databutton storage
        image_key = sanitize_key(f"brain_media_{user_id}_{media_id}")
        db.storage.binary.put(image_key, image_data)
        
        # Add the image description to the brain
        brain_item = BrainItem(
            id=media_id,
            content=description,
            source="image",
            metadata={
                **metadata,
                "storage_key": image_key,
                "media_type": "image"
            },
            created_at=datetime.now().isoformat(),
            user_id=user_id
        )
        
        # Generate embedding for the content
        embedding = generate_embedding(description)
        embedding_id = f"{media_id}_embedding"
        
        # Store the brain item and embedding
        brain_items_key = get_brain_storage_key(user_id)
        brain_embeddings_key = get_brain_embeddings_key(user_id)
        
        # Get existing brain items or initialize new dict
        try:
            brain_items = db.storage.json.get(brain_items_key, default={})
        except:
            brain_items = {}
            
        # Get existing brain embeddings or initialize new dict
        try:
            brain_embeddings = db.storage.json.get(brain_embeddings_key, default={})
        except:
            brain_embeddings = {}
        
        # Add the new item and embedding
        brain_items[media_id] = brain_item.dict()
        brain_embeddings[embedding_id] = {
            "item_id": media_id,
            "embedding": embedding,
            "created_at": datetime.now().isoformat()
        }
        
        # Update the brain item with the embedding ID
        brain_items[media_id]["embedding_id"] = embedding_id
        
        # Save to storage
        db.storage.json.put(sanitize_key(brain_items_key), brain_items)
        db.storage.json.put(sanitize_key(brain_embeddings_key), brain_embeddings)
        
        return {
            "id": media_id,
            "status": "success",
            "content_type": "image",
            "description": description,
            "metadata": metadata
        }
    except Exception as e:
        print(f"Error processing image: {e}")
        raise e

async def process_video(video_data: bytes, filename: str, user_id: str = "default") -> Dict[str, Any]:
    """Process a video file, extract frames and generate a description"""
    try:
        # Generate a unique ID for the media item
        media_id = str(uuid.uuid4())
        
        # Get basic metadata without processing
        metadata = {
            "filename": filename,
            "size_bytes": len(video_data),
            "processed_at": datetime.now().isoformat(),
            "media_type": "video"
        }
        
        # Store the video in Databutton storage
        video_key = sanitize_key(f"brain_media_{user_id}_{media_id}")
        db.storage.binary.put(video_key, video_data)
        
        # For now, we'll use a simple description since we can't process the video fully
        description = f"Video file: {filename}. This video has been stored in your knowledge brain."
        
        # Add the video description to the brain
        brain_item = BrainItem(
            id=media_id,
            content=description,
            source="video",
            metadata={
                **metadata,
                "storage_key": video_key
            },
            created_at=datetime.now().isoformat(),
            user_id=user_id
        )
        
        # Generate embedding for the content
        embedding = generate_embedding(description)
        embedding_id = f"{media_id}_embedding"
        
        # Store the brain item and embedding
        brain_items_key = get_brain_storage_key(user_id)
        brain_embeddings_key = get_brain_embeddings_key(user_id)
        
        # Get existing brain items or initialize new dict
        try:
            brain_items = db.storage.json.get(brain_items_key, default={})
        except:
            brain_items = {}
            
        # Get existing brain embeddings or initialize new dict
        try:
            brain_embeddings = db.storage.json.get(brain_embeddings_key, default={})
        except:
            brain_embeddings = {}
        
        # Add the new item and embedding
        brain_items[media_id] = brain_item.dict()
        brain_embeddings[embedding_id] = {
            "item_id": media_id,
            "embedding": embedding,
            "created_at": datetime.now().isoformat()
        }
        
        # Update the brain item with the embedding ID
        brain_items[media_id]["embedding_id"] = embedding_id
        
        # Save to storage
        db.storage.json.put(sanitize_key(brain_items_key), brain_items)
        db.storage.json.put(sanitize_key(brain_embeddings_key), brain_embeddings)
        
        return {
            "id": media_id,
            "status": "success",
            "content_type": "video",
            "description": description,
            "metadata": metadata
        }
    except Exception as e:
        print(f"Error processing video: {e}")
        raise e

@router.post("/upload-media")
async def upload_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form("default"),
    category_ids: Optional[str] = Form(None) # Comma-separated list of category IDs
) -> MediaProcessingResponse:
    """Upload and process media files (images and videos) for the brain"""
    try:
        # Read the file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Check file size (limit to 10MB)
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit")
            
        # Process category assignments if provided
        category_id_list = []
        if category_ids:
            category_id_list = [cat_id.strip() for cat_id in category_ids.split(",") if cat_id.strip()]
        
        # Get file extension and determine content type
        filename = file.filename
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        
        # Process based on file type
        if extension in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']:
            # Process image
            result = await process_image(file_content, filename, user_id)
            
            # If categories were provided, store the item-category mapping
            if category_id_list:
                try:
                    item_categories_key = get_item_categories_key(user_id)
                    try:
                        item_categories = db.storage.json.get(item_categories_key)
                    except FileNotFoundError:
                        item_categories = {}
                        
                    item_categories[result["id"]] = category_id_list
                    db.storage.json.put(item_categories_key, item_categories)
                except Exception as e:
                    print(f"Error storing category assignments: {e}")
                    # Continue anyway to ensure the document is stored
            
            return MediaProcessingResponse(**result)
            
        elif extension in ['mp4', 'mov', 'avi', 'webm', 'mkv']:
            # Process video
            result = await process_video(file_content, filename, user_id)
            
            # If categories were provided, store the item-category mapping
            if category_id_list:
                try:
                    item_categories_key = get_item_categories_key(user_id)
                    try:
                        item_categories = db.storage.json.get(item_categories_key)
                    except FileNotFoundError:
                        item_categories = {}
                        
                    item_categories[result["id"]] = category_id_list
                    db.storage.json.put(item_categories_key, item_categories)
                except Exception as e:
                    print(f"Error storing category assignments: {e}")
                    # Continue anyway to ensure the document is stored
            
            return MediaProcessingResponse(**result)
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {extension}. Supported formats are: jpg, jpeg, png, gif, webp, mp4, mov, avi, webm"
            )
            
    except Exception as e:
        print(f"Error uploading media: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/brain-store-status")
async def brain_store_status(user_id: str = "default") -> BrainStoreStatusResponse:
    """Get the status of the brain store for a user"""
    try:
        brain_items_key = get_brain_storage_key(user_id)
        
        try:
            brain_items = db.storage.json.get(brain_items_key)
        except:
            # No brain data found
            return BrainStoreStatusResponse(
                total_items=0,
                sources={},
                last_added=None,
                size_kb=0,
                user_id=user_id
            )
        
        # Count items by source
        sources = {}
        last_added = None
        for item_id, item in brain_items.items():
            source = item["source"]
            sources[source] = sources.get(source, 0) + 1
            
            # Track the newest item
            if not last_added or item["created_at"] > last_added:
                last_added = item["created_at"]
        
        # Estimate size
        size_bytes = len(json.dumps(brain_items).encode())
        size_kb = size_bytes / 1024
        
        return BrainStoreStatusResponse(
            total_items=len(brain_items),
            sources=sources,
            last_added=last_added,
            size_kb=size_kb,
            user_id=user_id
        )
    except Exception as e:
        print(f"Error getting brain store status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
