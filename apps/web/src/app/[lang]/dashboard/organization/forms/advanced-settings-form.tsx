"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { GalleryViewer } from "@/components/file-upload/gallery-viewer";
import { UploadZone } from "@/components/file-upload/upload-zone";
import {
	FormBuilder,
	type FormBuilderConfig,
} from "@/components/form/form-builder";
import { useFileUpload } from "@/hooks/use-file-upload";
import { deleteFile, uploadPublic } from "@/lib/storage";
import {
	useActiveOrganization,
	useGetOrganizationInfo,
	useUpdateOrganizationInfo,
} from "../queries";

const formSchema = z.object({
	taxRate: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid monetary value")
		.optional()
		.or(z.literal("")),
	defaultLanguage: z.string().optional(),
	activeLanguages: z.array(z.string()),
	images: z
		.array(
			z.object({
				key: z.string().optional(),
				url: z.string(),
				alt: z.string().optional(),
				type: z.string().optional(),
				itemType: z.string().optional(),
				name: z.string().optional(),
				size: z.number().optional(),
			}),
		)
		.optional(),
	socialLinks: z.any().optional(),
});

type AdvancedSettingsFormValues = z.infer<typeof formSchema>;

export function AdvancedSettingsForm() {
	const t = useTranslations("common");
	const { activeOrganization } = useActiveOrganization();

	const organizationId = activeOrganization?.id;

	const { data: organizationInfo, isLoading } = useGetOrganizationInfo(
		organizationId || "",
	);

	const { mutateAsync: updateOrganizationInfo, isPending } =
		useUpdateOrganizationInfo();
	const [stateImages, actions] = useFileUpload({
		multiple: true,
		accept: "image/*",
		maxFiles: 6,
		initialFiles:
			organizationInfo?.images?.map((img) => ({
				id: img.key ?? "",
				name: img.name ?? "",
				size: img.size ?? 0,
				type: img.type ?? "",
				url: img.url,
			})) || [],
		onFilesAdded: async (addedFiles) => {
			for (const f of addedFiles) {
				if (f.file instanceof File) {
					try {
						const url = await uploadPublic(f.file);
						// const { id } = await saveImageLink(url.publicUrl!);
						await updateOrganizationInfo({
							organizationId: organizationId!,
							organizationInfoId: organizationInfo?.id!,
							images: [
								...(organizationInfo?.images ?? []),
								...addedFiles.map((file) => ({
									key: url.key,
									url: url.publicUrl!,
									name: file.file.name,
									size: file.file.size,
									type: file.file.type,
								})),
							],
						});
						f.preview = url.publicUrl!;
						f.id = url.key;
					} catch (err) {
						console.error("Upload error:", err);
					}
				}
			}
		},
	});
	const handleRemove = async (id: string) => {
		try {
			await deleteFile(id);
			actions.removeFile(id);
			await updateOrganizationInfo({
				organizationId: organizationId!,
				organizationInfoId: organizationInfo?.id!,
				images: organizationInfo?.images!.filter((file) => file.key !== id),
			});
		} catch (err) {
			console.error("Delete failed:", err);
		}
	};
	const advancedSettingsFormConfig: FormBuilderConfig<AdvancedSettingsFormValues> =
		{
			schema: formSchema,
			defaultValues: {},
			gridLayout: true,
			items: [
				{
					name: "taxRate",
					labelKey: "tax_rate",
					itemType: "field",
					type: "text",
					gridCols: 6,
				},
				{
					name: "defaultLanguage",
					itemType: "field",
					type: "select",
					labelKey: "default_language",
					placeholderKey: "enter_default_language",
					gridCols: 6,

					options: [
						{ value: "en", label: "English" },
						{ value: "es", label: "Spanish" },
						{ value: "fr", label: "French" },
						{ value: "ar", label: "Arabic" },
						{ value: "kab", label: "Kabyle" },
					],
				},
				{
					name: "activeLanguages",
					itemType: "field",
					type: "multiselect",
					labelKey: "active_languages",
					placeholderKey: "enter_active_languages",
					gridCols: 6,

					options: [
						{ value: "en", label: "English" },
						{ value: "es", label: "Spanish" },
						{ value: "fr", label: "French" },
						{ value: "ar", label: "Arabic" },
						{ value: "kab", label: "Kabyle" },
					],
				},
				{
					itemType: "slot",
					slotId: "account-info",
					component: () => {
						return (
							<div>
								<div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
									{t("organization_images")}
								</div>
								<p className="mb-2 text-gray-500 text-xs dark:text-gray-400">
									{t("you_can_upload_up_to_6_images")}
								</p>
								<UploadZone state={stateImages} actions={actions} />
								<GalleryViewer
									className="mt-4"
									files={stateImages.files}
									onRemove={handleRemove}
								/>
							</div>
						);
					},
					gridCols: 12,
				},
			],
		};

	const initialValues = {
		taxRate: organizationInfo?.taxRate,
		defaultLanguage: organizationInfo?.defaultLanguage?.toString() ?? "",
		activeLanguages: (organizationInfo?.activeLanguages ?? []) as string[],
		images: organizationInfo?.images || [],
	};

	async function onSubmit(values: AdvancedSettingsFormValues) {
		if (!organizationId) {
			toast.error("Organization ID is missing.");
			return;
		}
		if (!organizationInfo?.id) {
			toast.error("Organization Info ID is missing.");
			return;
		}

		const filteredOrganizationInfo = Object.fromEntries(
			Object.entries(organizationInfo || {}).filter(
				([key, value]) =>
					value !== null && key !== "id" && key !== "organizationId",
			),
		);

		try {
			await updateOrganizationInfo({
				organizationId,
				organizationInfoId: organizationInfo.id,
				...filteredOrganizationInfo,
				...values,
			});
			toast.success(t("advanced_settings_updated_successfully"));
		} catch (error) {
			toast.error(t("failed_to_update_advanced_settings"));
			console.error("Failed to update advanced settings:", error);
		}
	}

	return (
		<FormBuilder
			config={advancedSettingsFormConfig}
			initialValues={initialValues}
			onSubmit={onSubmit}
			isSubmitting={isPending || isLoading}
		/>
	);
}
