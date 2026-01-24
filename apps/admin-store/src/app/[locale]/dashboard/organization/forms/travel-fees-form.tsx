"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	FormBuilder,
	type FormBuilderConfig,
} from "@/components/form/form-builder";
import {
	useActiveOrganization,
	useGetOrganizationInfo,
	useUpdateOrganizationInfo,
} from "../queries";

const formSchema = z.object({
	travelFeeType: z
		.enum(["fixed", "per_km", "varies", "start_at", "free"])
		.optional()
		.or(z.literal("")),
	travelFeeValue: z.string().optional().or(z.literal("")),
	travelFeeValueByKm: z.string().optional().or(z.literal("")),
	maxTravelDistance: z.string().optional().or(z.literal("")),
	travelFeesPolicyText: z.string().optional().or(z.literal("")),
	minimumTravelFees: z.string().optional().or(z.literal("")),
});

type TravelFeesFormValues = z.infer<typeof formSchema>;

export function TravelFeesForm() {
	// const t = useTranslations("common"); // removed
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data: organizationInfo, isLoading } = useGetOrganizationInfo(
		organizationId || "",
	);
	const { mutateAsync: updateOrganizationInfo, isPending } =
		useUpdateOrganizationInfo();

	const travelFeesFormConfig: FormBuilderConfig<TravelFeesFormValues> = useMemo(
		() => ({
			schema: formSchema,
			defaultValues: {
				travelFeeType: organizationInfo?.travelFeeType ?? "free",
				travelFeeValue: organizationInfo?.travelFeeValue?.toString() ?? "",
				travelFeeValueByKm:
					organizationInfo?.travelFeeValueByKm?.toString() ?? "",
				maxTravelDistance:
					organizationInfo?.maxTravelDistance?.toString() ?? "",
				travelFeesPolicyText: organizationInfo?.travelFeesPolicyText ?? "",
				minimumTravelFees:
					organizationInfo?.minimumTravelFees?.toString() ?? "",
			},
			gridLayout: true,
			fields: [
				{
					name: "travelFeeType",
					type: "select",
					labelKey: "Travel Fee Type",
					placeholderKey: "Select travel fee type",
					gridCols: 4,
					options: [
						{ value: "fixed", label: "Fixed" },
						{ value: "per_km", label: "Per KM" },
						{ value: "varies", label: "Varies" },
						{ value: "start_at", label: "Start At" },
						{ value: "free", label: "Free" },
					],
				},
				{
					name: "travelFeeValue",
					type: "number",
					labelKey: "Travel Fee Value",
					placeholderKey: "Enter travel fee value",
					gridCols: 4,
				},
				{
					name: "travelFeeValueByKm",
					type: "number",
					labelKey: "Travel Fee Value By KM",
					placeholderKey: "Enter travel fee value by km",
					gridCols: 4,
				},
				{
					name: "maxTravelDistance",
					type: "number",
					labelKey: "Max Travel Distance",
					placeholderKey: "Enter max travel distance",
					gridCols: 4,
				},
				{
					name: "minimumTravelFees",
					type: "number",
					labelKey: "Minimum Travel Fees",
					placeholderKey: "Enter minimum travel fees",
					gridCols: 4,
				},
				{
					name: "travelFeesPolicyText",
					type: "textarea",
					labelKey: "Travel Fees Policy Text",
					placeholderKey: "Enter travel fees policy text",
					gridCols: 12,
				},
			],
		}),
		[organizationInfo],
	);

	const initialValues = useMemo(
		() => ({
			travelFeeType: organizationInfo?.travelFeeType ?? "free",
			travelFeeValue: organizationInfo?.travelFeeValue?.toString() ?? "",
			travelFeeValueByKm:
				organizationInfo?.travelFeeValueByKm?.toString() ?? "",
			maxTravelDistance: organizationInfo?.maxTravelDistance?.toString() ?? "",
			travelFeesPolicyText: organizationInfo?.travelFeesPolicyText ?? "",
			minimumTravelFees: organizationInfo?.minimumTravelFees?.toString() ?? "",
		}),
		[organizationInfo],
	);

	async function onSubmit(values: TravelFeesFormValues) {
		if (!organizationId) {
			toast.error("Organization ID is missing.");
			return;
		}
		if (!organizationInfo?.id) {
			toast.error("Organization Info ID is missing.");
			return;
		}

		const parsedValues = {
			...values,
			travelFeeType:
				values.travelFeeType === "" ? undefined : values.travelFeeType,
			travelFeeValue:
				values.travelFeeValue === ""
					? undefined
					: Number(values.travelFeeValue).toString(),
			travelFeeValueByKm:
				values.travelFeeValueByKm === ""
					? undefined
					: Number(values.travelFeeValueByKm).toString(),
			maxTravelDistance:
				values.maxTravelDistance === ""
					? undefined
					: Number(values.maxTravelDistance),
			minimumTravelFees:
				values.minimumTravelFees === ""
					? undefined
					: Number(values.minimumTravelFees).toString(),
		};

		try {
			await updateOrganizationInfo({
				organizationId,
				organizationInfoId: organizationInfo.id,
				...parsedValues,
			});
			toast.success("Travel fees updated successfully");
		} catch (error) {
			toast.error("Failed to update travel fees");
			console.error("Failed to update travel fees:", error);
		}
	}

	return (
		<FormBuilder
			config={travelFeesFormConfig}
			initialValues={initialValues}
			onSubmit={onSubmit}
			isSubmitting={isPending || isLoading}
		/>
	);
}
