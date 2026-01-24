import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type FileMetadata,
	type FileWithPreview,
	useFileUpload,
} from "@/hooks/use-file-upload";
import { deleteFile, uploadPublic } from "@/lib/storage";

const MAX_IMAGES = 6;

const DEFAULT_TRANSLATION_KEYS = {
	idMissing: "image_id_missing",
	failedUpload: "failed_to_upload_image",
	failedDelete: "failed_to_delete_image",
	uploadSuccess: "image_uploaded_successfully",
	deleteSuccess: "image_removed_successfully",
	maxImagesExceeded: "you_can_upload_up_to_6_images",
} as const;

interface UseEntityImageUploadOptions {
	initialImages?: FileMetadata[];
	onUpdateImages?: (images: FileMetadata[]) => Promise<void>;
	translationKeys?: Partial<typeof DEFAULT_TRANSLATION_KEYS>;
}

interface UploadResult {
	success: boolean;
	file?: FileWithPreview;
}

export function useEntityImageUpload({
	initialImages = [],
	onUpdateImages,
	translationKeys,
}: UseEntityImageUploadOptions = {}) {
	const t = useTranslations("common");
	const keys = { ...DEFAULT_TRANSLATION_KEYS, ...translationKeys };

	const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(
		new Map(),
	);

	// Convert FileWithPreview to FileMetadata
	const toFileMetadata = useCallback(
		(item: FileWithPreview): FileMetadata => ({
			key: item.id,
			// biome-ignore lint/style/noNonNullAssertion: <>
			url: item.preview!,
			name: item.file.name,
			size: item.file.size,
			type: item.file.type,
		}),
		[],
	);

	// Get current images as FileMetadata array
	const getCurrentImages = useCallback(
		(files: FileWithPreview[]): FileMetadata[] => files.map(toFileMetadata),
		[toFileMetadata],
	);

	const updateProgress = useCallback((fileId: string, progress: number) => {
		setUploadingFiles((prev) => new Map(prev).set(fileId, progress));
	}, []);

	const clearProgress = useCallback((fileId: string) => {
		setUploadingFiles((prev) => {
			const copy = new Map(prev);
			copy.delete(fileId);
			return copy;
		});
	}, []);

	// Notify parent component of image changes
	const notifyImageUpdate = useCallback(
		async (files: FileWithPreview[]) => {
			if (onUpdateImages) {
				await onUpdateImages(getCurrentImages(files));
			}
		},
		[onUpdateImages, getCurrentImages],
	);

	// Upload a single file
	const uploadSingleFile = async (
		fileItem: FileWithPreview,
	): Promise<UploadResult> => {
		if (!(fileItem.file instanceof File)) {
			clearProgress(fileItem.id);
			return { success: false };
		}

		try {
			fileItem.isUploading = true;
			updateProgress(fileItem.id, 25);

			const originalFile = fileItem.file;
			const { key, publicUrl } = await uploadPublic(originalFile);
			updateProgress(fileItem.id, 75);

			// Clean up old preview URL
			if (fileItem.preview) {
				URL.revokeObjectURL(fileItem.preview);
			}

			// Convert File to FileMetadata after successful upload
			const fileMetadata: FileMetadata = {
				key,
				url: publicUrl,
				name: originalFile.name,
				size: originalFile.size,
				type: originalFile.type,
			};

			// Update file item with upload results
			fileItem.file = fileMetadata;
			fileItem.preview = publicUrl;
			fileItem.id = key;
			fileItem.isUploading = false;
			fileItem.isUploaded = true;

			updateProgress(fileItem.id, 100);
			clearProgress(fileItem.id);

			return { success: true, file: fileItem };
		} catch (error) {
			fileItem.isUploading = false;
			clearProgress(fileItem.id);

			const errorMessage =
				error instanceof Error
					? error.message
					: t(keys.failedUpload, { fileName: fileItem.file.name });

			toast.error(errorMessage);
			console.error("Upload error:", errorMessage);

			return { success: false };
		}
	};

	// Handle multiple files being added
	const handleFilesAdded = async (
		addedFiles: FileWithPreview[],
		currentFiles: FileWithPreview[],
	) => {
		const uploadTasks = addedFiles.map((file) => uploadSingleFile(file));
		const results = await Promise.allSettled(uploadTasks);

		// Filter successful uploads
		const successfulUploads = results
			.filter(
				(result): result is PromiseFulfilledResult<UploadResult> =>
					result.status === "fulfilled" && result.value.success,
			)
			// biome-ignore lint/style/noNonNullAssertion: <>
			.map((result) => result.value.file!)
			.filter((file) => file.preview); // Ensure preview exists

		// Remove failed uploads from state
		const failedIds = results
			.map((result, index) => ({
				result,
				id: addedFiles[index]?.id,
			}))
			.filter(
				({ result }) => result.status === "fulfilled" && !result.value.success,
			)
			.map(({ id }) => id);

		// Report errors for failed uploads
		if (failedIds.length > 0) {
			const errorMessages = failedIds.map(
				(id) => `Failed to upload file: ${id}`,
			);
			actions.triggerError(errorMessages);
			failedIds.map((id) => actions.removeFile(id as string));
		}

		// Notify parent of successful uploads
		if (successfulUploads.length > 0) {
			const updatedFiles = [...currentFiles, ...successfulUploads];
			await notifyImageUpdate(updatedFiles);
		}
	};

	// Initialize file upload hook
	const [stateImages, actions] = useFileUpload({
		multiple: true,
		accept: "image/*",
		maxFiles: MAX_IMAGES,
		initialFiles: initialImages,
		onFilesAdded: (addedFiles) =>
			handleFilesAdded(addedFiles, stateImages.files),
	});

	// Compute current images from state
	const currentImages = useMemo<FileMetadata[]>(
		() => getCurrentImages(stateImages.files),
		[stateImages.files, getCurrentImages],
	);

	// Check if any uploads are in progress
	const isUploading = useMemo(
		() =>
			stateImages.files.some((f) => f.isUploading) || uploadingFiles.size > 0,
		[stateImages.files, uploadingFiles.size],
	);

	// Handle file removal
	const handleRemove = async (inputKey: string) => {
		if (!inputKey) {
			toast.error(t(keys.idMissing));
			return;
		}

		let keyToDelete = inputKey;

		// If key seems to be a URL, extract the path
		if (inputKey.startsWith("http://") || inputKey.startsWith("https://")) {
			try {
				const url = new URL(inputKey);
				// Remove leading slash if present
				const pathname = url.pathname.startsWith("/")
					? url.pathname.slice(1)
					: url.pathname;
				keyToDelete = pathname;
			} catch {
				console.warn("Failed to parse URL key", inputKey);
			}
		}

		try {
			await deleteFile(keyToDelete);
			actions.removeFile(inputKey);

			// Update parent with remaining files
			const remainingFiles = stateImages.files.filter((f) => f.id !== inputKey);
			await notifyImageUpdate(remainingFiles);

			toast.success("Image deleted successfully");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : t(keys.failedDelete);

			console.error("Delete failed:", errorMessage);
			toast.error(errorMessage);
		}
	};

	return {
		stateImages,
		actions: actions,
		handleRemove,
		handleFilesAdded: (files: FileWithPreview[]) =>
			handleFilesAdded(files, stateImages.files),
		MAX_IMAGES,
		isUploading,
		uploadProgress: uploadingFiles,
		currentImages,
	};
}
