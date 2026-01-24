import { extractErrorMessage } from "@workspace/ui/lib/utils";
import { hc } from "./api-client";

interface UploadResult {
	key: string;
	publicUrl: string;
}

// Main upload function
export async function uploadPublic(file: File): Promise<UploadResult> {
	// Validate file
	if (!file || !(file instanceof File)) {
		throw new Error("Invalid file provided");
	}

	try {
		// Step 1: Get presigned URL
		const presignRes = await hc.api.storage.presign.$post({
			json: {
				fileName: file.name,
				contentType: file.type,
				visibility: "public",
				size: file.size,
			},
		});

		if (!presignRes.ok) {
			throw new Error("Failed to get presigned URL");
		}

		const { data } = await presignRes.json();

		// Validate presigned URL response
		if (!data?.url || !data.key || !data.publicUrl) {
			throw new Error("Invalid presigned URL response");
		}

		// Step 2: Upload file to presigned URL
		const uploadRes = await fetch(data.url, {
			method: "PUT",
			body: file,
			headers: {
				"Content-Type": file.type,
				...(typeof window !== "undefined" && {
					Origin: window.location.origin,
				}),
			},
		});

		if (!uploadRes.ok) {
			const errorDetail = await extractErrorMessage(uploadRes);
			throw new Error(`Failed to upload file: ${errorDetail}`);
		}

		return {
			key: data.key,
			publicUrl: data.publicUrl,
		};
	} catch (error) {
		// Enhanced error logging
		console.error("Error in uploadPublic:", {
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
			error: error instanceof Error ? error.message : String(error),
		});

		// Check for specific error messages
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("Storage limit exceeded")) {
			throw new Error(
				"Storage limit exceeded. Please contact your administrator.",
			);
		}

		// Re-throw with context
		throw new Error(
			`File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

export async function deleteFile(key: string): Promise<boolean> {
	if (!key || typeof key !== "string") {
		throw new Error("Invalid file key provided");
	}

	try {
		const res = await hc.api.storage[":key"].$delete({
			param: { key: encodeURIComponent(key) },
		});

		if (!res.ok) {
			const errorDetail = await extractErrorMessage(res);

			throw new Error(`Failed to delete file: ${errorDetail}`);
		}

		return true;
	} catch (error) {
		console.error("Error in deleteFile:", {
			key,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}
