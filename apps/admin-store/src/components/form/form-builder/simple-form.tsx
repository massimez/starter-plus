"use client";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { FormProvider, useWatch } from "react-hook-form";
import {
	DEFAULT_SUBMIT_BUTTON_TEXT,
	DEFAULT_SUBMITTING_TEXT,
} from "./constants";
import { ItemsGrid } from "./items-grid";
import type {
	FormBuilderConfig,
	FormBuilderItem,
	FormComponentProps,
} from "./types";
import { convertLegacyFieldsToItems } from "./utils";

// ============================================================================
// SIMPLE FORM COMPONENT
// ============================================================================

export const SimpleForm = <T extends FieldValues>({
	config,
	form,
	handleSubmit,
	isSubmitting,
	className,
	t,
}: FormComponentProps<T>) => {
	const formValues = useWatch({ control: form.control }) as T;

	const formItems = useMemo(
		() => convertLegacyFieldsToItems(config.items, config.fields),
		[config.items, config.fields],
	);

	const getSubmitButtonText = (): string => {
		if (isSubmitting) {
			return t(DEFAULT_SUBMITTING_TEXT);
		}
		return config.submitButtonText
			? t(config.submitButtonText)
			: t(DEFAULT_SUBMIT_BUTTON_TEXT);
	};

	return (
		<FormProvider {...form}>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className={`space-y-6 ${className}`}
				>
					<ItemsGrid
						items={formItems as FormBuilderItem<FieldValues>[]}
						control={form.control}
						config={config as FormBuilderConfig<FieldValues>}
						formValues={formValues}
						setValue={form.setValue}
						t={t}
					/>

					<div className="flex justify-end pt-6">
						<Button type="submit" disabled={isSubmitting}>
							{getSubmitButtonText()}
						</Button>
					</div>
				</form>
			</Form>
		</FormProvider>
	);
};
