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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { debounce, getSlug } from "@/lib/helpers";
import { useProductCollections } from "../hooks/use-product-collection";

import { CollectionImageSlot } from "./collection-image-slot";

// Simplified schema - single translation
const translationSchema = z.object({
	languageCode: z.string(),
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().optional(),
	metaTitle: z
		.string()
		.max(60, "Meta title should be under 60 characters")
		.optional(),
	metaDescription: z
		.string()
		.max(160, "Meta description should be under 160 characters")
		.optional(),
});

const productCollectionFormSchema = z.object({
	parentId: z.string().nullable(),
	translation: translationSchema,
	isActive: z.boolean().default(true),
	isVisible: z.boolean().default(true),
	sortOrder: z.coerce.number().default(0),
	image: z.string().nullable().optional(),
});

export type ProductCollectionFormValues = z.infer<
	typeof productCollectionFormSchema
>;

// Component
export function ProductCollectionForm({
	initialValues,
	onSubmit,
	currentLanguage,
}: {
	initialValues?: ProductCollectionFormValues;
	onSubmit: (values: ProductCollectionFormValues) => void;
	currentLanguage: string;
}) {
	const form = useForm({
		resolver: zodResolver(productCollectionFormSchema),
		defaultValues: initialValues ?? {
			parentId: null,
			translation: {
				languageCode: currentLanguage,
				name: "",
				slug: "",
				description: "",
				metaTitle: "",
				metaDescription: "",
			},
			isActive: true,
			isVisible: true,
			sortOrder: 0,
			image: null,
		},
	});

	const { data: collections } = useProductCollections(currentLanguage);

	const handleNameChange = (value: string) => {
		const slug = getSlug(value);
		debounce(() => {
			form.setValue("translation.slug", slug);
		}, 300)();
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px]">
					{/* Left Column: Main Content */}
					<div className="space-y-4">
						{/* General Info */}
						<Card>
							<CardHeader>
								<CardTitle>General Information</CardTitle>
								<CardDescription>
									Basic details about your collection
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="translation.name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input
													placeholder="e.g. Summer Collection"
													{...field}
													onChange={(e) => {
														field.onChange(e);
														handleNameChange(e.target.value);
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="translation.description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Describe this collection..."
													className="min-h-[60px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Media */}
						<Card>
							<CardHeader>
								<CardTitle>Media</CardTitle>
								<CardDescription>
									Add a cover image for this collection
								</CardDescription>
							</CardHeader>
							<CardContent>
								<CollectionImageSlot
									image={form.watch("image")}
									onImageChange={(url) => form.setValue("image", url)}
								/>
							</CardContent>
						</Card>

						{/* SEO */}
						<Card>
							<CardHeader>
								<CardTitle>Search Engine Optimization</CardTitle>
								<CardDescription>
									Optimize how this collection appears in search results
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="translation.metaTitle"
										render={({ field }) => (
											<FormItem>
												<div className="flex justify-between">
													<FormLabel>Meta Title</FormLabel>
													<span className="text-muted-foreground text-xs">
														{field.value?.length || 0}/60
													</span>
												</div>
												<FormControl>
													<Input placeholder="SEO Title" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="translation.metaDescription"
										render={({ field }) => (
											<FormItem>
												<div className="flex justify-between">
													<FormLabel>Meta Description</FormLabel>
													<span className="text-muted-foreground text-xs">
														{field.value?.length || 0}/160
													</span>
												</div>
												<FormControl>
													<Textarea
														placeholder="SEO Description"
														className="min-h-[80px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="translation.slug"
										render={({ field }) => (
											<FormItem>
												<FormLabel>URL Handle</FormLabel>
												<FormControl>
													<div className="flex rounded-md shadow-sm ring-offset-background">
														<span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-muted-foreground text-sm">
															/collections/
														</span>
														<Input
															className="rounded-l-none"
															placeholder="collection-slug"
															{...field}
														/>
													</div>
												</FormControl>
												<FormDescription>
													Unique identifier for the collection URL
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column: Settings */}
					<div className="space-y-4">
						{/* Organization */}
						<Card>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="parentId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Parent Collection</FormLabel>
											<Select
												onValueChange={(val) =>
													field.onChange(val === "none" ? null : val)
												}
												value={field.value ?? "none"}
											>
												<FormControl>
													<SelectTrigger className="min-w-52">
														<SelectValue placeholder="Select parent" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">Top Level</SelectItem>
													{collections?.flat?.map((col) => (
														<SelectItem key={col.id} value={col.id}>
															{col.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												Nest this collection under another
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="sortOrder"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Sort Order</FormLabel>
											<FormControl>
												<Input
													type="number"
													{...field}
													value={field.value as number}
													onChange={(e) =>
														field.onChange(e.target.valueAsNumber)
													}
												/>
											</FormControl>
											<FormDescription>
												Higher numbers appear later in the list
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						{/* Visibility */}
						<Card>
							<CardContent className="space-y-4">
								<FormField
									control={form.control}
									name="isActive"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
											<div className="space-y-0.5">
												<FormLabel>Active</FormLabel>
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
									name="isVisible"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
											<div className="space-y-0.5">
												<FormLabel>Visible</FormLabel>
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
					</div>
				</div>

				<div className="flex justify-end gap-4">
					<Button type="submit" disabled={form.formState.isSubmitting}>
						{form.formState.isSubmitting ? "Saving..." : "Save Collection"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
