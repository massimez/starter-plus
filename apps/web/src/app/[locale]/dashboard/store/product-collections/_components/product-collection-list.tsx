"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { DeleteDropdownMenuItem } from "@workspace/ui/components/delete-confirmation-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import {
	CheckCircle2,
	Eye,
	EyeOff,
	FolderTree,
	Image as ImageIcon,
	MoreHorizontal,
	PackageOpen,
	Search,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LOCALES } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { useDeleteProductCollection } from "../hooks/use-delete-product-collection";
import {
	type ProductCollection,
	useProductCollections,
} from "../hooks/use-product-collection";
import { ProductCollectionModal } from "./product-collection-modal";

const getTranslation = (
	collection: ProductCollection,
	locale: string,
	field: "name" | "description",
) => {
	return (
		collection.translations?.find((t) => t.languageCode === locale)?.[field] ||
		collection[field] ||
		"-"
	);
};

function LoadingSkeleton() {
	return (
		<TableRow>
			<TableCell colSpan={5} className="h-24 text-center">
				Loading...
			</TableCell>
		</TableRow>
	);
}

function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
	return (
		<TableRow>
			<TableCell colSpan={5} className="h-[400px]">
				<div className="flex flex-col items-center justify-center gap-4">
					<div className="rounded-full bg-muted p-4">
						<PackageOpen className="h-10 w-10 text-muted-foreground" />
					</div>
					<div className="text-center">
						<h3 className="font-semibold text-lg">No collections yet</h3>
						<p className="text-muted-foreground text-sm">
							Get started by creating your first product collection
						</p>
					</div>
					<Button onClick={onCreateNew}>Create Collection</Button>
				</div>
			</TableCell>
		</TableRow>
	);
}

function StatusBadge({
	isActive,
	label,
}: {
	isActive: boolean;
	label: string;
}) {
	return (
		<Badge
			variant={isActive ? "success" : "secondary"}
			className="gap-1 font-normal"
		>
			{isActive ? (
				<CheckCircle2 className="h-3 w-3" />
			) : (
				<XCircle className="h-3 w-3" />
			)}
			{label}
		</Badge>
	);
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
	return (
		<Badge
			variant={isVisible ? "info" : "outline"}
			className="gap-1 font-normal"
		>
			{isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
			{isVisible ? "Visible" : "Hidden"}
		</Badge>
	);
}

export function ProductCollectionList({
	selectedLanguage,
	setSelectedLanguage,
}: {
	selectedLanguage: string;
	setSelectedLanguage: (locale: string) => void;
}) {
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		collection?: ProductCollection;
	}>({ isOpen: false });
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedParentId, setSelectedParentId] = useState<string>("all");

	const {
		data: collectionsData,
		isLoading,
		refetch,
	} = useProductCollections(selectedLanguage);
	const { deleteCollection, isDeletingCollection } =
		useDeleteProductCollection(selectedLanguage);

	const openModal = (collection?: ProductCollection) =>
		setModalState({ isOpen: true, collection });

	const closeModal = () => setModalState({ isOpen: false });

	// Filter collections based on search query and parent
	const filteredCollections = useMemo(() => {
		if (!collectionsData?.flat) return [];
		let result = collectionsData.flat;

		// Filter by parent
		if (selectedParentId !== "all") {
			if (selectedParentId === "root") {
				result = result.filter((c) => !c.parentId);
			} else {
				result = result.filter((c) => c.parentId === selectedParentId);
			}
		}

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((collection) => {
				const name = getTranslation(collection, selectedLanguage, "name");
				const description = getTranslation(
					collection,
					selectedLanguage,
					"description",
				);
				return (
					name.toLowerCase().includes(query) ||
					description.toLowerCase().includes(query)
				);
			});
		}

		return result;
	}, [collectionsData?.flat, searchQuery, selectedLanguage, selectedParentId]);

	const handleToggleActive = async (
		collectionId: string,
		currentValue: boolean,
	) => {
		try {
			await hc.api.store["product-collections"][":id"].$put({
				param: { id: collectionId },
				json: { isActive: !currentValue },
			});
			toast.success("Collection status updated");
			refetch();
		} catch (error) {
			toast.error("Failed to update collection status");
			console.error(error);
		}
	};

	const handleToggleVisible = async (
		collectionId: string,
		currentValue: boolean,
	) => {
		try {
			await hc.api.store["product-collections"][":id"].$put({
				param: { id: collectionId },
				json: { isVisible: !currentValue },
			});
			toast.success("Collection visibility updated");
			refetch();
		} catch (error) {
			toast.error("Failed to update collection visibility");
			console.error(error);
		}
	};

	const getParentName = (parentId: string | null | undefined) => {
		if (!parentId) return null;
		const parent = collectionsData?.flat?.find((c) => c.id === parentId);
		return parent ? getTranslation(parent, selectedLanguage, "name") : null;
	};

	return (
		<div className="space-y-4">
			{/* Header Controls */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select a language" />
						</SelectTrigger>
						<SelectContent>
							{LOCALES.map((localeElm) => (
								<SelectItem key={localeElm.code} value={localeElm.code}>
									{localeElm.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedParentId} onValueChange={setSelectedParentId}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Filter by parent" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Collections</SelectItem>
							<SelectItem value="root">Top Level Only</SelectItem>
							{collectionsData?.flat
								?.filter((c) => !c.parentId)
								.map((collection) => (
									<SelectItem key={collection.id} value={collection.id}>
										{getTranslation(collection, selectedLanguage, "name")}
									</SelectItem>
								))}
						</SelectContent>
					</Select>

					{collectionsData?.flat && (
						<Badge variant="outline" className="ml-2">
							{filteredCollections.length} collection
							{filteredCollections.length !== 1 ? "s" : ""}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<div className="relative flex-1 sm:flex-initial">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search collections..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 sm:w-[300px]"
						/>
					</div>
					<Button onClick={() => openModal()}>Add Collection</Button>
				</div>
			</div>

			{/* Collections Table */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Collection</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<LoadingSkeleton />
						) : filteredCollections.length === 0 ? (
							searchQuery ? (
								<TableRow>
									<TableCell colSpan={5} className="h-[200px] text-center">
										<p className="text-muted-foreground">
											No collections found matching "{searchQuery}"
										</p>
									</TableCell>
								</TableRow>
							) : (
								<EmptyState onCreateNew={() => openModal()} />
							)
						) : (
							filteredCollections.map((collection) => {
								const parentName = getParentName(collection.parentId);
								return (
									<TableRow key={collection.id} className="group">
										<TableCell>
											<div className="flex items-center gap-3">
												{/* Image Preview */}
												<div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded border bg-muted">
													{collection.image ? (
														// biome-ignore lint/performance/noImgElement: <>
														<img
															src={collection.image}
															alt="Collection"
															className="rounded object-cover"
														/>
													) : (
														<ImageIcon className="h-5 w-5 text-muted-foreground" />
													)}
												</div>
												<div className="min-w-0 flex-1">
													<p className="truncate font-medium">
														{getTranslation(
															collection,
															selectedLanguage,
															"name",
														)}
													</p>
													{parentName && (
														<p className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
															<FolderTree className="h-3 w-3" />
															{parentName}
														</p>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell className="max-w-[300px]">
											<p className="truncate text-muted-foreground text-sm">
												{getTranslation(
													collection,
													selectedLanguage,
													"description",
												)}
											</p>
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-2">
												<StatusBadge
													isActive={collection.isActive ?? true}
													label={collection.isActive ? "Active" : "Inactive"}
												/>
												<VisibilityBadge
													isVisible={collection.isVisible ?? true}
												/>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{new Date(collection.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<span className="sr-only">Open menu</span>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-[200px]">
													<DropdownMenuItem
														onClick={() => openModal(collection)}
													>
														Edit Collection
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															handleToggleActive(
																collection.id,
																collection.isActive ?? true,
															)
														}
													>
														<Switch
															checked={collection.isActive ?? true}
															className="mr-2 scale-75"
														/>
														{collection.isActive ? "Deactivate" : "Activate"}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															handleToggleVisible(
																collection.id,
																collection.isVisible ?? true,
															)
														}
													>
														<Switch
															checked={collection.isVisible ?? true}
															className="mr-2 scale-75"
														/>
														{collection.isVisible ? "Hide" : "Show"}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DeleteDropdownMenuItem
														onConfirm={() => deleteCollection(collection.id)}
														disabled={isDeletingCollection}
														description="This action cannot be undone. This will permanently delete the product collection."
													/>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</Card>

			<ProductCollectionModal
				open={modalState.isOpen}
				onOpenChange={closeModal}
				collection={modalState.collection}
				currentLanguage={selectedLanguage}
			/>
		</div>
	);
}
