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

// Character options for narration
const characters = [
	{
		id: "stewie",
		name: "Stewie",
		avatar: "/placeholder.svg?height=80&width=80",
	},
	{
		id: "lebron",
		name: "LeBron",
		avatar: "/placeholder.svg?height=80&width=80",
	},
	{
		id: "spongebob",
		name: "SpongeBob",
		avatar: "/placeholder.svg?height=80&width=80",
	},
];

// Background options
const backgrounds = [
	{
		id: "minecraft",
		name: "Minecraft Parkour",
		image: "/placeholder.svg?height=120&width=200",
		description: "Learn while watching Minecraft parkour gameplay",
	},
	{
		id: "construction",
		name: "Construction",
		image: "/placeholder.svg?height=120&width=200",
		description: "Building and construction scenes as your background",
	},
	{
		id: "soap",
		name: "Soap Cutting",
		image: "/placeholder.svg?height=120&width=200",
		description: "Relaxing soap cutting videos in the background",
	},
];

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
	const nextHeartId = useRef(0);

	// New state for comments and sharing
	const [showComments, setShowComments] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [comments, setComments] = useState<Record<number, Comment[]>>({});
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isSubmittingComment, setIsSubmittingComment] = useState(false);

	// Ref for wheel scrolling
	const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isScrollingRef = useRef(false);
	const videoContainerRef = useRef<HTMLDivElement>(null);
	const commentsEndRef = useRef<HTMLDivElement>(null);

	// Handle the initial prompt submission
	const handlePromptSubmit = () => {
		if (!learningPrompt) return;

		setIsLoading(true);

		// Simulate API call with a timeout
		setTimeout(() => {
			const generatedPlan = generateMockStudyPlan(learningPrompt);
			setStudyPlan(generatedPlan);
			setIsLoading(false);
			setStep(2);
		}, 1500);
	};

	const debug = () => {
		console.log("debug ", showComments);
		setShowComments(!showComments);
		console.log("debug ", showComments);
	}


	// Handle study plan approval
	const handlePlanApproval = (approved: boolean) => {
		if (approved) {
			setStep(4); // Go to character selection
		} else {
			setStep(3); // Go to refinement
		}
	};

	// Handle refinement submission
	const handleRefinementSubmit = () => {
		if (!refinementInstructions) return;

		setIsLoading(true);

		// Simulate API call with a timeout
		setTimeout(() => {
			// In a real app, you would send the refinement instructions to your API
			// Here we're just modifying the mock data slightly
			const refinedPlan = studyPlan.map((item) => ({
				...item,
				title: item.title.includes("Refined")
					? item.title
					: `Refined: ${item.title}`,
			}));

			setStudyPlan(refinedPlan);
			setRefinementInstructions("");
			setIsLoading(false);
			setStep(2); // Back to review
		}, 1500);
	};

	// Handle character and background selection
	const handleContinueToVideos = () => {
		if (!selectedCharacter || !selectedBackground) return;

		setIsLoading(true);

		// Simulate video loading
		setTimeout(() => {
			setIsLoading(false);
			setStep(5); // Go to video display
		}, 2000);
	};

	// Add this function to handle video navigation
	const navigateVideo = (direction: "next" | "prev") => {
		if (showComments) {
			setShowComments(false);
			return;
		}

		if (direction === "next" && currentVideoIndex < studyPlan.length - 1) {
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
	}, [step, currentVideoIndex, studyPlan.length, showComments]);

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
	}, [step, currentVideoIndex, studyPlan.length, showComments]);

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

		// Simulate API call for AI response
		setTimeout(() => {
			// Generate AI response based on user comment
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
				text: generateAIResponse(
					userComment.text,
					studyPlan[currentVideoIndex]
				),
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

			setIsSubmittingComment(false);

			// Scroll to bottom of comments
			if (commentsEndRef.current) {
				commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
			}
		}, 1500);
	};

	// Generate AI response based on user comment and current video
	const generateAIResponse = (userComment: string, videoData: any): string => {
		const responses = [
			`Great question about ${videoData.title}! The key concept here is to understand the fundamentals first.`,
			`Thanks for asking! In ${videoData.subject} contexts, we typically approach this by analyzing the core principles.`,
			`That's an interesting point! For ${videoData.depth_of_information} level content, I'd recommend focusing on practical applications.`,
			`I'm glad you asked about that. The ${videoData.title} covers this in detail, but essentially it's about connecting concepts.`,
			`Good question! When learning about this topic, remember that ${videoData.outline}`,
		];

		return responses[Math.floor(Math.random() * responses.length)];
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

	return (
		<div className="container mx-auto py-8 max-w-3xl">
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
											<span className="font-medium">{character.name}</span>
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
						onClick={() => setStep(1)}
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
						{studyPlan.map((item, index) => (
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

									{/* Placeholder for actual video - replace with real video component */}
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-center text-white">
											<Video className="h-16 w-16 mx-auto text-white/70" />
											<p className="mt-2 text-lg">Video {index + 1}</p>
											<p className="text-sm text-white/70">
												{selectedBackground === "minecraft" &&
													"Minecraft Parkour Background"}
												{selectedBackground === "construction" &&
													"Construction Background"}
												{selectedBackground === "soap" &&
													"Soap Cutting Background"}
											</p>
										</div>
									</div>

									{/* Video info overlay at bottom */}
									<div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
										<h3 className="text-white text-xl font-bold mb-1">
											{item.title}
										</h3>
										<p className="text-white/80 text-sm mb-2">{item.outline}</p>
										<div className="flex items-center gap-2">
											<span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
												{item.subject}
											</span>
											<span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
												{item.depth_of_information}
											</span>
											<span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
												{Math.floor(item.proposed_length / 60)}:
												{(item.proposed_length % 60)
													.toString()
													.padStart(2, "0")}
											</span>
										</div>
									</div>

									{/* Right side controls */}
									<div className="absolute right-4 bottom-50 flex flex-col items-center gap-4">
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

									{currentVideoIndex < studyPlan.length - 1 &&
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
										{studyPlan.map((_, i) => (
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
																<p className="text-white/90 text-sm mt-1">
																	{comment.text}
																</p>
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
						videoTitle={studyPlan[currentVideoIndex]?.title || "Learning Video"}
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
