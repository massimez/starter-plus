/** biome-ignore-all lint/performance/noImgElement: <> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <> */
"use client";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	CircleCheck,
	FileIcon,
	ImageIcon,
	LoaderIcon,
	StarIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FileMetadata, useFileUpload } from "@/hooks/use-file-upload";

type GalleryViewerProps = {
	files: ReturnType<typeof useFileUpload>[0]["files"];
	className?: string;
	onRemove?: (id: string) => void;
	onSetThumbnail?: (image: FileMetadata) => void;
	thumbnail?: FileMetadata;
	onClose?: () => void;
};

export function GalleryViewer({
	files,
	onRemove,
	className,
	onSetThumbnail,
	thumbnail,
	onClose,
}: GalleryViewerProps) {
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
		null,
	);
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);

	const minSwipeDistance = 50;

	// Get only image files for lightbox navigation
	const imageFiles = files.filter(
		(file) => file.file.type.startsWith("image/") && file.preview,
	);
	const navigateNext = useCallback(() => {
		setSelectedImageIndex((prev) =>
			prev === null || prev === imageFiles.length - 1 ? 0 : prev + 1,
		);
	}, [imageFiles.length]);

	const navigatePrevious = useCallback(() => {
		setSelectedImageIndex((prev) =>
			prev === null || prev === 0 ? imageFiles.length - 1 : prev - 1,
		);
	}, [imageFiles.length]);
	useEffect(() => {
		if (selectedImageIndex === null) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setSelectedImageIndex(null);
			} else if (e.key === "ArrowLeft") {
				navigatePrevious();
			} else if (e.key === "ArrowRight") {
				navigateNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedImageIndex, navigateNext, navigatePrevious]);

	const onTouchStart = (e: React.TouchEvent) => {
		if (e.targetTouches && e.targetTouches.length > 0) {
			setTouchEnd(null);
			// biome-ignore lint/style/noNonNullAssertion: <>
			setTouchStart(e.targetTouches[0]!.clientX);
		}
	};

	const onTouchMove = (e: React.TouchEvent) => {
		if (e.targetTouches && e.targetTouches.length > 0) {
			// biome-ignore lint/style/noNonNullAssertion: <>
			setTouchEnd(e.targetTouches[0]!.clientX);
		}
	};

	const onTouchEnd = () => {
		if (!touchStart || !touchEnd) return;

		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > minSwipeDistance;
		const isRightSwipe = distance < -minSwipeDistance;

		if (isLeftSwipe) {
			navigateNext();
		} else if (isRightSwipe) {
			navigatePrevious();
		}
	};

	if (files.length === 0) return null;

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<>
			{/* Header with close button */}
			{onClose && (
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-semibold text-base sm:text-lg">
						Gallery ({files.length} {files.length === 1 ? "file" : "files"})
					</h3>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-9 w-9"
						aria-label="Close gallery"
					>
						<XIcon className="h-5 w-5" />
					</Button>
				</div>
			)}

			<div
				className={cn(
					"grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
					className,
				)}
			>
				{files.map((file) => {
					const isFileMetadata = "key" in file.file;
					const fileKey = isFileMetadata ? (file.file as FileMetadata).key : "";
					const isThumbnail = thumbnail?.key === fileKey;
					const isImage = file.file.type.startsWith("image/");
					const imageIndex = imageFiles.findIndex((f) => f.id === file.id);

					return (
						<Card
							key={file.id}
							className={cn(
								"group relative overflow-hidden rounded-lg transition-all active:scale-95 sm:rounded-xl sm:hover:shadow-lg",
								isThumbnail && "shadow-md ring-2 ring-primary",
							)}
						>
							<CardContent className="p-0">
								<div
									className={cn(
										"relative h-40 w-full bg-muted/30 sm:h-20",
										isImage &&
											file.preview &&
											"cursor-pointer active:opacity-90",
										file.isUploading && "pointer-events-none opacity-50",
									)}
									onClick={() => {
										if (
											isImage &&
											file.preview &&
											imageIndex !== -1 &&
											!file.isUploading
										) {
											setSelectedImageIndex(imageIndex);
										}
									}}
								>
									{file.isUploading ? (
										<div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-muted-foreground sm:p-4">
											<LoaderIcon className="h-8 w-8 animate-spin sm:h-10 sm:w-10" />

											{file.uploadProgress !== undefined && (
												<div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
													<div
														className="h-full bg-primary transition-all duration-300 ease-in-out"
														style={{ width: `${file.uploadProgress}%` }}
													/>
												</div>
											)}
										</div>
									) : file.preview && isImage ? (
										<>
											<img
												src={file.preview}
												alt={file.file.name}
												className="h-full w-full object-contain transition-transform sm:group-hover:scale-105"
											/>
											{/* Check icon for uploaded images */}
											{file.isUploaded && (
												<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50 opacity-80 transition-opacity duration-200">
													<CircleCheck
														className="h-12 w-12 text-green-500/30 opacity-90"
														fill="currentColor"
													/>
												</div>
											)}
											<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity sm:group-hover:opacity-100" />
										</>
									) : file.preview ? (
										<div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-muted-foreground sm:p-4">
											<FileIcon className="h-8 w-8 sm:h-10 sm:w-10" />
											<span className="line-clamp-2 text-center font-medium text-xs">
												{file.file.name}
											</span>
										</div>
									) : (
										<div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-muted-foreground sm:p-4">
											<ImageIcon className="h-8 w-8 sm:h-10 sm:w-10" />
											<span className="line-clamp-2 text-center font-medium text-xs">
												{file.file.name}
											</span>
										</div>
									)}
								</div>

								{/* File info overlay */}
								<div className="bg-background/95 p-2 backdrop-blur-sm">
									<p
										className="truncate font-medium text-xs"
										title={file.file.name}
									>
										{file.file.name}
									</p>
									<p className="text-[10px] text-muted-foreground sm:text-xs">
										{formatFileSize(file.file.size)}
									</p>
								</div>
							</CardContent>

							{/* Action buttons */}
							<div className="absolute top-1.5 right-1.5 z-20 flex gap-1">
								{onRemove && (
									<Button
										variant="destructive"
										size="icon"
										type="button"
										className="h-6 w-6 shadow-lg transition-all active:scale-90"
										onClick={(e) => {
											e.stopPropagation();
											onRemove(file.id);
										}}
										aria-label={`Remove ${file.file.name}`}
									>
										<XIcon className="size-3" />
									</Button>
								)}
							</div>

							{/* Thumbnail actions */}
							{onSetThumbnail && isFileMetadata && isImage && !isThumbnail && (
								<Button
									variant="secondary"
									size="icon"
									type="button"
									className="absolute bottom-18 left-1.5 z-20 h-6 w-6 shadow-lg transition-all active:scale-90 sm:bottom-20 sm:left-2 sm:opacity-0 sm:group-hover:opacity-100 sm:hover:scale-110"
									onClick={(e) => {
										e.stopPropagation();
										onSetThumbnail(file.file as FileMetadata);
									}}
									aria-label={`Set ${file.file.name} as thumbnail`}
								>
									<StarIcon className="size-3" />
								</Button>
							)}

							{/* Cover badge - outside the card to avoid blocking clicks */}
							{isThumbnail && (
								<div className="pointer-events-none absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 font-medium text-[10px] text-primary-foreground shadow-lg sm:top-2 sm:left-2 sm:gap-1 sm:px-2 sm:py-1 sm:text-xs">
									<StarIcon className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" />
								</div>
							)}
						</Card>
					);
				})}
			</div>

			{/* Lightbox modal with navigation */}
			{selectedImageIndex !== null && imageFiles[selectedImageIndex] && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
					onClick={() => setSelectedImageIndex(null)}
					onTouchStart={onTouchStart}
					onTouchMove={onTouchMove}
					onTouchEnd={onTouchEnd}
				>
					{/* Close button */}
					<Button
						variant="ghost"
						size="icon"
						type="button"
						className="absolute top-3 right-3 z-50 h-9 w-9 text-white hover:bg-white/20 active:scale-90 sm:top-4 sm:right-4 sm:h-10 sm:w-10"
						onClick={() => setSelectedImageIndex(null)}
						aria-label="Close preview"
					>
						<XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
					</Button>

					{/* Image counter */}
					<div className="absolute top-3 left-3 z-50 rounded-md bg-black/70 px-2.5 py-1.5 text-white text-xs backdrop-blur-sm sm:top-4 sm:left-4 sm:px-3 sm:py-2 sm:text-sm">
						{selectedImageIndex + 1} / {imageFiles.length}
					</div>

					{/* Previous button - Desktop only */}
					{imageFiles.length > 1 && (
						<Button
							variant="ghost"
							size="icon"
							type="button"
							className="-translate-y-1/2 absolute top-1/2 left-2 z-50 hidden h-10 w-10 text-white hover:bg-white/20 active:scale-90 sm:left-4 sm:flex sm:h-12 sm:w-12"
							onClick={(e) => {
								e.stopPropagation();
								navigatePrevious();
							}}
							aria-label="Previous image"
						>
							<ChevronLeftIcon className="h-6 w-6 sm:h-8 sm:w-8" />
						</Button>
					)}

					{/* Next button - Desktop only */}
					{imageFiles.length > 1 && (
						<Button
							variant="ghost"
							size="icon"
							type="button"
							className="-translate-y-1/2 absolute top-1/2 right-2 z-50 hidden h-10 w-10 text-white hover:bg-white/20 active:scale-90 sm:right-4 sm:flex sm:h-12 sm:w-12"
							onClick={(e) => {
								e.stopPropagation();
								navigateNext();
							}}
							aria-label="Next image"
						>
							<ChevronRightIcon className="h-6 w-6 sm:h-8 sm:w-8" />
						</Button>
					)}

					{/* Swipe indicator for mobile */}
					{imageFiles.length > 1 && (
						<div className="-translate-x-1/2 absolute bottom-20 left-1/2 z-50 rounded-full bg-black/70 px-3 py-1.5 text-white/80 text-xs backdrop-blur-sm sm:hidden">
							Swipe to navigate
						</div>
					)}

					{/* Image with filename */}
					<div className="flex max-h-[85vh] max-w-[95vw] flex-col items-center gap-3 sm:max-h-[90vh] sm:max-w-[90vw] sm:gap-4">
						<img
							// biome-ignore lint/style/noNonNullAssertion: <>
							src={imageFiles[selectedImageIndex].preview!}
							alt={imageFiles[selectedImageIndex].file.name}
							className="max-h-[70vh] max-w-[95vw] rounded-lg object-contain shadow-2xl sm:max-h-[80vh] sm:max-w-[90vw]"
							onClick={(e) => e.stopPropagation()}
						/>
						<p className="max-w-[95vw] truncate rounded-md bg-black/70 px-3 py-1.5 text-center text-white text-xs backdrop-blur-sm sm:max-w-[90vw] sm:px-4 sm:py-2 sm:text-sm">
							{imageFiles[selectedImageIndex].file.name}
						</p>
					</div>
				</div>
			)}
		</>
	);
}
