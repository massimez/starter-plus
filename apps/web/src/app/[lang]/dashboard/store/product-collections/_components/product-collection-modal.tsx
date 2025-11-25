"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import type { ProductCollection } from "../hooks/use-product-collection";
import {
	ProductCollectionForm,
	type ProductCollectionFormValues,
} from "./product-collection-form";

interface ProductCollectionModalProps {
	collection?: ProductCollection;
	onOpenChange: (isOpen: boolean) => void;
	open: boolean;
	currentLanguage: string;
}

export const ProductCollectionModal = ({
	collection,
	open,
	onOpenChange,
	currentLanguage,
}: ProductCollectionModalProps) => {
	const queryClient = useQueryClient();
	const { data: activeOrganizationData } = useActiveOrganization();

	const isEdit = !!collection;

	// Find the translation for the current language
	const currentTranslation = collection?.translations?.find(
		(t) => t.languageCode === currentLanguage,
	);

	const initialValues: ProductCollectionFormValues = collection
		? {
				parentId: collection.parentId ?? null,
				translation: currentTranslation ?? {
					languageCode: currentLanguage,
					name: "",
					slug: "",
					description: "",
					metaTitle: "",
					metaDescription: "",
				},
				isActive: collection.isActive ?? true,
				isVisible: collection.isVisible ?? true,
				image: collection.image ?? null,
			}
		: {
				parentId: null,
				translation: {
					languageCode: currentLanguage,
					name: "",
					slug: "",
					description: "",
					metaTitle: "",
					metaDescription: "",
				},
				isActive: true,
				isVisible: true,
				image: null,
			};

	const onSubmit = async (values: ProductCollectionFormValues) => {
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}

		try {
			if (isEdit) {
				// Get existing translations
				const existingTranslations = collection.translations || [];

				// Find index of current language translation
				const existingIndex = existingTranslations.findIndex(
					(t) => t.languageCode === currentLanguage,
				);

				// Update or add the translation
				let updatedTranslations: NonNullable<ProductCollection["translations"]>;
				if (existingIndex !== -1) {
					// Update existing translation
					updatedTranslations = [...existingTranslations];
					updatedTranslations[existingIndex] = values.translation;
				} else {
					// Add new translation
					updatedTranslations = [...existingTranslations, values.translation];
				}

				await hc.api.store["product-collections"][":id"].$put({
					param: { id: collection.id },
					json: {
						parentId: values.parentId,
						translations: updatedTranslations,
						isActive: values.isActive,
						isVisible: values.isVisible,
						image: values.image,
					},
				});
				toast.success("Collection updated successfully!");
			} else {
				// Creating new collection
				await hc.api.store["product-collections"].$post({
					json: {
						parentId: values.parentId,
						name: values.translation.name,
						slug: values.translation.slug,
						organizationId: activeOrganizationData.id,
						translations: [values.translation],
						isActive: values.isActive,
						isVisible: values.isVisible,
						image: values.image,
					},
				});
				toast.success("Collection created successfully!");
			}

			queryClient.invalidateQueries({ queryKey: ["product-collections"] });
			onOpenChange(false);
		} catch (error) {
			toast.error("An error occurred");
			console.error(error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto md:min-w-[800px]">
				<DialogHeader>
					<DialogTitle>
						{isEdit
							? `Edit Collection: ${collection.name}`
							: "Create New Collection"}
					</DialogTitle>
					{isEdit && (
						<p className="text-muted-foreground text-sm">
							Editing {currentLanguage.toUpperCase()} translation
						</p>
					)}
				</DialogHeader>
				<ProductCollectionForm
					onSubmit={onSubmit}
					initialValues={initialValues}
					currentLanguage={currentLanguage}
				/>
			</DialogContent>
		</Dialog>
	);
};
