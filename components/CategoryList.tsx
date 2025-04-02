"use client";

import React, { useState, useEffect } from "react";
import { Folder, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import brain from "brain";
import { Category } from "types";

export function CategoryList({ refreshTrigger = 0 }: { refreshTrigger?: number } = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]);
  
  const fetchCategories = async () => {
    setIsLoading(true);
    
    try {
      const response = await brain.list_categories({ user_id: "default" });
      const data = await response.json();
      setCategories(data.categories);
      
      // Check if we need to create a default Trading folder
      const hasTradingFolder = data.categories.some(cat => cat.name === "Trading");
      
      if (!hasTradingFolder) {
        console.log("Creating Trading folder as it doesn't exist");
        await createTradingFolder();
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load folders");
      
      // If we can't fetch categories, still try to create the Trading folder
      createTradingFolder();
    } finally {
      setIsLoading(false);
    }
  };
  
  const createTradingFolder = async () => {
    try {
      const response = await brain.create_category(
        { user_id: "default" },
        {
          name: "Trading",
          description: "Store your trading charts, strategies, and market analysis.",
          icon: null,
          color: null
        }
      );
      
      // Wait for the response
      await response.json();
      
      // Show success message
      toast.success("Trading folder created");
      
      // Refresh categories to include the new Trading folder
      const updatedResponse = await brain.list_categories({ user_id: "default" });
      const updatedData = await updatedResponse.json();
      setCategories(updatedData.categories);
    } catch (error) {
      console.error("Error creating Trading folder:", error);
    }
  };
  
  const handleCategoryClick = (category: Category) => {
    // In the future, this will show items in the category
    toast.info(`Viewing items in ${category.name} folder coming soon!`);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (categories.length === 0) {
    return (
      <div className="bg-background/40 rounded-md p-3 text-center text-xs text-muted-foreground">
        <Folder className="h-4 w-4 mx-auto mb-2 opacity-50" />
        <p>No folders yet</p>
        <p className="mt-1">Create folders to organize your knowledge</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {categories.map((category) => (
        <div 
          key={category.id}
          className="bg-background/40 rounded-md p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-background/60 hover:border-primary/30 border border-transparent transition-all h-[90px]"
          onClick={() => handleCategoryClick(category)}
        >
          <div className={`rounded-md p-2 ${category.color || 'bg-primary/10'} mb-2`}>
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div className="text-xs font-medium text-center truncate w-full">{category.name}</div>
        </div>
      ))}
    </div>
  );
}
