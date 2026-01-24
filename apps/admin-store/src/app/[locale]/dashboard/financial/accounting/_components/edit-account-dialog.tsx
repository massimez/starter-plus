"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
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
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";

const formSchema = z.object({
	name: z.string().min(1, "Account name is required"),
	description: z.string().optional(),
	isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EditAccountDialogProps {
	account: {
		id: string;
		code: string;
		name: string;
		description?: string | null;
		isActive?: boolean | null;
		accountType?: string;
		category?: string | null;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditAccountDialog({
	account,
	open,
	onOpenChange,
}: EditAccountDialogProps) {
	const { useUpdateAccount } = useFinancialAccounting();
	const updateAccount = useUpdateAccount();

	const form = useForm<FormValues>({
		// biome-ignore lint/suspicious/noExplicitAny: pragmatic fix for hookform resolver mismatch
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			name: account.name,
			description: account.description || "",
			isActive: account.isActive ?? true,
		},
	});

	const onSubmit = async (values: FormValues) => {
		try {
			await updateAccount.mutateAsync({
				id: account.id,
				data: values,
			});
			toast.success("Account updated successfully");
			onOpenChange(false);
		} catch {
			toast.error("Failed to update account");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>Edit Account</DialogTitle>
					<DialogDescription>
						Update details for account {account.code} - {account.name}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="space-y-2">
							<div className="rounded-md border bg-muted/50 p-3">
								<p className="font-medium text-sm">Account Code</p>
								<p className="font-mono text-muted-foreground text-sm">
									{account.code}
								</p>
							</div>
							<div className="rounded-md border bg-muted/50 p-3">
								<p className="font-medium text-sm">Account Type</p>
								<p className="text-muted-foreground text-sm capitalize">
									{account.accountType?.replace("_", " ")}
								</p>
							</div>
						</div>

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Name*</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Cash" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Optional description of the account"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
									<div className="space-y-0.5">
										<FormLabel>Active Status</FormLabel>
										<FormDescription>
											Inactive accounts cannot be used in transactions
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

						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={updateAccount.isPending}>
								{updateAccount.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
