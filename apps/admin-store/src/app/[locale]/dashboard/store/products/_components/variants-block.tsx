import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { type Path, useFieldArray, useFormContext } from "react-hook-form";
import type {
	ProductFormValues,
	ProductVariantFormValues,
} from "./product-schema";

interface VariantsBlockProps {
	onVariantRemove?: (variantId: string) => void;
	selectedLanguage: string;
}

export const VariantsBlock = ({
	onVariantRemove,
	selectedLanguage,
}: VariantsBlockProps) => {
	const { control, watch } = useFormContext<ProductFormValues>();
	const { fields, append, remove } = useFieldArray({
		control,
		name: "variants",
	});

	const [expandedVariantIndex, setExpandedVariantIndex] = useState<
		number | null
	>(null);

	const toggleExpand = (index: number) => {
		setExpandedVariantIndex(expandedVariantIndex === index ? null : index);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Variants</CardTitle>
				<CardDescription>
					Manage product variants, including size, color, and stock.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="overflow-x-auto rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[50px]" />
									<TableHead>Variant</TableHead>
									<TableHead className="w-[200px]">Price</TableHead>
									<TableHead className="w-[150px]">SKU</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{fields.map((field, index) => (
									<Fragment key={field.id}>
										<TableRow className="group">
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0"
													onClick={() => toggleExpand(index)}
													type="button"
												>
													{expandedVariantIndex === index ? (
														<ChevronUp className="h-4 w-4" />
													) : (
														<ChevronDown className="h-4 w-4" />
													)}
												</Button>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded border bg-muted">
														<span className="font-medium text-muted-foreground text-xs">
															{field.displayName
																?.split("/")[0]
																?.trim()
																?.charAt(0)
																?.toUpperCase() || "V"}
														</span>
													</div>
													<div>
														<div className="font-medium text-sm">
															{field.displayName || "Manual Variant"}
														</div>
														{field.optionValues && (
															<div className="mt-0.5 text-muted-foreground text-xs">
																{Object.entries(field.optionValues)
																	.map(([key, value]) => `${key}: ${value}`)
																	.join(" • ")}
															</div>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<FormField
													control={control}
													name={
														`variants.${index}.price` as Path<ProductFormValues>
													}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Input
																	{...field}
																	value={(field.value as number) ?? ""}
																	type="number"
																	step="0.01"
																	placeholder="0.00"
																	className="h-9"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</TableCell>
											<TableCell>
												<FormField
													control={control}
													name={
														`variants.${index}.sku` as Path<ProductFormValues>
													}
													render={({ field }) => (
														<FormItem>
															<FormControl>
																<Input
																	{...field}
																	value={(field.value as string) ?? ""}
																	placeholder="SKU-001"
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														// Get the actual variant data (not the field metadata)
														const variants = watch("variants");
														const variantData = variants?.[index];
														const databaseId = variantData?.id;

														if (databaseId && onVariantRemove) {
															onVariantRemove(databaseId);
														}
														remove(index);
													}}
													className="text-destructive opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
													type="button"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
										{expandedVariantIndex === index && (
											<TableRow>
												<TableCell colSpan={5} className="bg-muted/30 p-6">
													<div className="space-y-4">
														<div className="grid grid-cols-3 gap-4">
															<FormField
																control={control}
																name={
																	`variants.${index}.translations` as Path<ProductFormValues>
																}
																render={({ field }) => {
																	const translations =
																		(field.value as ProductVariantFormValues["translations"]) ||
																		[];
																	const currentTranslation = translations.find(
																		// biome-ignore lint/suspicious/noExplicitAny: <>
																		(t: any) =>
																			t.languageCode === selectedLanguage,
																	);
																	const currentName =
																		currentTranslation?.name || "";

																	return (
																		<FormItem>
																			<FormLabel>
																				Variant Name (
																				{selectedLanguage.toUpperCase()})
																			</FormLabel>
																			<FormControl>
																				<Input
																					value={currentName}
																					onChange={(e) => {
																						const newTranslations: ProductVariantFormValues["translations"] =
																							[...translations];
																						const existingIndex =
																							newTranslations.findIndex(
																								// biome-ignore lint/suspicious/noExplicitAny: <>
																								(t: any) =>
																									t.languageCode ===
																									selectedLanguage,
																							);

																						if (
																							existingIndex >= 0 &&
																							newTranslations[existingIndex]
																						) {
																							newTranslations[existingIndex] = {
																								...newTranslations[
																									existingIndex
																								],
																								name: e.target.value,
																							};
																						} else {
																							newTranslations.push({
																								languageCode: selectedLanguage,
																								name: e.target.value,
																								attributes:
																									currentTranslation?.attributes ||
																									{},
																							});
																						}

																						field.onChange(newTranslations);
																					}}
																					placeholder="e.g., Red / Large"
																				/>
																			</FormControl>
																			<FormMessage />
																		</FormItem>
																	);
																}}
															/>
															<FormField
																control={control}
																name={
																	`variants.${index}.compareAtPrice` as Path<ProductFormValues>
																}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Compare At Price</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																				value={(field.value as number) ?? ""}
																				type="number"
																				step="0.01"
																				placeholder="0.00"
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={control}
																name={
																	`variants.${index}.cost` as Path<ProductFormValues>
																}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Cost</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																				value={(field.value as number) ?? ""}
																				type="number"
																				step="0.01"
																				placeholder="0.00"
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>
														<div className="grid grid-cols-3 gap-4">
															<FormField
																control={control}
																name={
																	`variants.${index}.barcode` as Path<ProductFormValues>
																}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Barcode</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																				value={(field.value as string) ?? ""}
																				placeholder="123456789"
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={control}
																name={
																	`variants.${index}.weightKg` as Path<ProductFormValues>
																}
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Weight (kg)</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																				value={(field.value as number) ?? ""}
																				type="number"
																				step="0.01"
																				placeholder="0.00"
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={control}
																name={
																	`variants.${index}.isActive` as Path<ProductFormValues>
																}
																render={({ field }) => (
																	<FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
																		<div className="space-y-0.5">
																			<FormLabel className="text-sm">
																				Active
																			</FormLabel>
																		</div>
																		<FormControl>
																			<Switch
																				checked={field.value as boolean}
																				onCheckedChange={field.onChange}
																			/>
																		</FormControl>
																	</FormItem>
																)}
															/>
														</div>
													</div>
												</TableCell>
											</TableRow>
										)}
									</Fragment>
								))}
							</TableBody>
						</Table>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-2"
						onClick={() =>
							append({
								sku: "",
								price: watch("price") || 0,
								cost: watch("cost") || 0,
								compareAtPrice: watch("compareAtPrice") || 0,
								maxStock: 0,
								isActive: true,
								translations: [],
							})
						}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Variant
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};
