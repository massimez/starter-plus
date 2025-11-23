"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

import { Input } from "@workspace/ui/components/input";
import { Plus, Trash2, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { generateProductSku } from "@/lib/helpers";
import type { ProductFormValues } from "./product-schema";

export interface VariantOption {
	id: string;
	name: string;
	values: string[];
}

interface VariantOptionsProps {
	initialOptions?: VariantOption[];
	onOptionsChange?: (options: VariantOption[]) => void;
	selectedLanguage?: string;
}

export const VariantOptions = ({
	initialOptions = [],
	onOptionsChange,
	selectedLanguage,
}: VariantOptionsProps) => {
	const { setValue, watch } = useFormContext<ProductFormValues>();

	const generateCombinations = useCallback((arrays: string[][]): string[][] => {
		if (arrays.length === 0) return [];
		const firstArray = arrays[0];
		if (arrays.length === 1 && firstArray) {
			return firstArray.map((v) => [v]);
		}

		const [first, ...rest] = arrays;
		if (!first) return [];

		const restCombinations = generateCombinations(rest);

		const result: string[][] = [];
		for (const value of first) {
			for (const combination of restCombinations) {
				result.push([value, ...combination]);
			}
		}

		return result;
	}, []);

	const generateVariants = useCallback(
		(opts: VariantOption[]) => {
			// Filter options that have values
			const validOptions = opts.filter((opt) => opt.values.length > 0);

			if (validOptions.length === 0) {
				setValue("variants", []);
				return;
			}

			// Generate all combinations
			const combinations = generateCombinations(
				validOptions.map((opt) => opt.values),
			);

			// Get existing variants to preserve data
			const existingVariants = (watch("variants") || []) as Array<{
				id?: string;
				sku?: string;
				price?: number;
				cost?: number;
				compareAtPrice?: number;
				maxStock?: number;
				weightKg?: number;
				barcode?: string;
				isActive?: boolean;
				translations?: unknown[];
				optionValues?: Record<string, string>;
			}>;

			const productPrice = watch("price");
			const productCost = watch("cost");
			const productCompareAtPrice = watch("compareAtPrice");

			// Get available languages from product translations
			const productTranslations = watch("translations") || {};
			const availableLanguages = Object.keys(productTranslations);

			// Get product name for SKU generation
			let productName = "";
			if (selectedLanguage) {
				productName =
					watch(`translations.${selectedLanguage}.name`) ||
					watch("translations.en.name") ||
					"";
			} else {
				// Fallback: get first available translation
				const firstLang = availableLanguages[0];
				if (firstLang) {
					productName = productTranslations[firstLang]?.name || "";
				}
			}

			const variants = combinations.map((combination) => {
				// Create option values object
				const optionValues: Record<string, string> = {};
				validOptions.forEach((opt, optIdx) => {
					const value = combination[optIdx];
					if (value !== undefined) {
						optionValues[opt.name] = value;
					}
				});

				// Create a unique identifier for this combination
				const combinationKey = combination.join(" / ");

				// Check if this variant already exists
				const existing = existingVariants.find((v) => {
					const existingKey = validOptions
						.map((opt) => v.optionValues?.[opt.name] ?? "")
						.join(" / ");

					// Also try matching by displayName as fallback
					// biome-ignore lint/suspicious/noExplicitAny: displayName is added dynamically
					const displayNameMatch = (v as any).displayName === combinationKey;

					return existingKey === combinationKey || displayNameMatch;
				});

				// Generate SKU using helper function
				const generatedSku = generateProductSku(productName, combinationKey);

				// Prefill translations with the combination key for all available languages
				let translations = existing?.translations || [];
				if (translations.length === 0) {
					translations = availableLanguages.map((langCode) => ({
						languageCode: langCode,
						name: combinationKey,
						attributes: {},
					}));
				}

				return {
					id: existing?.id,
					sku: existing?.sku || generatedSku,
					price: existing?.price ?? productPrice ?? 0,
					cost: existing?.cost ?? productCost ?? 0,
					compareAtPrice:
						existing?.compareAtPrice ?? productCompareAtPrice ?? 0,
					maxStock: existing?.maxStock || 0,
					weightKg: existing?.weightKg,
					barcode: existing?.barcode,
					isActive: existing?.isActive ?? true,
					translations,
					optionValues, // Store the option values
					displayName: combinationKey, // For display purposes
				};
			});

			setValue("variants", variants);
		},
		[setValue, watch, generateCombinations, selectedLanguage],
	);

	const [options, setOptions] = useState<VariantOption[]>(initialOptions);
	const [newOptionName, setNewOptionName] = useState("");
	const [newOptionValue, setNewOptionValue] = useState<Record<string, string>>(
		{},
	);
	const hasInitialized = React.useRef(false);

	// Update options when initialOptions changes (e.g., when product data loads)
	React.useEffect(() => {
		if (initialOptions.length > 0 && !hasInitialized.current) {
			setOptions(initialOptions);
			hasInitialized.current = true;
			// Trigger variant generation with the initial options
			generateVariants(initialOptions);
		}
	}, [initialOptions, generateVariants]);

	const addOption = () => {
		if (!newOptionName.trim()) return;

		const newOption: VariantOption = {
			id: `option-${Date.now()}`,
			name: newOptionName.trim(),
			values: [],
		};

		const updatedOptions = [...options, newOption];
		setOptions(updatedOptions);
		setNewOptionName("");
		onOptionsChange?.(updatedOptions);
		generateVariants(updatedOptions);
	};

	const removeOption = (optionId: string) => {
		const updatedOptions = options.filter((opt) => opt.id !== optionId);
		setOptions(updatedOptions);
		onOptionsChange?.(updatedOptions);
		generateVariants(updatedOptions);
	};

	const addValue = (optionId: string) => {
		const value = newOptionValue[optionId]?.trim();
		if (!value) return;

		const updatedOptions = options.map((opt) => {
			if (opt.id === optionId) {
				return {
					...opt,
					values: [...opt.values, value],
				};
			}
			return opt;
		});

		setOptions(updatedOptions);
		setNewOptionValue((prev) => ({ ...prev, [optionId]: "" }));
		onOptionsChange?.(updatedOptions);
		generateVariants(updatedOptions);
	};

	const removeValue = (optionId: string, valueIndex: number) => {
		const updatedOptions = options.map((opt) => {
			if (opt.id === optionId) {
				return {
					...opt,
					values: opt.values.filter((_, idx) => idx !== valueIndex),
				};
			}
			return opt;
		});

		setOptions(updatedOptions);
		onOptionsChange?.(updatedOptions);
		generateVariants(updatedOptions);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Variant Options</CardTitle>
				<CardDescription>
					Create custom options like Size, Color, Material, etc. Variants will
					be automatically generated from all combinations.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* Add New Option */}
					<div className="flex gap-2">
						<Input
							placeholder="Option name (e.g., Size, Color, Material)"
							value={newOptionName}
							onChange={(e) => setNewOptionName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addOption();
								}
							}}
						/>
						<Button
							type="button"
							onClick={addOption}
							disabled={!newOptionName.trim()}
						>
							<Plus className="mr-2 h-4 w-4" />
							Add Option
						</Button>
					</div>

					{/* Options List */}
					{options.length > 0 && (
						<div className="space-y-4">
							{options.map((option) => (
								<div
									key={option.id}
									className="rounded-lg border border-border p-4"
								>
									<div className="mb-3 flex items-center justify-between">
										<h4 className="font-semibold text-sm">{option.name}</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => removeOption(option.id)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>

									{/* Option Values */}
									<div className="space-y-3">
										{option.values.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{option.values.map((value, idx) => (
													<Badge
														key={`${option.id}-${value}-${idx}`}
														variant="secondary"
														className="flex items-center gap-1"
													>
														{value}
														<button
															type="button"
															onClick={() => removeValue(option.id, idx)}
															className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
														>
															<X className="h-3 w-3" />
														</button>
													</Badge>
												))}
											</div>
										)}

										{/* Add Value Input */}
										<div className="flex gap-2">
											<Input
												placeholder={`Add ${option.name.toLowerCase()} value`}
												value={newOptionValue[option.id] || ""}
												onChange={(e) =>
													setNewOptionValue((prev) => ({
														...prev,
														[option.id]: e.target.value,
													}))
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														addValue(option.id);
													}
												}}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => addValue(option.id)}
												disabled={!newOptionValue[option.id]?.trim()}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Variants Preview */}
					{options.some((opt) => opt.values.length > 0) && (
						<div className="rounded-lg border border-border bg-muted/50 p-4">
							<h4 className="mb-2 font-semibold text-sm">
								Variants to be generated
							</h4>
							<p className="text-muted-foreground text-xs">
								{options.reduce(
									(total, opt) =>
										opt.values.length > 0
											? total === 0
												? opt.values.length
												: total * opt.values.length
											: total,
									0,
								)}{" "}
								variant(s) will be created from the combinations below.
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{(() => {
									const validOptions = options.filter(
										(opt) => opt.values.length > 0,
									);
									if (validOptions.length === 0) return null;

									const combinations = generateCombinations(
										validOptions.map((opt) => opt.values),
									);

									return combinations.slice(0, 10).map((combo) => (
										<Badge key={combo.join("-")} variant="outline">
											{combo.join(" / ")}
										</Badge>
									));
								})()}
								{(() => {
									const validOptions = options.filter(
										(opt) => opt.values.length > 0,
									);
									if (validOptions.length === 0) return null;

									const combinations = generateCombinations(
										validOptions.map((opt) => opt.values),
									);

									return combinations.length > 10 ? (
										<Badge variant="outline">
											+{combinations.length - 10} more...
										</Badge>
									) : null;
								})()}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
