"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { type DefaultValues, type FieldValues, useForm } from "react-hook-form";
import { SimpleForm } from "./simple-form";
import { TabbedForm } from "./tabbed-form";
import type { FormBuilderProps } from "./types";

// ============================================================================
// MAIN FORM BUILDER COMPONENT
// ============================================================================

export function FormBuilder<T extends FieldValues>({
	config,
	initialValues,
	onSubmit,
	isSubmitting = false,
	className = "",
	mode = "onBlur",
}: FormBuilderProps<T>) {
	// Simple translation function (replace with actual i18n implementation)
	const t = useCallback((key: string) => key, []);

	const form = useForm<T>({
		resolver: zodResolver(config.schema),
		defaultValues: {
			...config.defaultValues,
			...initialValues,
		} as DefaultValues<T>,
		mode,
	});

	const handleSubmit = useCallback(
		async (values: T) => {
			try {
				await onSubmit(values);
			} catch (error) {
				console.error("Form submission error:", error);
				throw error; // Re-throw to allow form components to handle it
			}
		},
		[onSubmit],
	);

	const isTabbed = Boolean(config.tabs?.length);

	const commonProps = {
		config,
		form,
		handleSubmit,
		isSubmitting,
		className,
		t,
	};

	if (!isTabbed) {
		return <SimpleForm {...commonProps} />;
	}

	return <TabbedForm {...commonProps} />;
}

// Re-export all types for convenience
export type * from "./types";
