"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { LOCALES } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import { removeNulls } from "@/lib/utils";
import { ProductForm, type ProductFormValues } from "./product-form";
import type { Product } from "./use-products";

interface ProductModalProps {
	product?: Product;
	onOpenChange: (isOpen: boolean) => void;
	open: boolean;
	selectedLanguage: string;
}

export const ProductModal = ({
	product,
	open,
	onOpenChange,
	selectedLanguage,
}: ProductModalProps) => {
	const queryClient = useQueryClient();
	const { data: activeOrganizationData } = useActiveOrganization();
	const isEdit = !!product;

	const languageName = LOCALES.find(
		(locale) => locale.code === selectedLanguage,
	)?.name;

	// Transform product data to match form schema
	const getInitialValues = (): Partial<ProductFormValues> | undefined => {
		if (!product) return undefined;

		// Convert translations array to record format
		const translationsRecord: Record<string, any> = {};

		if (product.translations && Array.isArray(product.translations)) {
			product.translations.forEach((translation: any) => {
				translationsRecord[translation.languageCode] = {
					name: translation.name || "",
					slug: translation.slug || "",
					shortDescription: translation.shortDescription,
					description: translation.description,
					brandName: translation.brandName,
					images: translation.images,
					seoTitle: translation.seoTitle,
					seoDescription: translation.seoDescription,
					tags: translation.tags,
				};
			});
		}

		return {
			...product,
			maxQuantity: product.maxQuantity ?? undefined,
			translations: translationsRecord,
			collectionId: product.collectionId || undefined,
		};
	};

	const onSubmit = async (values: ProductFormValues) => {
		console.log("ProductForm onSubmit triggered with values:", values);
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}
		try {
			const translationsPayload = Object.entries(values.translations || {}).map(
				([lang, translation]) => ({
					...translation,
					languageCode: lang,
				}),
			);

			if (isEdit) {
				const payload = removeNulls({
					...values,
					organizationId: activeOrganizationData.id,
					translations: translationsPayload,
				});
				if (values.images) payload.images = values.images;
				if (values.thumbnailImage)
					payload.thumbnailImage = values.thumbnailImage;

				console.log("Sending PUT request for product ID:", product.id);
				const response = await hc.api.store.products[":id"].$put({
					param: { id: product.id },
					json: payload,
				});

				if (!response.ok) {
					// Check if response is ok
					const errorData = await response.json();
					console.error("Update failed with error:", errorData);
					const errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: errorData.error?.message || "Failed to save product";
					toast.error(errorMessage);
					return;
				}

				toast.success("Product updated successfully");
			} else {
				// For new product, upload images first if any are present
				console.log("Creating new product with images:", values.images);
				let images: any[] = [];

				if (values.images && values.images.length > 0) {
					console.log("Processing images for upload...");
					console.log("All images:", values.images);

					const imageFilesToUpload = values.images.filter((img: any) => {
						const isTemp = img.key?.startsWith("temp-");
						const noUrl = img.url === "";

						return isTemp && noUrl;
					});
					console.log("Filtered images to upload:", imageFilesToUpload);

					if (imageFilesToUpload.length > 0) {
						const { uploadPublic } = await import("@/lib/storage");

						// Upload each temp image individually and collect results
						const uploadResults: any[] = [];

						for (let i = 0; i < imageFilesToUpload.length; i++) {
							const img = imageFilesToUpload[i];
							if (!img) continue;

							const file = (img as any).file;

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
								toast.error(`Failed to upload ${img.name}`);
								uploadResults.push(img); // Return original on failure
							}
						}

						// Replace temporary images with uploaded ones in the original array
						let uploadIndex = 0;
						images = values.images.map((img: any) => {
							if (img.key?.startsWith("temp-") && img.url === "") {
								const result = uploadResults[uploadIndex++];
								console.log(`Replacing temp image ${img.name} with:`, result);
								return result;
							}
							return img;
						});

						console.log("Final images array:", images);
					} else {
						console.log("No images need uploading");
						images = values.images;
					}
				} else {
					console.log("No images in values");
					images = values.images || [];
				}

				const payload = {
					...values,
					organizationId: activeOrganizationData.id,
					translations: translationsPayload,
				};

				if (images.length > 0) {
					payload.images = images;
				}

				console.log("Sending POST request for new product.");
				const response = await hc.api.store.products.$post({
					json: payload,
				});

				// Check if response is ok
				if (!response.ok) {
					const errorData = await response.json();
					console.error("Create failed with error:", errorData);
					const errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: errorData.error?.message || "Failed to save product";
					toast.error(errorMessage);
					return;
				}

				console.log("Product created successfully.");
				toast.success("Product created successfully");
			}
			onOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ["products"] });
		} catch (error) {
			console.error("Form submission caught an error:", error);
			toast.error("Failed to save product");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Product" : "Create Product"}
						{languageName && (
							<span className="ml-2 font-normal text-muted-foreground text-sm">
								({languageName})
							</span>
						)}
					</DialogTitle>
				</DialogHeader>
				<ProductForm
					onSubmit={onSubmit}
					initialValues={getInitialValues()}
					selectedLanguage={selectedLanguage}
				/>
			</DialogContent>
		</Dialog>
	);
};
