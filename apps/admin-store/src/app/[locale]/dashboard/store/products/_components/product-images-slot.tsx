import { GalleryViewer } from "@/components/file-upload/gallery-viewer";
import { UploadZone } from "@/components/file-upload/upload-zone";
import type { SlotComponent } from "@/components/form/form-builder/types";
import { useEntityImageUpload } from "@/hooks/use-entity-image-upload";
import type { FileMetadata } from "@/hooks/use-file-upload";
import { useUpdateProduct } from "../hooks/use-update-product";
import type { ProductFormValues } from "./product-schema";

export const ProductImagesSlot: SlotComponent<ProductFormValues> = ({
	formValues,
	setValue,
}) => {
	const { mutateAsync: updateProduct } = useUpdateProduct();

	const handleSetThumbnail = (image: FileMetadata) => {
		setValue("thumbnailImage", image);
		const productId = formValues?.id;
		if (productId) {
			updateProduct({
				productId,
				data: { thumbnailImage: image },
			});
		}
	};

	const { stateImages, actions, handleRemove, isUploading } =
		useEntityImageUpload({
			initialImages: (formValues?.images as FileMetadata[] | undefined) ?? [],

			onUpdateImages: async (images) => {
				if (formValues?.id) {
					await updateProduct({
						productId: formValues.id,
						data: { images },
					});
				} else {
					// For new products, set the images in the form immediately
					setValue("images", images);
				}
			},
		});

	return (
		<div>
			<div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
				Product Images
			</div>
			<p className="mb-2 text-gray-500 text-xs dark:text-gray-400">
				You can upload up to 6 images.
			</p>
			<UploadZone
				state={stateImages}
				actions={actions}
				isUploading={isUploading}
			/>
			<GalleryViewer
				className="mt-4"
				files={stateImages.files}
				onRemove={handleRemove}
				onSetThumbnail={handleSetThumbnail}
				thumbnail={formValues?.thumbnailImage}
			/>
		</div>
	);
};
