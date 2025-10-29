"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema } from "@workspace/server/schema";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { TabbedForm } from "@/components/form/form-builder/tabbed-form";
import type { FormBuilderConfig } from "@/components/form/form-builder/types";

const formSchema = insertLocationSchema
	.omit({ organizationId: true })
	.partial();
export type LocationFormValues = z.infer<typeof formSchema>;

type LocationFormProps = {
	initialValues?: LocationFormValues;
	onSubmit: (values: LocationFormValues) => Promise<void>;
	isSubmitting: boolean;
};

const LOCATION_TYPES = [
	{ value: "shop", label: "Shop" },
	{ value: "warehouse", label: "Warehouse" },
	{ value: "distribution_center", label: "Distribution Center" },
];

const COUNTRIES = [
	{ value: "dz", label: "Algeria" },
	{ value: "fr", label: "France" },
	{ value: "us", label: "United States" },
	{ value: "de", label: "Germany" },
];

const DEFAULT_VALUES: LocationFormValues = {
	name: "",
	locationType: "shop",
	isActive: true,
	isDefault: false,
};

const formConfig: FormBuilderConfig<LocationFormValues> = {
	schema: formSchema,
	defaultValues: DEFAULT_VALUES,
	gridLayout: true,
	tabs: [
		{
			key: "basic",
			labelKey: "Basic Info",
			items: [
				{
					itemType: "field",
					type: "text",
					name: "name",
					labelKey: "Name",
					placeholderKey: "Location Name",
					descriptionKey: "The name of the location.",
				},
				{
					itemType: "field",
					type: "text",
					name: "description",
					labelKey: "Description",
					placeholderKey: "Location Description",
				},
				{
					itemType: "field",
					type: "select",
					name: "locationType",
					labelKey: "Location Type",
					placeholderKey: "Select location type",
					options: LOCATION_TYPES,
				},
				// {
				// 	itemType: "field",
				// 	type: "number",
				// 	name: "capacity",
				// 	labelKey: "Capacity",
				// 	placeholderKey: "Capacity",
				// 	descriptionKey: "The maximum capacity of the location.",
				// },
				{
					itemType: "field",
					type: "switch",
					name: "isActive",
					labelKey: "Is Active",
					descriptionKey: "Whether the location is active.",
				},
				{
					itemType: "field",
					type: "switch",
					name: "isDefault",
					labelKey: "Is Default",
					descriptionKey: "Whether this is the default location.",
				},
			],
		},
		{
			key: "address",
			labelKey: "Address",
			descriptionKey: "Provide the complete address for this location.",
			items: [
				{
					itemType: "field",
					type: "text",
					name: "address.office",
					labelKey: "Office",
					placeholderKey: "Office",
					gridCols: 6,
				},
				{
					itemType: "field",
					type: "text",
					name: "address.building",
					labelKey: "Building",
					placeholderKey: "Building",
					gridCols: 6,
				},
				{
					itemType: "field",
					type: "text",
					name: "address.street",
					labelKey: "Street Address",
					placeholderKey: "Street Address",
				},
				{
					itemType: "field",
					type: "text",
					name: "address.city",
					labelKey: "City",
					placeholderKey: "City",
					gridCols: 6,
				},
				{
					itemType: "field",
					type: "text",
					name: "address.state",
					labelKey: "State",
					placeholderKey: "State",
					gridCols: 6,
				},
				{
					itemType: "field",
					type: "text",
					name: "address.zipCode",
					labelKey: "Zip Code",
					placeholderKey: "Zip Code",
					gridCols: 6,
				},
				{
					itemType: "field",
					type: "select",
					name: "address.country",
					labelKey: "Country",
					placeholderKey: "Select a country",
					options: COUNTRIES,
					gridCols: 6,
				},
			],
		},
		{
			key: "contact",
			labelKey: "Contact",
			descriptionKey: "Add contact details for this location.",
			items: [
				{
					itemType: "field",
					type: "text",
					name: "contactName",
					labelKey: "Contact Name",
					placeholderKey: "Contact Name",
				},
				{
					itemType: "field",
					type: "text",
					name: "contactEmail",
					labelKey: "Contact Email",
					placeholderKey: "Contact Email",
				},
				{
					itemType: "field",
					type: "text",
					name: "contactPhone",
					labelKey: "Contact Phone",
					placeholderKey: "Contact Phone",
				},
			],
		},
	],
};

export function LocationForm({
	initialValues,
	onSubmit,
	isSubmitting,
}: LocationFormProps) {
	const t = (c: string) => c;

	const form = useForm<LocationFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: initialValues || DEFAULT_VALUES,
		mode: "onChange",
	});

	return (
		<TabbedForm
			form={form}
			config={formConfig}
			handleSubmit={onSubmit}
			isSubmitting={isSubmitting}
			t={t}
			className=""
		/>
	);
}
