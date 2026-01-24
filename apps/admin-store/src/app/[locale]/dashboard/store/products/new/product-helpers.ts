import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import type { ProductFormValues } from "../_components/product-schema";

export async function processImages(values: ProductFormValues) {
	if (!values.images || values.images.length === 0) {
		console.log("No images in values");
		return values.images || [];
	}

	console.log("Processing images for upload...");
	console.log("All images:", values.images);

	const imageFilesToUpload = values.images.filter((img) => {
		const isTemp = img.key?.startsWith("temp-");
		const noUrl = img.url === "";
		return isTemp && noUrl;
	});

	console.log("Filtered images to upload:", imageFilesToUpload);

	if (imageFilesToUpload.length === 0) {
		console.log("No images need uploading");
		return values.images;
	}

	const { uploadPublic } = await import("@/lib/storage");

	const uploadResults: NonNullable<ProductFormValues["images"]> = [];

	for (const img of imageFilesToUpload) {
		if (!img) continue;

		const file = img.file;

		console.log(`Processing ${img.name}:`, {
			key: img.key,
			hasFile: file instanceof File,
			fileInstance: file,
			fileSize: file?.size,
			fileType: file?.type,
		});

		if (!(file instanceof File)) {
			console.warn(
				`Cannot upload image ${img.name}: file reference not available`,
			);
			uploadResults.push(img); // Keep the original temp image
			continue;
		}

		try {
			console.log(`Uploading ${img.name}...`);
			const { key, publicUrl } = await uploadPublic(file);
			console.log(`Upload successful for ${img.name}:`, {
				key,
				publicUrl,
			});

			uploadResults.push({
				key,
				url: publicUrl,
				name: img.name,
				size: img.size,
				type: img.type,
			});
		} catch (error) {
			console.error(`Failed to upload ${img.name}:`, error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			toast.error(`Failed to upload ${img.name}: ${errorMessage}`);
			uploadResults.push(img); // Return original on failure
		}
	}

	// Replace temporary images with uploaded ones in the original array
	let uploadIndex = 0;
	const images = values.images.map((img) => {
		if (img.key?.startsWith("temp-") && img.url === "") {
			const result = uploadResults[uploadIndex++];
			console.log(`Replacing temp image ${img.name} with:`, result);
			return result;
		}
		return img;
	});

	console.log("Final images array:", images);
	return images;
}

export async function createVariants(
	productId: string,
	variants: ProductFormValues["variants"],
) {
	if (!variants || !Array.isArray(variants) || variants.length === 0) {
		return;
	}
	try {
		await Promise.all(
			variants.map(async (variant) => {
				const variantTranslations = variant.translations || [];

				if (variant.optionValues) {
					const languageCodes =
						variantTranslations.length > 0
							? variantTranslations.map((t) => t.languageCode)
							: ["en"];

					// Update or create translation for each language
					for (const langCode of languageCodes) {
						const existingTranslation = variantTranslations.find(
							(t) => t.languageCode === langCode,
						);

						if (existingTranslation) {
							// Only update attributes, keep the user-edited name
							existingTranslation.attributes = variant.optionValues;
						} else {
							// For new translations, use displayName as default
							variantTranslations.push({
								languageCode: langCode,
								name: variant.displayName || "",
								attributes: variant.optionValues,
							});
						}
					}
				}

				const cleanVariant = {
					...variant,
					price: variant.price.toString(),
					cost: variant.cost?.toString(),
					compareAtPrice: variant.compareAtPrice?.toString(),
					reorderPoint: variant.reorderPoint || 0,
					reorderQuantity: variant.reorderQuantity || 0,
					weightKg: variant.weightKg?.toString(),
					translations:
						variantTranslations.length > 0 ? variantTranslations : undefined,
				};

				// Remove frontend-only fields
				delete cleanVariant.displayName;
				delete cleanVariant.optionValues;

				await hc.api.store["product-variants"].$post({
					json: { ...cleanVariant, productId },
				});
			}),
		);
		console.log("Variants created successfully.");
	} catch (variantError) {
		console.error("Failed to create variants:", variantError);
		toast.error("Product created but failed to create variants");
	}
}
