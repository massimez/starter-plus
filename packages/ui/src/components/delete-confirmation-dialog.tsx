"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { DropdownMenuItem } from "@workspace/ui/components/dropdown-menu";
import type * as React from "react";

interface DeleteConfirmationDialogProps {
	onConfirm: () => void;
	title?: string;
	description?: string;
	children: React.ReactNode;
	disabled?: boolean;
}

export function DeleteConfirmationDialog({
	onConfirm,
	title = "Are you absolutely sure?",
	description = "This action cannot be undone. This will permanently delete the item.",
	children,
	disabled,
}: DeleteConfirmationDialogProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={disabled}>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

interface DeleteDropdownMenuItemProps {
	onConfirm: () => void;
	title?: string;
	description?: string;
	disabled?: boolean;
}

export function DeleteDropdownMenuItem({
	onConfirm,
	title,
	description,
	disabled,
}: DeleteDropdownMenuItemProps) {
	return (
		<DeleteConfirmationDialog
			onConfirm={onConfirm}
			title={title}
			description={description}
			disabled={disabled}
		>
			<DropdownMenuItem
				onSelect={(e) => e.preventDefault()}
				className="text-red-600"
			>
				Delete
			</DropdownMenuItem>
		</DeleteConfirmationDialog>
	);
}
