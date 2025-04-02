"use client";

import { useState, useEffect } from "react";
import { Check, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import brain from "brain";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  selectedCategories: string[];
  onChange: (categoryIds: string[]) => void;
  userId?: string;
}

export function CategorySelector({ selectedCategories, onChange, userId = "default" }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await brain.list_categories({ user_id: userId });
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await brain.create_category(
        { user_id: userId },
        {
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          icon: null,
          color: null
        }
      );

      const data = await response.json();
      setCategories([...categories, data.category]);
      setCreateDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryDescription("");

      // Auto-select the newly created category
      onChange([...selectedCategories, data.category.id]);
    } catch (err) {
      console.error("Error creating category:", err);
      setError("Failed to create category");
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Categories</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCreateDialogOpen(true)}
          className="h-7 text-xs hover:bg-accent"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-primary border-r-transparent" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No categories yet. Create one to get started.
            </div>
          ) : (
            categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                className="cursor-pointer px-2.5 py-0.5 text-xs"
                onClick={() => toggleCategory(category.id)}
                style={{
                  backgroundColor: selectedCategories.includes(category.id) 
                    ? (category.color || undefined) 
                    : undefined
                }}
              >
                {category.name}
                {selectedCategories.includes(category.id) && (
                  <Check className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))
          )}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="category-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="category-description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
