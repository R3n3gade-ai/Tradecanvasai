"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, RefreshCw, Book, FileText, Clock, BarChart, Info, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import brain from "brain";
import { useBrainStore } from "../utils/brainStore";
import { Course, CourseRecommendationResponse, CourseOutlineResponse } from "types";

export default function PersonalEducation() {
  const navigate = useNavigate();
  const { queryTedBrain } = useBrainStore();
  
  // State for recommended courses
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // State for custom course outline
  const [topicInput, setTopicInput] = useState("");
  const [courseOutline, setCourseOutline] = useState<CourseOutlineResponse | null>(null);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  
  // Fetch recommended courses on component mount
  useEffect(() => {
    fetchRecommendedCourses();
  }, []);
  
  // Function to fetch recommended courses
  const fetchRecommendedCourses = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await brain.get_course_recommendations({ user_id: "default", limit: 3 });
      const data: CourseRecommendationResponse = await response.json();
      
      setRecommendedCourses(data.recommendations);
      setLastUpdated(data.last_updated);
    } catch (error) {
      console.error("Error fetching course recommendations:", error);
      toast.error("Failed to fetch course recommendations");
    } finally {
      setLoadingRecommendations(false);
    }
  };
  
  // Function to generate course outline
  const generateCourseOutline = async () => {
    if (!topicInput.trim()) {
      toast.error("Please enter a topic for your course");
      return;
    }
    
    try {
      setGeneratingOutline(true);
      setCourseOutline(null);
      
      const response = await brain.generate_course_outline({ 
        topic: topicInput,
        user_id: "default"
      });
      
      const data: CourseOutlineResponse = await response.json();
      setCourseOutline(data);
      
      // Add the course topic to the brain for better recommendations in the future
      await queryTedBrain(`I'm interested in learning about ${topicInput}`);
      
      toast.success("Custom course outline generated!");
    } catch (error) {
      console.error("Error generating course outline:", error);
      toast.error("Failed to generate course outline");
    } finally {
      setGeneratingOutline(false);
    }
  };
  
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate("/courses")} 
          className="flex items-center text-primary mb-8 hover:underline"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back to Courses
        </button>
        
        <div className="flex items-center mb-8 space-x-4">
          <div className="bg-green-500/20 p-4 rounded-lg">
            <Book className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold">Personal Education Focus</h1>
        </div>
        
        {/* Recommended Courses Section */}
        <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-10 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                  <Book className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold">Recommended For You</h2>
              </div>
              <button
                onClick={fetchRecommendedCourses}
                disabled={loadingRecommendations}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRecommendations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mb-4">
                <Calendar className="h-3 w-3 inline mr-1" />
                Last updated: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
            
            <p className="text-muted-foreground mb-6 max-w-3xl">
              These courses are personally recommended based on your activity, interests, and learning needs captured in Ted's Brain.
              Revisit weekly for updated recommendations as you grow.
            </p>
            
            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[200px] items-center justify-center">
                <div className="col-span-3 flex flex-col items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-primary mb-4 animate-spin" />
                  <p className="text-muted-foreground">Analyzing your learning profile...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedCourses.map((course) => (
                  <div key={course.id} className="bg-background/40 rounded-lg border border-white/10 overflow-hidden group hover:border-primary/50 transition-all">
                    <div className="relative h-36 overflow-hidden">
                      <img 
                        src={course.thumbnail_url || `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                      <div className="absolute bottom-3 left-3 bg-primary/90 text-primary-foreground text-xs font-medium py-1 px-2 rounded">
                        {course.difficulty}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.topics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {topic}
                          </span>
                        ))}
                        {course.topics.length > 3 && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">+{course.topics.length - 3}</span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {course.estimated_hours} hours
                        </div>
                        <button className="text-xs text-primary hover:underline flex items-center">
                          View Course <ChevronRight className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                      
                      {course.recommended_reason && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2">
                          <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            <span className="text-blue-400">Why recommended:</span> {course.recommended_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Custom Learning Path Section */}
        <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-10 relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-64 h-64 bg-green-500/10 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="bg-green-500/20 p-2 rounded-lg mr-3">
                <Book className="h-5 w-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Custom Learning Path</h2>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-3xl">
              Request a personalized course outline on any trading or investment topic. Our AI will analyze educational resources
              and create a structured learning path tailored to your needs.
            </p>
            
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter a trading or investment topic..."
                className="flex-1 bg-background/60 border border-white/10 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={generateCourseOutline}
                disabled={generatingOutline || !topicInput.trim()}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingOutline ? (
                  <>
                    <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
                    Generating...
                  </>
                ) : "Create Course Outline"}
              </button>
            </div>
            
            {generatingOutline && (
              <div className="bg-background/40 rounded-lg border border-white/10 p-6 mb-6 flex flex-col items-center justify-center min-h-[300px]">
                <RefreshCw className="h-10 w-10 text-primary mb-4 animate-spin" />
                <h3 className="text-xl font-bold mb-2">Generating Your Custom Course</h3>
                <p className="text-muted-foreground text-center max-w-lg">
                  Our AI is researching educational resources and creating a structured learning path tailored specifically to "{topicInput}".
                  This may take a moment...
                </p>
              </div>
            )}
            
            {courseOutline && !generatingOutline && (
              <div className="bg-background/40 rounded-lg border border-white/10 p-6 mb-4">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-green-400">{courseOutline.course_title}</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="bg-background/60 text-xs px-3 py-1 rounded-full flex items-center">
                      <BarChart className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {courseOutline.difficulty}
                    </div>
                    <div className="bg-background/60 text-xs px-3 py-1 rounded-full flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {courseOutline.total_hours} hours total
                    </div>
                    <div className="bg-background/60 text-xs px-3 py-1 rounded-full flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      {courseOutline.modules.length} modules
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{courseOutline.course_description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {courseOutline.prerequisites.map((prereq, i) => (
                          <li key={i}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Learning Outcomes</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {courseOutline.learning_outcomes.map((outcome, i) => (
                          <li key={i}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-green-400" />
                  Course Modules
                </h4>
                
                <div className="space-y-4">
                  {courseOutline.modules.map((module, i) => (
                    <div key={i} className="bg-background/20 p-4 rounded-lg border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-medium flex items-center">
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full mr-2">
                            Module {i+1}
                          </span>
                          {module.title}
                        </h5>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.estimated_minutes} min
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{module.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {module.key_topics.map((topic, j) => (
                          <span key={j} className="text-xs bg-background/40 px-2 py-0.5 rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <button 
                    className="text-xs text-green-400 hover:underline flex items-center"
                    onClick={() => toast.info("Course saving functionality coming soon!")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                      <path d="M10.75 6h-2v4.25a.75.75 0 0 0 1.5 0V7.56l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 0 0 1.06 1.06l1.72-1.72V10a2.25 2.25 0 0 0 4.5 0V6h-2Z" />
                      <path d="M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Zm7-8.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z" />
                    </svg>
                    Save Course to My Library
                  </button>
                  
                  <span className="text-xs text-muted-foreground">
                    Generated on {new Date(courseOutline.generated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
