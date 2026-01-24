import { useEffect } from "react";
import { GalleryViewer } from "@/components/file-upload/gallery-viewer";
import { UploadZone } from "@/components/file-upload/upload-zone";
import { useEntityImageUpload } from "@/hooks/use-entity-image-upload";
import type { FileMetadata } from "@/hooks/use-file-upload";

interface CollectionImageSlotProps {
	image?: string | null;
	onImageChange: (url: string | null) => void;
}

export function CollectionImageSlot({
	image,
	onImageChange,
}: CollectionImageSlotProps) {
	const initialImages: FileMetadata[] = image
		? [
				{
					key: image, // Use URL as key for existing images if no ID available
					url: image,
					name: "Collection Image",
					size: 0,
					type: "image/jpeg",
				},
			]
		: [];

	const { stateImages, actions, handleRemove, isUploading } =
		useEntityImageUpload({
			initialImages,
			onUpdateImages: async (images) => {
				// We only care about the first image for collections
				const firstImage = images[0];
				onImageChange(firstImage?.url ?? null);
			},
		});

	// Enforce single image limit
	useEffect(() => {
		if (stateImages.files.length > 1) {
			// Keep only the last added file
			const lastFile = stateImages.files[stateImages.files.length - 1];
			if (lastFile) {
				// Remove others
				stateImages.files.forEach((f) => {
					if (f.id !== lastFile.id) {
						actions.removeFile(f.id);
					}
				});
			}
		}
	}, [stateImages.files, actions]);

	return (
		<div>
			<div className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
				Collection Image
			</div>
			<UploadZone
				state={stateImages}
				actions={actions}
				isUploading={isUploading}
			/>
			<GalleryViewer
				className="mt-4"
				files={stateImages.files}
				onRemove={handleRemove}
				// Collections don't have separate thumbnail concept, so we disable this
				onSetThumbnail={() => {}}
				thumbnail={undefined}
			/>
		</div>
	);
}
