"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@workspace/ui/components/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import {
	Check,
	ChevronDownIcon,
	ChevronLeft,
	ChevronRight,
	ChevronsUpDown,
} from "lucide-react";
import * as React from "react";
import type { ProductCollection } from "../product-collections/hooks/use-product-collection";

interface CollectionFilterProps {
	collections: ProductCollection[];
	selectedCollectionId?: string | null;
	onSelect: (collectionId: string | null) => void;
}

export function CollectionFilter({
	collections,
	selectedCollectionId,
	onSelect,
}: CollectionFilterProps) {
	const [open, setOpen] = React.useState(false);
	const [navigationStack, setNavigationStack] = React.useState<
		ProductCollection[]
	>([]);

	const currentContext =
		navigationStack.length > 0
			? navigationStack[navigationStack.length - 1]
			: null;

	const currentItems = currentContext
		? currentContext.children || []
		: collections;

	// Helper to find name of selected collection
	const getCollectionName = (
		items: ProductCollection[],
		id: string,
	): string | undefined => {
		for (const item of items) {
			if (item.id === id) return item.name;
			if (item.children) {
				const found = getCollectionName(item.children, id);
				if (found) return found;
			}
		}
		return undefined;
	};

	const selectedName = selectedCollectionId
		? getCollectionName(collections, selectedCollectionId)
		: undefined;

	const handleBack = () => {
		setNavigationStack((prev) => prev.slice(0, -1));
	};

	const handleSelect = (id: string) => {
		onSelect(id === selectedCollectionId ? null : id);
		setOpen(false);
	};

	const handleDrillDown = (
		e: React.MouseEvent,
		collection: ProductCollection,
	) => {
		e.stopPropagation();
		setNavigationStack((prev) => [...prev, collection]);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[200px] justify-between font-normal text-foreground shadow-xs hover:text-foreground dark:bg-input/30 hover:dark:bg-input/50"
				>
					<span className="truncate">{selectedName || "All Collections"}</span>
					<ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[250px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Search collection..." />
					<CommandList>
						<CommandEmpty>No collection found.</CommandEmpty>
						<CommandGroup>
							{/* Back Button */}
							{currentContext && (
								<CommandItem
									onSelect={handleBack}
									className="sticky top-0 bg-popover font-medium"
								>
									<ChevronLeft className="mr-2 h-4 w-4" />
									Back to{" "}
									{navigationStack.length > 1
										? navigationStack[navigationStack.length - 2]?.name
										: "All Collections"}
								</CommandItem>
							)}

							{/* Select "All" option if at root */}
							{!currentContext && (
								<CommandItem
									onSelect={() => handleSelect("")}
									className="font-medium"
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											!selectedCollectionId ? "opacity-100" : "opacity-0",
										)}
									/>
									All Collections
								</CommandItem>
							)}

							{/* List Items */}
							{currentItems.map((collection) => (
								<CommandItem
									key={collection.id}
									onSelect={() => handleSelect(collection.id)}
									className="justify-between"
								>
									<div className="flex items-center">
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												selectedCollectionId === collection.id
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										{collection.name}
									</div>
									{collection.children && collection.children.length > 0 && (
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0 hover:bg-muted"
											onClick={(e) => handleDrillDown(e, collection)}
										>
											<ChevronRight className="h-4 w-4 opacity-50" />
											<span className="sr-only">Go to child collection</span>
										</Button>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
