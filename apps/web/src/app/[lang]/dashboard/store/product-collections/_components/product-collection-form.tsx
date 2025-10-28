"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Form,
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
import { Textarea } from "@workspace/ui/components/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { debounce, getSlug } from "@/lib/helpers";
import { useProductCollections } from "../hooks/use-product-collection";

// Simplified schema - single translation
const translationSchema = z.object({
	languageCode: z.string(),
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().optional(),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

const productCollectionFormSchema = z.object({
	parentId: z.string().nullable(),
	translation: translationSchema,
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
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* Parent Collection */}
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
								<SelectTrigger>
									<SelectValue placeholder="Select parent collection" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Top Level</SelectItem>
									{collections?.data?.map((col) => (
										<SelectItem key={col.id} value={col.id}>
											{col.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Translation Fields */}
				<div className="space-y-4 rounded-lg border p-4">
					<FormField
						control={form.control}
						name="translation.name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<Input
									placeholder="Enter collection name"
									{...field}
									onChange={(e) => {
										field.onChange(e);
										handleNameChange(e.target.value);
									}}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.slug"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Slug</FormLabel>
								<Input placeholder="Enter collection slug" {...field} />
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
								<Textarea
									placeholder="Enter collection description"
									{...field}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.metaTitle"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Meta Title</FormLabel>
								<Input placeholder="Enter meta title" {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.metaDescription"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Meta Description</FormLabel>
								<Textarea placeholder="Enter meta description" {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Saving..." : "Submit"}
				</Button>
			</form>
		</Form>
	);
}
