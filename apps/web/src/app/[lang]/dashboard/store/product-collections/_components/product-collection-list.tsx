"use client";

import { Button } from "@workspace/ui/components/button";
import { DeleteDropdownMenuItem } from "@workspace/ui/components/delete-confirmation-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { LOCALES } from "@/constants/locales";
import { useDeleteProductCollection } from "../hooks/use-delete-product-collection";
import {
	type ProductCollection,
	useProductCollections,
} from "../hooks/use-product-collection";
import { ProductCollectionModal } from "./product-collection-modal";

const getTranslation = (
	collection: ProductCollection,
	lang: string,
	field: "name" | "description",
) =>
	collection.translations?.find((t) => t.languageCode === lang)?.[field] || "-";

export function ProductCollectionList({
	selectedLanguage,
	setSelectedLanguage,
}: {
	selectedLanguage: string;
	setSelectedLanguage: (lang: string) => void;
}) {
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		collection?: ProductCollection;
	}>({ isOpen: false });

	const { data: collectionsData, isLoading } =
		useProductCollections(selectedLanguage);
	const { deleteCollection, isDeletingCollection } =
		useDeleteProductCollection(selectedLanguage);

	const openModal = (collection?: ProductCollection) =>
		setModalState({ isOpen: true, collection });

	const closeModal = () => setModalState({ isOpen: false });

	return (
		<div className="space-y-4">
			<div className="flex justify-between">
				<Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select a language" />
					</SelectTrigger>
					<SelectContent>
						{LOCALES.map((locale) => (
							<SelectItem key={locale.code} value={locale.code}>
								{locale.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button onClick={() => openModal()}>Add Collection</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={4} className="text-center">
								Loading...
							</TableCell>
						</TableRow>
					) : (
						collectionsData?.data?.map((collection) => (
							<TableRow key={collection.id}>
								<TableCell>
									{getTranslation(collection, selectedLanguage, "name")}
								</TableCell>
								<TableCell>
									{getTranslation(collection, selectedLanguage, "description")}
								</TableCell>
								<TableCell>
									{new Date(collection.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => openModal(collection)}>
												Edit
											</DropdownMenuItem>
											<DeleteDropdownMenuItem
												onConfirm={() => deleteCollection(collection.id)}
												disabled={isDeletingCollection}
												description="This action cannot be undone. This will permanently delete the product collection."
											/>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<ProductCollectionModal
				open={modalState.isOpen}
				onOpenChange={closeModal}
				collection={modalState.collection}
				currentLanguage={selectedLanguage}
			/>
		</div>
	);
}
