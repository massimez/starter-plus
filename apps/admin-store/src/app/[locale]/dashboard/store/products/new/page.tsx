"use client";

import { use } from "react";
import { toast } from "sonner";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { useActiveOrganization } from "@/lib/auth-client";
import { ProductEditForm } from "../_components/product-edit-form";
import type { ProductFormValues } from "../_components/product-schema";
import { useCreateProduct } from "../hooks/use-create-product";

export default function NewProductPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = use(params);
	const { data: activeOrganizationData } = useActiveOrganization();
	const selectedLanguage = locale || DEFAULT_LOCALE;
	const { mutateAsync: createProduct, isPending } = useCreateProduct(locale);

	const onSubmit = async (
		values: ProductFormValues,
		_deletedVariantIds: string[],
	) => {
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}

		try {
			await createProduct({
				...values,
				organizationId: activeOrganizationData.id,
			} as ProductFormValues);
		} catch (error) {
			console.error("Form submission caught an error:", error);
		}
	};

	return (
		<div className="p-6">
			<ProductEditForm
				onSubmit={onSubmit}
				selectedLanguage={selectedLanguage}
				isSubmitting={isPending}
			/>
		</div>
	);
}
