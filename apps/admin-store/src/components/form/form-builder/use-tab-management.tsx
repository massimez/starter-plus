import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import type {
	FormBuilderConfig,
	FormBuilderItem,
	FormTabConfig,
} from "./types";
import { focusFirstError, hasFieldErrors } from "./utils";

// ============================================================================
// TAB MANAGEMENT HOOK
// ============================================================================

export const useTabManagement = <T extends FieldValues>(
	tabs: FormTabConfig<T>[],
	// biome-ignore lint/suspicious/noExplicitAny: <>
	form: any,
	config: FormBuilderConfig<T>,
) => {
	const [activeTab, setActiveTab] = useState(tabs[0]?.key || "");

	const getCurrentTabIndex = useCallback(
		() => tabs.findIndex((tab) => tab.key === activeTab),
		[tabs, activeTab],
	);

	const isFirstTab = getCurrentTabIndex() === 0;
	const isLastTab = getCurrentTabIndex() === tabs.length - 1;

	const getFieldNamesFromTab = useCallback(
		(tab: FormTabConfig<T>): string[] => {
			const allItems = tab.items || [];
			const fieldItems = allItems.filter(
				(item): item is FormBuilderItem<T> & { itemType: "field" } =>
					item.itemType === "field",
			);
			return fieldItems.map((field) => field.name as string);
		},
		[],
	);

	const validateCurrentTab = useCallback(async (): Promise<boolean> => {
		if (!config.validateOnTab) return true;

		const currentTab = tabs.find((tab) => tab.key === activeTab);
		if (!currentTab) return true;

		const fieldNames = getFieldNamesFromTab(currentTab);
		return await form.trigger(fieldNames);
	}, [tabs, activeTab, config.validateOnTab, form, getFieldNamesFromTab]);

	const getTabErrorStatus = useCallback(
		(tabKey: string): boolean => {
			const tab = tabs.find((t) => t.key === tabKey);
			if (!tab) return false;

			const errors = form.formState.errors;
			const fieldNames = getFieldNamesFromTab(tab);

			return fieldNames.some((fieldName) => hasFieldErrors(errors, fieldName));
		},
		[tabs, form.formState.errors, getFieldNamesFromTab],
	);

	const goToNextTab = useCallback(async () => {
		if (isLastTab) return;

		if (await validateCurrentTab()) {
			const nextIndex = getCurrentTabIndex() + 1;
			if (nextIndex < tabs.length) {
				// biome-ignore lint/style/noNonNullAssertion: <>
				setActiveTab(tabs[nextIndex]!.key);
			}
		} else {
			focusFirstError();
		}
	}, [isLastTab, validateCurrentTab, getCurrentTabIndex, tabs]);

	const goToPrevTab = useCallback(() => {
		if (!isFirstTab) {
			const prevIndex = getCurrentTabIndex() - 1;
			if (prevIndex >= 0) {
				// biome-ignore lint/style/noNonNullAssertion: <>
				setActiveTab(tabs[prevIndex]!.key);
			}
		}
	}, [isFirstTab, getCurrentTabIndex, tabs]);

	const handleTabChange = useCallback(
		async (newTab: string) => {
			if (newTab === activeTab) return;

			const newTabIndex = tabs.findIndex((tab) => tab.key === newTab);
			const isMovingForward = newTabIndex > getCurrentTabIndex();

			if (
				isMovingForward &&
				config.validateOnTab &&
				!(await validateCurrentTab())
			) {
				focusFirstError();
				return;
			}
			setActiveTab(newTab);
		},
		[
			activeTab,
			tabs,
			getCurrentTabIndex,
			config.validateOnTab,
			validateCurrentTab,
		],
	);

	const navigateToFirstErrorTab = useCallback(() => {
		for (const tab of tabs) {
			if (getTabErrorStatus(tab.key)) {
				setActiveTab(tab.key);
				break;
			}
		}
	}, [tabs, getTabErrorStatus]);

	return {
		activeTab,
		setActiveTab,
		isFirstTab,
		isLastTab,
		validateCurrentTab,
		getTabErrorStatus,
		goToNextTab,
		goToPrevTab,
		handleTabChange,
		navigateToFirstErrorTab,
	};
};
