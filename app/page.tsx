"use client";

import type React from "react";

import { useEffect, useState, useRef, type TouchEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Video,
  Heart,
  Share2,
  MessageCircle,
  X,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { backgrounds, characters } from "@/options";
import ReactMarkdown from "react-markdown";

// Add markdown styles
const markdownStyles = `
.markdown-content {
  white-space: pre-wrap;
}

.markdown-content p {
  margin-bottom: 0.75rem;
}

.markdown-content p:last-child {
  margin-bottom: 0;
}

.markdown-content ul, .markdown-content ol {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-content h1, .markdown-content h2, .markdown-content h3,
.markdown-content h4, .markdown-content h5, .markdown-content h6 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.markdown-content h1 { font-size: 1.5rem; }
.markdown-content h2 { font-size: 1.25rem; }
.markdown-content h3 { font-size: 1.125rem; }

.markdown-content code {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.markdown-content pre {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

.markdown-content blockquote {
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.markdown-content a {
  color: #60a5fa;
  text-decoration: underline;
  text-decoration-color: rgba(96, 165, 250, 0.4);
}
`;

// Add this custom hook at the top of the file, before the StudyPlanGenerator component
// This will help with detecting swipe gestures for mobile users

function useSwipe(onSwipeUp: () => void, onSwipeDown: () => void) {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  // Minimum distance required for a swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;

    if (isSwipeUp) {
      onSwipeUp();
    }

    if (isSwipeDown) {
      onSwipeDown();
    }

    // Reset values
    touchStart.current = null;
    touchEnd.current = null;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Mock study plan data - in a real app, this would come from your API

const generateStudyPlan = async (topic: string) => {
  try {
    const response = await fetch("http://localhost:4000/createStudyPlan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: `${topic}` }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const rawData = await response.text();
    const cleanedData = rawData
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
    // console.log(cleanedData);

    const data = JSON.parse(cleanedData);

    // console.log("Generated study plan:", data);
    return data; // Assuming the API returns a JSON object
  } catch (error) {
    console.error("Failed to generate study plan:", error);
    return null;
  }
};

const generateMockStudyPlan = (topic: string) => {
  return [
    {
      subject: "Theory",
      title: `Introduction to ${topic}`,
      outline: `Overview of key ${topic} concepts and fundamentals.`,
      proposed_length: 180,
      depth_of_information: "Beginner",
    },
    {
      subject: "Application",
      title: `Practical ${topic} Examples`,
      outline: `Hands-on demonstration of ${topic} in real-world scenarios.`,
      proposed_length: 240,
      depth_of_information: "Intermediate",
    },
    {
      subject: "Theory",
      title: `Advanced ${topic} Concepts`,
      outline: `Deep dive into complex ${topic} principles.`,
      proposed_length: 300,
      depth_of_information: "Advanced",
    },
    {
      subject: "Application",
      title: `Building with ${topic}`,
      outline: `Step-by-step guide to creating a ${topic} project.`,
      proposed_length: 360,
      depth_of_information: "Intermediate",
    },
  ];
};

// Comment type definition
type Comment = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  isAI?: boolean;
};

// Heart animation component
const FloatingHeart = ({ style }: { style: React.CSSProperties }) => {
  return (
    <div
      className="absolute text-red-500 animate-float-up pointer-events-none"
      style={style}
    >
      <Heart fill="currentColor" size={16} />
    </div>
  );
};

// Share modal component
const ShareModal = ({
  isOpen,
  onClose,
  videoTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://study-videos.example.com/share/${encodeURIComponent(
    videoTitle.toLowerCase().replace(/\s+/g, "-")
  )}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Share this video</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Share this learning video with friends:
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Input value={shareUrl} readOnly className="flex-1" />
          <Button size="icon" onClick={copyToClipboard} variant="outline">
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {["Twitter", "Facebook", "WhatsApp", "Email"].map((platform) => (
            <button
              key={platform}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                <span className="text-xs">{platform[0]}</span>
              </div>
              <span className="text-xs">{platform}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function StudyPlanGenerator() {
  const [step, setStep] = useState(1);
  const [learningPrompt, setLearningPrompt] = useState("");
  const [studyPlan, setStudyPlan] = useState<any[]>([]);
  const [refinementInstructions, setRefinementInstructions] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedBackground, setSelectedBackground] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [hearts, setHearts] = useState<
    { id: number; style: React.CSSProperties }[]
  >([]);
  const [likedVideos, setLikedVideos] = useState<number[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoLoading, setVideoLoading] = useState<boolean[]>([]);
  const [videoErrors, setVideoErrors] = useState<boolean[]>([]);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const nextHeartId = useRef(0);

  // New state for comments and sharing
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  // New state for chat session
  const [chatSessionIds, setChatSessionIds] = useState<Record<number, string>>(
    {}
  );

  // Ref for wheel scrolling
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Add a scroll-to-top effect when changing to key steps
  useEffect(() => {
    if (step === 4 || step === 5) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  // Handle the initial prompt submission
  const handlePromptSubmit = async () => {
    if (!learningPrompt) return;

    setIsLoading(true);

    // Simulate API call with a timeout
    setTimeout(async () => {
      const generatedPlan = await generateStudyPlan(learningPrompt);
      setStudyPlan(generatedPlan);
      setIsLoading(false);
      setStep(2);
    }, 1500);

    // setTimeout(async () => {
    // 	const generatedPlan = await generateMockStudyPlan(learningPrompt);
    // 	setStudyPlan(generatedPlan);
    // 	setIsLoading(false);
    // 	setStep(2);
    // }, 1500);
  };

  const debug = () => {
    // console.log("debug ", showComments);
    setShowComments(!showComments);
    // console.log("debug ", showComments);
  };

  // Handle study plan approval
  const handlePlanApproval = (approved: boolean) => {
    if (approved) {
      setStep(4); // Go to character selection
    } else {
      setStep(3); // Go to refinement
    }
  };

  const handleRefinementSubmit = async () => {
    if (!refinementInstructions) return;
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:4000/refineStudyPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: JSON.stringify(studyPlan),
          refinement: refinementInstructions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const rawData = await response.text();
      // console.log("raw", JSON.stringify(rawData));
      const cleanedData = rawData
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();

      // Ensure the data is parsed as an array
      const refinedPlan = JSON.parse(cleanedData);
      // console.log("refined", JSON.stringify(refinedPlan));
      if (!Array.isArray(refinedPlan)) {
        throw new Error("Received invalid study plan format");
      }

      setStudyPlan(refinedPlan);
      setRefinementInstructions("");
      setIsLoading(false);
      setStep(2); // Back to review
    } catch (error) {
      console.error("Failed to refine study plan:", error);
      setIsLoading(false);
      // Optionally show an error message to the user
      return null;
    }
  };

  // Handle character and background selection
  const handleContinueToVideos = async () => {
    if (!selectedCharacter || !selectedBackground) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:4000/generateStudyPlanVideos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studyPlan: JSON.stringify(studyPlan),
            background: selectedBackground,
            voiceActor: selectedCharacter,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Videos generated successfully:", data);

      // Store the video URLs returned from the API
      if (Array.isArray(data)) {
        setVideoUrls(data);
        // Initialize loading and error states for each video
        setVideoLoading(new Array(data.length).fill(true));
        setVideoErrors(new Array(data.length).fill(false));
      } else {
        console.error("Unexpected response format:", data);
      }

      setIsLoading(false);
      setStep(5); // Go to video display
    } catch (error) {
      console.error("Failed to generate videos:", error);
      setIsLoading(false);
      // Could show an error message to the user here
    }
  };

  // Handle video load events
  const handleVideoLoad = (index: number) => {
    const newLoadingState = [...videoLoading];
    newLoadingState[index] = false;
    setVideoLoading(newLoadingState);
  };

  // Handle video error events
  const handleVideoError = (index: number) => {
    const newErrorState = [...videoErrors];
    newErrorState[index] = true;
    setVideoErrors(newErrorState);

    const newLoadingState = [...videoLoading];
    newLoadingState[index] = false;
    setVideoLoading(newLoadingState);
  };

  // Add this function to handle video navigation
  const navigateVideo = (direction: "next" | "prev") => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    if (direction === "next" && currentVideoIndex < videoUrls.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (direction === "prev" && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  // Add this to handle keyboard navigation
  useEffect(() => {
    if (step !== 5) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        navigateVideo("prev");
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        navigateVideo("next");
      } else if (e.key === "Escape" && showComments) {
        setShowComments(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, currentVideoIndex, videoUrls.length, showComments]);

  // Handle wheel scrolling for trackpad
  useEffect(() => {
    if (step !== 5) return;

    const handleWheel = (e: WheelEvent) => {
      // If comments are open, let the default scroll behavior work
      if (showComments) return;

      e.preventDefault();

      // Debounce wheel events to prevent too many navigations
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }

      if (!isScrollingRef.current) {
        isScrollingRef.current = true;

        // Determine scroll direction
        if (e.deltaY > 50) {
          navigateVideo("next");
        } else if (e.deltaY < -50) {
          navigateVideo("prev");
        }

        // Reset scrolling flag after a delay
        wheelTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      }
    };

    const container = videoContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [step, currentVideoIndex, videoUrls.length, showComments]);

  // Add this to handle swipe gestures
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(
    () => navigateVideo("next"),
    () => navigateVideo("prev")
  );

  // Handle heart button click
  const handleHeartClick = (videoIndex: number) => {
    // Toggle like status
    if (likedVideos.includes(videoIndex)) {
      setLikedVideos(likedVideos.filter((id) => id !== videoIndex));
    } else {
      setLikedVideos([...likedVideos, videoIndex]);

      // Create floating hearts
      const newHearts = Array.from({ length: 8 }, (_, i) => {
        const id = nextHeartId.current++;
        return {
          id,
          style: {
            right: `${30 + Math.random() * 20}px`,
            bottom: `${120 + Math.random() * 40}px`,
            opacity: 0.8 + Math.random() * 0.2,
            transform: `scale(${0.8 + Math.random() * 0.7}) rotate(${
              -20 + Math.random() * 40
            }deg)`,
            animationDuration: `${1 + Math.random() * 1.5}s`,
            animationDelay: `${Math.random() * 0.2}s`,
          },
        };
      });

      setHearts([...hearts, ...newHearts]);

      // Remove hearts after animation completes
      setTimeout(() => {
        setHearts((hearts) =>
          hearts.filter(
            (heart) => !newHearts.some((newHeart) => newHeart.id === heart.id)
          )
        );
      }, 3000);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);

    // Add user comment
    const userComment: Comment = {
      id: Date.now().toString(),
      user: {
        name: "You",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      text: commentText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Update comments for current video
    const currentComments = comments[currentVideoIndex] || [];
    const updatedComments = [...currentComments, userComment];
    setComments({
      ...comments,
      [currentVideoIndex]: updatedComments,
    });

    // Clear input
    setCommentText("");

    try {
      // Check if we already have a session for this video
      let sessionId = chatSessionIds[currentVideoIndex];

      // If no session exists for this video, start a new one
      if (!sessionId) {
        const startResponse = await fetch("http://localhost:4000/chat/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studyPlan: studyPlan[currentVideoIndex],
          }),
        });

        if (!startResponse.ok) {
          throw new Error(`Failed to start chat: ${startResponse.statusText}`);
        }

        const startData = await startResponse.json();
        sessionId = startData.session_id;

        // Save the session ID for this video
        setChatSessionIds({
          ...chatSessionIds,
          [currentVideoIndex]: sessionId,
        });
      }

      // Send the user message to the API
      const messageResponse = await fetch(
        "http://localhost:4000/chat/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: userComment.text,
          }),
        }
      );

      if (!messageResponse.ok) {
        throw new Error(
          `Failed to send message: ${messageResponse.statusText}`
        );
      }

      const messageData = await messageResponse.json();

      // Create AI response from the API response
      const aiResponse: Comment = {
        id: (Date.now() + 1).toString(),
        user: {
          name:
            characters.find((c) => c.id === selectedCharacter)?.name ||
            "AI Assistant",
          avatar:
            characters.find((c) => c.id === selectedCharacter)?.avatar ||
            "/placeholder.svg?height=40&width=40",
        },
        text: messageData.response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isAI: true,
      };

      // Update comments with AI response
      setComments({
        ...comments,
        [currentVideoIndex]: [...updatedComments, aiResponse],
      });
    } catch (error) {
      console.error("Error in chat:", error);

      // Add an error message as AI response in case of failure
      const errorResponse: Comment = {
        id: (Date.now() + 1).toString(),
        user: {
          name: "System",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        text: "Sorry, I couldn't process your message. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isAI: true,
      };

      setComments({
        ...comments,
        [currentVideoIndex]: [...updatedComments, errorResponse],
      });
    } finally {
      setIsSubmittingComment(false);

      // Scroll to bottom of comments
      if (commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Handle share button click
  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  // Scroll to bottom of comments when comments are shown
  useEffect(() => {
    if (showComments && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showComments]);

  // Add effect to control video playback when current index changes
  useEffect(() => {
    if (step !== 5) return;

    // Pause all videos
    videoRefs.current.forEach((videoRef, idx) => {
      if (videoRef && idx !== currentVideoIndex) {
        videoRef.pause();
      }
    });

    // Play current video
    const currentVideo = videoRefs.current[currentVideoIndex];
    if (
      currentVideo &&
      !videoLoading[currentVideoIndex] &&
      !videoErrors[currentVideoIndex]
    ) {
      currentVideo.play().catch((err: Error) => {
        console.error("Error playing video:", err);
      });
    }
  }, [currentVideoIndex, step, videoLoading, videoErrors]);

  // Update refs array when video URLs change
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, videoUrls.length);
    while (videoRefs.current.length < videoUrls.length) {
      videoRefs.current.push(null);
    }
  }, [videoUrls.length]);

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      {/* Add markdown styles */}
      <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />

      {/* Step 1: Landing Page */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Interactive Study Plan Generator
            </CardTitle>
            <CardDescription>
              Tell us what you want to learn about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="e.g., Machine Learning, Web Development, Photography..."
                value={learningPrompt}
                onChange={(e) => setLearningPrompt(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePromptSubmit}
              disabled={!learningPrompt || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Study Plan...
                </>
              ) : (
                "Generate Study Plan"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Review Phase */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Study Plan</CardTitle>
            <CardDescription>
              Review the generated study plan for "{learningPrompt}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studyPlan.map((item, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {item.subject}
                      </div>
                      <div className="text-xs font-medium px-2 py-1 rounded-full bg-secondary/10">
                        {item.depth_of_information}
                      </div>
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm text-muted-foreground">
                      {item.outline}
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground">
                      Estimated length: {Math.floor(item.proposed_length / 60)}:
                      {(item.proposed_length % 60).toString().padStart(2, "0")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handlePlanApproval(false)}
              className="w-1/2"
            >
              Needs Refinement
            </Button>
            <Button onClick={() => handlePlanApproval(true)} className="w-1/2">
              Looks Good!
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Refinement */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Refine Your Study Plan</CardTitle>
            <CardDescription>
              Tell us how to improve the study plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="e.g., Add more beginner content, focus more on practical examples..."
                value={refinementInstructions}
                onChange={(e) => setRefinementInstructions(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleRefinementSubmit}
              disabled={!refinementInstructions || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refining Study Plan...
                </>
              ) : (
                "Submit Refinement"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Character and Background Selection */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Customize Your Learning Experience
            </CardTitle>
            <CardDescription>
              Choose your narrator and background style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Character Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">
                  Select Your Narration Character
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all ${
                        selectedCharacter === character.id
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedCharacter(character.id)}
                    >
                      <Avatar className="h-20 w-20 mb-2">
                        <AvatarImage
                          src={character.avatar || "/placeholder.svg"}
                          alt={character.name}
                        />
                        <AvatarFallback>
                          {character.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`font-medium text-center ${
                          character.name.length > 2 ? "text-sm" : "text-base"
                        }`}
                      >
                        {character.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">
                  Choose Your Background Style
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {backgrounds.map((background) => (
                    <div
                      key={background.id}
                      className={`flex flex-col border rounded-lg cursor-pointer transition-all overflow-hidden ${
                        selectedBackground === background.id
                          ? "ring-2 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedBackground(background.id)}
                    >
                      <div className="relative h-32 w-full overflow-hidden">
                        <img
                          src={background.image || "/placeholder.svg"}
                          alt={background.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedBackground === background.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium">{background.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {background.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleContinueToVideos}
              disabled={!selectedCharacter || !selectedBackground || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Videos...
                </>
              ) : (
                "Continue to Videos"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 5: Video Display */}
      {step === 5 && (
        <div
          className="fixed inset-0 bg-black z-50"
          ref={videoContainerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Back button */}
          <Button
            variant="ghost"
            className="absolute top-4 left-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 h-10 w-10"
            onClick={() => {
              const confirmed = window.confirm(
                "Are you sure you want to go back? Everything will reset and you will be redirected to the prompt page."
              );
              if (confirmed) {
                setStep(1);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span className="sr-only">Go back</span>
          </Button>

          {/* TikTok-style video container */}
          <div className="h-screen w-full overflow-hidden">
            {videoUrls.map((videoUrl, index) => (
              <div
                key={index}
                className={`h-screen w-full flex flex-col items-center justify-center absolute inset-0 transition-transform duration-500 ease-in-out ${
                  index === currentVideoIndex
                    ? "translate-y-0"
                    : index < currentVideoIndex
                    ? "-translate-y-full"
                    : "translate-y-full"
                }`}
              >
                {/* Video container */}
                <div className="relative w-full h-full bg-black">
                  {/* Background indicator */}
                  <div className="absolute top-16 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">
                    Background:{" "}
                    {backgrounds.find((b) => b.id === selectedBackground)?.name}
                  </div>

                  {/* Actual video element */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {videoLoading[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                        <Loader2 className="h-12 w-12 animate-spin text-white" />
                      </div>
                    )}

                    {videoErrors[index] ? (
                      <div className="text-center text-white">
                        <X className="h-16 w-16 mx-auto text-red-500" />
                        <p className="mt-2 text-lg">Failed to load video</p>
                        <Button
                          variant="outline"
                          className="mt-4 text-white border-white"
                          onClick={() => {
                            const newErrors = [...videoErrors];
                            newErrors[index] = false;
                            setVideoErrors(newErrors);

                            const newLoading = [...videoLoading];
                            newLoading[index] = true;
                            setVideoLoading(newLoading);
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : (
                      <video
                        ref={(el) => {
                          videoRefs.current[index] = el;
                        }}
                        src={videoUrl}
                        controls
                        loop
                        className="w-full h-full object-contain"
                        onLoadedData={() => handleVideoLoad(index)}
                        onError={() => handleVideoError(index)}
                      />
                    )}
                  </div>

                  {/* Video info overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {index < studyPlan.length
                        ? studyPlan[index].title
                        : `Video ${index + 1}`}
                    </h3>
                    <p className="text-white/80 text-sm mb-2">
                      {index < studyPlan.length ? studyPlan[index].outline : ""}
                    </p>
                    {index < studyPlan.length && (
                      <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {studyPlan[index].subject}
                        </span>
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {studyPlan[index].depth_of_information}
                        </span>
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                          {Math.floor(studyPlan[index].proposed_length / 60)}:
                          {(studyPlan[index].proposed_length % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side controls - adjust position to match new footer position */}
                  <div className="absolute right-4 bottom-36 flex flex-col items-center gap-4">
                    <button
                      className="relative bg-transparent w-12 h-12 rounded-full flex items-center justify-center border border-white text-white"
                      onClick={() => handleHeartClick(index)}
                    >
                      <Heart
                        size={24}
                        className={`transition-all duration-300 ${
                          likedVideos.includes(index)
                            ? "scale-110"
                            : "scale-100"
                        }`}
                        fill={likedVideos.includes(index) ? "#f43f5e" : "none"}
                        color={
                          likedVideos.includes(index) ? "#f43f5e" : "white"
                        }
                      />

                      {/* Floating hearts */}
                      {hearts.map((heart) => (
                        <FloatingHeart key={heart.id} style={heart.style} />
                      ))}
                    </button>
                    <button
                      className="bg-transparent w-12 h-12 rounded-full flex items-center justify-center border border-white text-white"
                      onClick={() => setShowComments(!showComments)}
                    >
                      <MessageCircle
                        size={24}
                        className={
                          showComments ? "text-blue-400" : "text-white"
                        }
                        fill={showComments ? "#60a5fa" : "none"}
                      />
                    </button>
                    <button
                      className="bg-transparent w-12 h-12 rounded-full flex items-center justify-center border border-white text-white"
                      onClick={handleShareClick}
                    >
                      <Share2 size={24} />
                    </button>
                  </div>

                  {/* Navigation buttons */}
                  {currentVideoIndex > 0 && !showComments && (
                    <button
                      onClick={() => navigateVideo("prev")}
                      className="absolute left-4 top-1/3 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-chevron-up"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                  )}

                  {currentVideoIndex < videoUrls.length - 1 &&
                    !showComments && (
                      <button
                        onClick={() => navigateVideo("next")}
                        className="absolute left-4 bottom-60 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevron-down"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    )}

                  {/* Progress indicator */}
                  <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
                    {videoUrls.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full ${
                          i === currentVideoIndex
                            ? "bg-white w-6"
                            : "bg-white/30 w-4"
                        } transition-all duration-300`}
                      />
                    ))}
                  </div>

                  {/* Narrator avatar */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="text-white text-sm">
                      Narrated by{" "}
                      {characters.find((c) => c.id === selectedCharacter)?.name}
                    </span>
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage
                        src={
                          characters.find((c) => c.id === selectedCharacter)
                            ?.avatar || "/placeholder.svg"
                        }
                        alt={
                          characters.find((c) => c.id === selectedCharacter)
                            ?.name || "Narrator"
                        }
                      />
                      <AvatarFallback>
                        {characters
                          .find((c) => c.id === selectedCharacter)
                          ?.name?.substring(0, 2) || "NA"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Comments section */}
                  <div
                    className={`absolute inset-0 bg-black/90 z-20 transition-transform duration-300 ${
                      showComments ? "translate-y-0" : "translate-y-full"
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      {/* Comments header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h3 className="text-white text-lg font-semibold">
                          Comments
                        </h3>
                        <button
                          onClick={() => debug()}
                          className="text-white p-1 rounded-full hover:bg-red-800"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      {/* Comments list */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments[currentVideoIndex]?.length ? (
                          comments[currentVideoIndex].map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage
                                  src={
                                    comment.user.avatar || "/placeholder.svg"
                                  }
                                  alt={comment.user.name}
                                />
                                <AvatarFallback>
                                  {comment.user.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium text-sm">
                                    {comment.user.name}
                                    {comment.isAI && (
                                      <span className="ml-1 text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                                        AI
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    {comment.timestamp}
                                  </span>
                                </div>
                                {comment.isAI ? (
                                  <div className="text-white/90 text-sm mt-1 markdown-content">
                                    <ReactMarkdown>
                                      {comment.text}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-white/90 text-sm mt-1">
                                    {comment.text}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <MessageCircle
                              size={40}
                              className="mb-2 opacity-50"
                            />
                            <p>No comments yet</p>
                            <p className="text-sm">
                              Be the first to comment on this video
                            </p>
                          </div>
                        )}
                        <div ref={commentsEndRef} />
                      </div>

                      {/* Comment input */}
                      <div className="p-4 border-t border-gray-800">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ask a question about this video..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit();
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            onClick={handleCommentSubmit}
                            disabled={
                              !commentText.trim() || isSubmittingComment
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isSubmittingComment ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Send size={18} />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Share modal */}
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            videoTitle={
              currentVideoIndex < studyPlan.length
                ? studyPlan[currentVideoIndex]?.title || "Learning Video"
                : `Video ${currentVideoIndex + 1}`
            }
          />
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && step === 4 && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
            <p className="mt-4 text-lg font-medium">
              Generating your videos...
            </p>
            <p className="text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
}
