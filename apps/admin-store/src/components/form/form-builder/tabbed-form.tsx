/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import type React from "react";
import { useCallback } from "react";
import type { FieldValues } from "react-hook-form";
import { FormProvider, useWatch } from "react-hook-form";
import { useTabManagement } from ".";
import {
	DEFAULT_NEXT_TEXT,
	DEFAULT_PREVIOUS_TEXT,
	DEFAULT_SUBMIT_BUTTON_TEXT,
	DEFAULT_SUBMITTING_TEXT,
	FORM_HEIGHT_CLASSES,
} from "./constants";
import { ItemsGrid } from "./items-grid";
import type { FormComponentProps, FormTabConfig } from "./types";
import { convertLegacyFieldsToItems } from "./utils";

// ============================================================================
// TAB HEADER COMPONENT
// ============================================================================

const TabHeader: React.FC<{
	tab: FormTabConfig<any>;
	hasErrors: boolean;
	t: (key: string) => string;
}> = ({ tab, hasErrors, t }) => (
	<TabsTrigger
		key={tab.key}
		value={tab.key}
		className={`relative text-sm ${
			hasErrors ? "data-[state=inactive]:text-destructive" : ""
		}`}
	>
		{t(tab.labelKey)}
		{hasErrors && (
			<span className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-destructive" />
		)}
	</TabsTrigger>
);

// ============================================================================
// TAB CONTENT COMPONENT
// ============================================================================

const TabContent: React.FC<{
	tab: FormTabConfig<any>;
	control: any;
	config: any;
	formValues: any;
	setValue: any;
	t: (key: string) => string;
}> = ({ tab, control, config, formValues, setValue, t }) => {
	const tabItems = convertLegacyFieldsToItems(tab.items, tab.fields);

	return (
		<TabsContent
			key={tab.key}
			value={tab.key}
			className="mt-0 flex-1 overflow-hidden"
		>
			<div className="h-full overflow-y-auto px-1">
				<div className="space-y-8 pb-6">
					{tab.descriptionKey && (
						<div>
							<p className="text-muted-foreground text-sm">
								{t(tab.descriptionKey)}
							</p>
						</div>
					)}
					<ItemsGrid
						items={tabItems}
						control={control}
						config={config}
						setValue={setValue}
						formValues={formValues}
						t={t}
					/>
				</div>
			</div>
		</TabsContent>
	);
};

// ============================================================================
// NAVIGATION FOOTER COMPONENT
// ============================================================================

const NavigationFooter: React.FC<{
	isFirstTab: boolean;
	isLastTab: boolean;
	isSubmitting: boolean;
	onPrevious: () => void;
	onNext: (e: React.MouseEvent<HTMLButtonElement>) => void; // Updated to accept event
	submitButtonText?: string;
	t: (key: string) => string;
}> = ({
	isFirstTab,
	isLastTab,
	isSubmitting,
	onPrevious,
	onNext,
	submitButtonText,
	t,
}) => {
	const getSubmitButtonText = (): string => {
		if (isSubmitting) {
			return t(DEFAULT_SUBMITTING_TEXT);
		}
		return submitButtonText
			? t(submitButtonText)
			: t(DEFAULT_SUBMIT_BUTTON_TEXT);
	};

	return (
		<div className="z-10 flex shrink-0 items-center justify-between border-t bg-background pt-6">
			<div className="flex gap-2">
				{!isFirstTab && (
					<Button
						type="button"
						variant="outline"
						onClick={onPrevious}
						className="min-w-[100px]"
					>
						← {t(DEFAULT_PREVIOUS_TEXT)}
					</Button>
				)}
			</div>
			<div className="flex gap-3">
				{!isLastTab ? (
					<Button type="button" onClick={onNext} className="min-w-[100px]">
						{t(DEFAULT_NEXT_TEXT)} →
					</Button>
				) : (
					<Button
						type="submit"
						disabled={isSubmitting}
						className="min-w-[120px]"
					>
						{getSubmitButtonText()}
					</Button>
				)}
			</div>
		</div>
	);
};

// ============================================================================
// TABBED FORM COMPONENT
// ============================================================================

export const TabbedForm = <T extends FieldValues>({
	config,
	form,
	handleSubmit,
	isSubmitting,
	className,
	t,
}: FormComponentProps<T>) => {
	const tabs = config.tabs || [];
	const formValues = useWatch({ control: form.control }) as T;

	const {
		activeTab,
		isFirstTab,
		isLastTab,
		getTabErrorStatus,
		goToNextTab: originalGoToNextTab, // Rename to avoid conflict
		goToPrevTab,
		handleTabChange,
		navigateToFirstErrorTab,
	} = useTabManagement(tabs, form, config);

	const goToNextTab = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			originalGoToNextTab();
		},
		[originalGoToNextTab],
	);

	const handleFormSubmit = useCallback(
		async (values: T) => {
			try {
				await handleSubmit(values);
			} catch (error) {
				console.error("Form submission error:", error);
				navigateToFirstErrorTab();
			}
		},
		[handleSubmit, navigateToFirstErrorTab],
	);

	const renderTabContent = (tab: FormTabConfig<T>) => (
		<TabContent
			key={`content-${tab.key}`}
			tab={tab}
			control={form.control}
			config={config}
			formValues={formValues}
			setValue={form.setValue}
			t={t}
		/>
	);

	if (tabs.length === 0) {
		console.warn("TabbedForm: No tabs provided");
		return null;
	}

	return (
		<FormProvider {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className={`flex ${FORM_HEIGHT_CLASSES} flex-col ${className}`}
			>
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="flex flex-1 flex-col"
				>
					{/* Tab Headers */}
					<div className="sticky top-0 z-10 mb-6 shrink-0 border-b bg-background pb-4">
						<TabsList className={`grid w-full grid-cols-${tabs.length}`}>
							{tabs.map((tab) => (
								<TabHeader
									key={`header-${tab.key}`}
									tab={tab}
									hasErrors={getTabErrorStatus(tab.key)}
									t={t}
								/>
							))}
						</TabsList>
					</div>

					{/* Tab Contents */}
					<div className="max-h-4/6 overflow-auto">
						{tabs.map(renderTabContent)}
					</div>

					{/* Navigation Footer */}
					<NavigationFooter
						isFirstTab={isFirstTab}
						isLastTab={isLastTab}
						isSubmitting={isSubmitting}
						onPrevious={goToPrevTab}
						onNext={goToNextTab}
						submitButtonText={config.submitButtonText}
						t={t}
					/>
				</Tabs>
			</form>
		</FormProvider>
	);
};
