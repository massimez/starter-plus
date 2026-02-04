"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Languages } from "lucide-react";
import React, { useState } from "react";
import { type Path, useForm } from "react-hook-form";
import { toast } from "sonner";
import { LOCALES } from "@/constants/locales";
import { getSlug } from "@/lib/helpers";
import { CollectionMultiSelector } from "../../_components/collection-multi-selector";
import { useProductCollections } from "../../product-collections/hooks/use-product-collection";
import { ProductImagesSlot } from "./product-images-slot";
import { type ProductFormValues, productFormSchema } from "./product-schema";
import { type VariantOption, VariantOptions } from "./variant-options";
import { VariantsBlock } from "./variants-block";

// ... imports

interface ProductEditFormProps {
	initialValues?: Partial<ProductFormValues>;
	initialOptions?: VariantOption[];
	onSubmit: (
		values: ProductFormValues,
		deletedVariantIds: string[],
	) => Promise<void>;
	selectedLanguage: string;
	brands?: Array<{ id: string; name: string }>;
	isSubmitting?: boolean;
}

export function ProductEditForm({
	initialValues,
	initialOptions,
	onSubmit,
	selectedLanguage,
	brands = [],
	isSubmitting = false,
}: ProductEditFormProps) {
	const { data: collectionsResponse, isLoading: isLoadingCollections } =
		useProductCollections(selectedLanguage);

	console.log("ProductEditForm debug:", {
		selectedLanguage,
		collectionsResponse,
		isLoadingCollections,
		flatLength: collectionsResponse?.flat?.length,
	});

	const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
	const [editingLanguage, setEditingLanguage] = useState(selectedLanguage);

	// Keep a stable reference to the original variant IDs from the database
	// This won't change even if the form regenerates variants
	const originalVariantIdsRef = React.useRef<Set<string>>(
		new Set(
			(initialValues?.variants?.map((v) => v.id).filter(Boolean) as string[]) ||
				[],
		),
	);

	const handleVariantRemove = (variantId: string) => {
		// Only track for deletion if this variant was in the original data from database
		const existsInDatabase = originalVariantIdsRef.current.has(variantId);
		if (existsInDatabase) {
			setDeletedVariantIds((prev) => {
				const updated = [...prev, variantId];
				return updated;
			});
		}
	};

	const form = useForm<ProductFormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: zodResolver type inference issue with complex schema
		resolver: zodResolver(productFormSchema) as any,
		defaultValues: {
			status: "draft",
			type: "simple",
			taxRate: "0.00",
			minQuantity: 1,
			isFeatured: false,
			trackStock: true,
			allowBackorders: true,

			price: 0,
			cost: 0,
			compareAtPrice: 0,
			...initialValues,
			translations: initialValues?.translations || {},
		},
	});

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(
					(values) => onSubmit(values, deletedVariantIds),
					(errors) => {
						console.error("Form validation errors:", errors);
						toast.error("Please check the form for errors");
					},
				)}
				className="space-y-8 pb-10"
			>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<h1 className="font-bold text-2xl">
							{initialValues?.id ? "Edit Product" : "Add Product"}
						</h1>
					</div>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						{/* Language Selector */}
						<div className="order-2 flex items-center gap-2 sm:order-0">
							<Languages className="h-4 w-4 text-muted-foreground" />
							<Select
								value={editingLanguage}
								onValueChange={setEditingLanguage}
							>
								<SelectTrigger className="w-full sm:w-[140px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LOCALES.map((locale) => (
										<SelectItem key={locale.code} value={locale.code}>
											{locale.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="order-1 grid w-full grid-cols-2 gap-3 sm:order-0 sm:flex sm:w-auto">
							<Button
								type="button"
								variant="outline"
								onClick={() => window.history.back()}
								className="w-full sm:w-auto"
							>
								Discard
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="w-full sm:w-auto"
							>
								{isSubmitting ? "Saving..." : "Save Product"}
							</Button>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div className="space-y-8 lg:col-span-2">
						{/* General Info */}
						<Card>
							<CardHeader>
								<CardTitle>Product Information</CardTitle>
								<CardDescription>
									Basic information about your product
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									key={`${editingLanguage}-name`}
									control={form.control}
									name={
										`translations.${editingLanguage}.name` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g. Premium T-Shirt"
													onChange={(e) => {
														field.onChange(e);
														const slug = getSlug(e.target.value);
														form.setValue(
															`translations.${editingLanguage}.slug` as Path<ProductFormValues>,
															slug,
															{ shouldValidate: true },
														);
													}}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									key={`${editingLanguage}-description`}
									control={form.control}
									name={
										`translations.${editingLanguage}.description` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Detailed product description..."
													className="min-h-[120px]"
													{...field}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									key={`${editingLanguage}-shortDescription`}
									control={form.control}
									name={
										`translations.${editingLanguage}.shortDescription` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Short Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Brief summary..."
													className="min-h-[40px]"
													{...field}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Pricing */}
						<Card>
							<CardHeader>
								<CardTitle>Pricing</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="price"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Price</FormLabel>
												<FormControl>
													<Input type="number" step="0.01" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="compareAtPrice"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Compare at Price</FormLabel>
												<FormControl>
													<Input type="number" step="0.01" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="cost"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Cost per Item</FormLabel>
												<FormControl>
													<Input type="number" step="0.01" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="taxRate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Tax Rate (%)</FormLabel>
												<FormControl>
													<Input type="number" step="0.01" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Variant Options */}
						<VariantOptions
							initialOptions={initialOptions}
							selectedLanguage={editingLanguage}
						/>

						{/* Variants */}
						<VariantsBlock
							onVariantRemove={handleVariantRemove}
							selectedLanguage={editingLanguage}
						/>

						{/* Media */}
						<Card>
							<CardHeader>
								<CardTitle>Media</CardTitle>
							</CardHeader>
							<CardContent>
								<ProductImagesSlot
									slotId="product-images"
									formValues={form.getValues()}
									setValue={form.setValue}
									t={(key) => key}
								/>
							</CardContent>
						</Card>

						{/* Inventory */}
						<Card>
							<CardHeader>
								<CardTitle>Inventory</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="minQuantity"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Min Quantity</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(e.target.value, 10),
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="maxQuantity"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Max Quantity</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														onChange={(e) =>
															field.onChange(
																e.target.value
																	? Number.parseInt(e.target.value, 10)
																	: undefined,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="flex flex-col gap-4">
									<FormField
										control={form.control}
										name="trackStock"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">
														Track Stock
													</FormLabel>
													<FormDescription>
														Track inventory for this product
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="allowBackorders"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">
														Allow Backorders
													</FormLabel>
													<FormDescription>
														Allow customers to purchase when out of stock
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="space-y-8">
						{/* Status */}
						<Card>
							<CardHeader>
								<CardTitle>Status</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Product Status</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="draft">Draft</SelectItem>
													<SelectItem value="active">Active</SelectItem>
													<SelectItem value="inactive">Inactive</SelectItem>
													<SelectItem value="archived">Archived</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Product Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="simple">Simple Product</SelectItem>
													<SelectItem value="variable">
														Variable Product
													</SelectItem>
													<SelectItem value="digital">
														Digital Product
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="isFeatured"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
											<div className="space-y-0.5">
												<FormLabel className="text-base">Featured</FormLabel>
											</div>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Organization */}
						<Card>
							<CardHeader>
								<CardTitle>Organization</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="brandId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Brand</FormLabel>
											<Select
												onValueChange={(val) =>
													field.onChange(val === "no-brand" ? null : val)
												}
												defaultValue={field.value || "no-brand"}
											>
												<FormControl>
													<SelectTrigger className="w-60">
														<SelectValue placeholder="Select brand" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="no-brand">No Brand</SelectItem>
													{brands.map((brand) => (
														<SelectItem key={brand.id} value={brand.id}>
															{brand.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="collectionIds"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Collections</FormLabel>
											<FormControl>
												<CollectionMultiSelector
													collections={collectionsResponse?.data || []}
													selectedIds={field.value || []}
													onChange={field.onChange}
													disabled={isLoadingCollections}
													placeholder={
														isLoadingCollections
															? "Loading..."
															: "Select collections..."
													}
													emptyIndicator={
														isLoadingCollections
															? "Loading collections..."
															: "No collections found."
													}
												/>
											</FormControl>
											<FormDescription>
												Assign this product to one or more collections
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									key={`${editingLanguage}-tags`}
									control={form.control}
									name={
										`translations.${editingLanguage}.tags` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tags</FormLabel>
											<FormControl>
												<Input
													placeholder="comma, separated, tags"
													{...field}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* SEO */}
						<Card>
							<CardHeader>
								<CardTitle>SEO</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									key={`${editingLanguage}-slug`}
									control={form.control}
									name={
										`translations.${editingLanguage}.slug` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Slug</FormLabel>
											<FormControl>
												<Input
													placeholder="premium-t-shirt"
													{...field}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormDescription>
												URL-friendly version of the name
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									key={`${editingLanguage}-seoTitle`}
									control={form.control}
									name={
										`translations.${editingLanguage}.seoTitle` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>SEO Title</FormLabel>
											<FormControl>
												<Input
													placeholder=""
													{...field}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									key={`${editingLanguage}-seoDescription`}
									control={form.control}
									name={
										`translations.${editingLanguage}.seoDescription` as Path<ProductFormValues>
									}
									render={({ field }) => (
										<FormItem>
											<FormLabel>SEO Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder=""
													{...field}
													value={(field.value as string) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>
					</div>
				</div>
			</form>
		</Form>
	);
}
