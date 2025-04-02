from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import databutton as db
import json
from datetime import datetime

router = APIRouter(prefix="/ted_brain/categories")

# ---- Models ----

class Category(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    created_at: str
    updated_at: str
    
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=200)
    icon: Optional[str] = None
    color: Optional[str] = None
    
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=200)
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoriesResponse(BaseModel):
    categories: List[Category]

class CategoryResponse(BaseModel):
    category: Category

# ---- Storage Functions ----

def sanitize_key(key: str) -> str:
    """Sanitize storage key to only allow alphanumeric and ._- symbols"""
    import re
    return re.sub(r'[^a-zA-Z0-9._-]', '', key)

def get_user_categories_key(user_id: str) -> str:
    """Generate storage key for user categories"""
    return sanitize_key(f"tedbrain_categories_{user_id}")

def get_item_categories_key(user_id: str) -> str:
    """Generate storage key for mapping items to categories"""
    return sanitize_key(f"tedbrain_item_categories_{user_id}")

def get_default_categories() -> List[Category]:
    """Get default categories for new users"""
    now = datetime.utcnow().isoformat()
    return [
        Category(
            id=str(uuid.uuid4()),
            name="My Trades",
            description="Your personal trade history and performance",
            icon="trending-up",
            color="#10b981", # Green
            created_at=now,
            updated_at=now
        ),
        Category(
            id=str(uuid.uuid4()),
            name="Market Analysis",
            description="Charts, technical analysis and market insights",
            icon="bar-chart",
            color="#3b82f6", # Blue
            created_at=now,
            updated_at=now
        ),
        Category(
            id=str(uuid.uuid4()),
            name="News & Research",
            description="Important news articles and research papers",
            icon="newspaper",
            color="#8b5cf6", # Purple
            created_at=now,
            updated_at=now
        ),
        Category(
            id=str(uuid.uuid4()),
            name="Learning Resources",
            description="Trading education and learning materials",
            icon="book-open",
            color="#f59e0b", # Yellow
            created_at=now,
            updated_at=now
        ),
    ]

# ---- Endpoints ----

@router.get("/", response_model=CategoriesResponse)
async def list_categories(user_id: str = Query("default")):
    """List all categories for a user"""
    storage_key = get_user_categories_key(user_id)
    
    try:
        categories_data = db.storage.json.get(storage_key)
        categories = [Category(**item) for item in categories_data]
        return CategoriesResponse(categories=categories)
    except FileNotFoundError:
        # Create default categories for new users
        default_categories = get_default_categories()
        categories_list = [category.dict() for category in default_categories]
        db.storage.json.put(storage_key, categories_list)
        return CategoriesResponse(categories=default_categories)

@router.post("/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user_id: str = Query("default")):
    """Create a new category"""
    storage_key = get_user_categories_key(user_id)
    
    try:
        categories_data = db.storage.json.get(storage_key)
        categories = [Category(**item) for item in categories_data] 
    except FileNotFoundError:
        categories = get_default_categories()
    
    # Check if category name already exists
    if any(c.name.lower() == category.name.lower() for c in categories):
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    now = datetime.utcnow().isoformat()
    new_category = Category(
        id=str(uuid.uuid4()),
        name=category.name,
        description=category.description,
        icon=category.icon,
        color=category.color,
        created_at=now,
        updated_at=now
    )
    
    categories.append(new_category)
    categories_list = [category.dict() for category in categories]
    db.storage.json.put(storage_key, categories_list)
    
    return CategoryResponse(category=new_category)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str, user_id: str = Query("default")):
    """Get a specific category"""
    storage_key = get_user_categories_key(user_id)
    
    try:
        categories_data = db.storage.json.get(storage_key)
        categories = [Category(**item) for item in categories_data]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for category in categories:
        if category.id == category_id:
            return CategoryResponse(category=category)
    
    raise HTTPException(status_code=404, detail="Category not found")

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, update_data: CategoryUpdate, user_id: str = Query("default")):
    """Update a category"""
    storage_key = get_user_categories_key(user_id)
    
    try:
        categories_data = db.storage.json.get(storage_key)
        categories = [Category(**item) for item in categories_data]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Find the category
    category_index = None
    for i, category in enumerate(categories):
        if category.id == category_id:
            category_index = i
            break
    
    if category_index is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing category
    if update_data.name and any(c.name.lower() == update_data.name.lower() and c.id != category_id for c in categories):
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Update category
    category = categories[category_index]
    update_dict = update_data.dict(exclude_unset=True)
    
    for key, value in update_dict.items():
        setattr(category, key, value)
    
    category.updated_at = datetime.utcnow().isoformat()
    categories[category_index] = category
    categories_list = [category.dict() for category in categories]
    db.storage.json.put(storage_key, categories_list)
    
    return CategoryResponse(category=category)

@router.delete("/{category_id}")
async def delete_category(category_id: str, user_id: str = Query("default")):
    """Delete a category"""
    storage_key = get_user_categories_key(user_id)
    item_categories_key = get_item_categories_key(user_id)
    
    try:
        categories = db.storage.json.get(storage_key)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Find and remove the category
    category_index = None
    for i, category in enumerate(categories):
        if category.id == category_id:
            category_index = i
            break
    
    if category_index is None:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Remove the category
    removed_category = categories.pop(category_index)
    categories_list = [category.dict() for category in categories]
    db.storage.json.put(storage_key, categories_list)
    
    # Remove category assignments for items
    try:
        item_categories = db.storage.json.get(item_categories_key)
        updated = False
        
        for item_id, assigned_categories in item_categories.items():
            if category_id in assigned_categories:
                item_categories[item_id] = [c for c in assigned_categories if c != category_id]
                updated = True
        
        if updated:
            db.storage.json.put(item_categories_key, item_categories)
    except FileNotFoundError:
        # No item category mappings exist yet
        pass
    
    return {"detail": f"Category '{removed_category.name}' deleted successfully"}

# ---- Item Category Assignment ----

class ItemCategoryAssignment(BaseModel):
    item_id: str
    category_ids: List[str]

class ItemCategoryResponse(BaseModel):
    item_id: str
    category_ids: List[str]

class ItemsByCategoryResponse(BaseModel):
    category_id: str
    item_ids: List[str]

@router.post("/assign", response_model=ItemCategoryResponse)
async def assign_item_to_categories(assignment: ItemCategoryAssignment, user_id: str = Query("default")):
    """Assign an item to one or more categories"""
    storage_key = get_user_categories_key(user_id)
    item_categories_key = get_item_categories_key(user_id)
    
    # Validate that categories exist
    try:
        categories_data = db.storage.json.get(storage_key)
        categories = [Category(**item) for item in categories_data]
        existing_category_ids = {category.id for category in categories}
        
        # Check if all category IDs are valid
        invalid_categories = [cat_id for cat_id in assignment.category_ids if cat_id not in existing_category_ids]
        if invalid_categories:
            raise HTTPException(status_code=400, detail=f"Invalid category IDs: {', '.join(invalid_categories)}")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No categories found")
    
    # Get or create item-category mappings
    try:
        item_categories = db.storage.json.get(item_categories_key)
    except FileNotFoundError:
        item_categories = {}
    
    # Update assignment
    item_categories[assignment.item_id] = assignment.category_ids
    db.storage.json.put(item_categories_key, item_categories)
    
    return ItemCategoryResponse(
        item_id=assignment.item_id,
        category_ids=assignment.category_ids
    )

@router.get("/items/{item_id}", response_model=ItemCategoryResponse)
async def get_item_categories(item_id: str, user_id: str = Query("default")):
    """Get categories for a specific item"""
    item_categories_key = get_item_categories_key(user_id)
    
    try:
        item_categories = db.storage.json.get(item_categories_key)
        if item_id in item_categories:
            return ItemCategoryResponse(
                item_id=item_id,
                category_ids=item_categories[item_id]
            )
        else:
            return ItemCategoryResponse(
                item_id=item_id,
                category_ids=[]
            )
    except FileNotFoundError:
        return ItemCategoryResponse(
            item_id=item_id,
            category_ids=[]
        )

@router.get("/by-category/{category_id}", response_model=ItemsByCategoryResponse)
async def get_items_by_category(category_id: str, user_id: str = Query("default")):
    """Get all items assigned to a specific category"""
    storage_key = get_user_categories_key(user_id)
    item_categories_key = get_item_categories_key(user_id)
    
    # Validate that category exists
    try:
        categories = db.storage.json.get(storage_key)
        if not any(category.id == category_id for category in categories):
            raise HTTPException(status_code=404, detail="Category not found")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No categories found")
    
    # Get items in this category
    try:
        item_categories = db.storage.json.get(item_categories_key)
        items_in_category = [item_id for item_id, cats in item_categories.items() if category_id in cats]
        
        return ItemsByCategoryResponse(
            category_id=category_id,
            item_ids=items_in_category
        )
    except FileNotFoundError:
        return ItemsByCategoryResponse(
            category_id=category_id,
            item_ids=[]
        )
