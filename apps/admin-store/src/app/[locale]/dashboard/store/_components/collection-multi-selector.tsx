"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
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
	X,
} from "lucide-react";
import * as React from "react";
import type { ProductCollection } from "../product-collections/hooks/use-product-collection";

interface CollectionMultiSelectorProps {
	collections: ProductCollection[];
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	placeholder?: string;
	emptyIndicator?: React.ReactNode;
	disabled?: boolean;
}

export function CollectionMultiSelector({
	collections,
	selectedIds = [],
	onChange,
	placeholder = "Select collections...",
	emptyIndicator = "No collection found.",
	disabled = false,
}: CollectionMultiSelectorProps) {
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

	// Helper to find collection by ID (recursive)
	const findCollection = React.useCallback(
		(items: ProductCollection[], id: string): ProductCollection | undefined => {
			for (const item of items) {
				if (item.id === id) return item;
				if (item.children) {
					const found = findCollection(item.children, id);
					if (found) return found;
				}
			}
			return undefined;
		},
		[],
	);

	// Get selected collection objects for badges
	const selectedCollections = React.useMemo(() => {
		return selectedIds
			.map((id) => findCollection(collections, id))
			.filter(Boolean) as ProductCollection[];
	}, [collections, selectedIds, findCollection]);

	const handleBack = () => {
		setNavigationStack((prev) => prev.slice(0, -1));
	};

	const toggleSelection = (id: string) => {
		const newSelectedIds = selectedIds.includes(id)
			? selectedIds.filter((existingId) => existingId !== id)
			: [...selectedIds, id];
		onChange(newSelectedIds);
	};

	const handleDrillDown = (
		e: React.MouseEvent,
		collection: ProductCollection,
	) => {
		e.stopPropagation();
		setNavigationStack((prev) => [...prev, collection]);
	};

	const handleUnselect = (id: string) => {
		onChange(selectedIds.filter((existingId) => existingId !== id));
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div
					role="combobox"
					aria-expanded={open}
					aria-controls="collection-multi-selector-list"
					className={cn(
						"flex min-h-9 w-full flex-wrap items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground hover:bg-transparent focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
						disabled && "cursor-not-allowed opacity-50",
					)}
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							if (!disabled) setOpen(!open);
						}
					}}
					onClick={() => !disabled && setOpen(!open)}
				>
					<div className="flex flex-wrap gap-1">
						{selectedCollections.length > 0 ? (
							selectedCollections.map((collection) => (
								<Badge
									key={collection.id}
									variant="secondary"
									className="rounded-sm px-1 font-normal"
								>
									{collection.name}
									<button
										type="button"
										className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleUnselect(collection.id);
											}
										}}
										onMouseDown={(e) => {
											e.preventDefault();
											e.stopPropagation();
										}}
										onClick={(e) => {
											e.stopPropagation(); // Prevent opening popover
											handleUnselect(collection.id);
										}}
									>
										<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
									</button>
								</Badge>
							))
						) : (
							<span className="text-foreground">{placeholder}</span>
						)}
					</div>
					<ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
				</div>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0" align="start">
				<Command>
					<CommandList>
						<CommandEmpty>{emptyIndicator}</CommandEmpty>
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

							{/* Select "All" pseudo-option or context header can go here if needed, 
                                but standard multi-select usually just lists items */}

							{/* List Items */}
							{currentItems.map((collection) => {
								const isSelected = selectedIds.includes(collection.id);
								return (
									<CommandItem
										key={collection.id}
										onSelect={() => toggleSelection(collection.id)}
										className="justify-between"
									>
										<div className="flex items-center">
											<div
												className={cn(
													"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
													isSelected
														? "bg-primary text-primary-foreground"
														: "opacity-50 [&_svg]:invisible",
												)}
											>
												<Check className={cn("h-4 w-4")} />
											</div>
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
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
