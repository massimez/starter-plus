"use client";

import { useTranslations } from "next-intl";
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
	const t = useTranslations("common");
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
					labelKey: "travel_fee_type",
					placeholderKey: "select_travel_fee_type",
					gridCols: 4,
					options: [
						{ value: "fixed", label: "fixed" },
						{ value: "per_km", label: "per_km" },
						{ value: "varies", label: "varies" },
						{ value: "start_at", label: "start_at" },
						{ value: "free", label: "free" },
					],
				},
				{
					name: "travelFeeValue",
					type: "number",
					labelKey: "travel_fee_value",
					placeholderKey: "enter_travel_fee_value",
					gridCols: 4,
				},
				{
					name: "travelFeeValueByKm",
					type: "number",
					labelKey: "travel_fee_value_by_km",
					placeholderKey: "enter_travel_fee_value_by_km",
					gridCols: 4,
				},
				{
					name: "maxTravelDistance",
					type: "number",
					labelKey: "max_travel_distance",
					placeholderKey: "enter_max_travel_distance",
					gridCols: 4,
				},
				{
					name: "minimumTravelFees",
					type: "number",
					labelKey: "minimum_travel_fees",
					placeholderKey: "enter_minimum_travel_fees",
					gridCols: 4,
				},
				{
					name: "travelFeesPolicyText",
					type: "textarea",
					labelKey: "travel_fees_policy_text",
					placeholderKey: "enter_travel_fees_policy_text",
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
					: Number(values.travelFeeValue),
			travelFeeValueByKm:
				values.travelFeeValueByKm === ""
					? undefined
					: Number(values.travelFeeValueByKm),
			maxTravelDistance:
				values.maxTravelDistance === ""
					? undefined
					: Number(values.maxTravelDistance),
			minimumTravelFees:
				values.minimumTravelFees === ""
					? undefined
					: Number(values.minimumTravelFees),
		};

		try {
			await updateOrganizationInfo({
				organizationId,
				organizationInfoId: organizationInfo.id,
				...parsedValues,
			});
			toast.success(t("travel_fees_updated_successfully"));
		} catch (error) {
			toast.error(t("failed_to_update_travel_fees"));
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
