"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { format } from "date-fns";
import { ArrowLeft, Download, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBill } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-bills";

export default function BillDetailsPage() {
	const params = useParams();
	const id = params.id as string;
	const { data: bill, isLoading, error } = useBill(id);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-32" />
					<div className="flex gap-2">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-64 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !bill) {
		return (
			<div className="flex h-[50vh] flex-col items-center justify-center gap-4">
				<h2 className="font-semibold text-2xl">Bill not found</h2>
				<p className="text-muted-foreground">
					The bill you are looking for does not exist or you don't have
					permission to view it.
				</p>
				<Button asChild>
					<Link href="/dashboard/financial/bills">Go back to Bills</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/dashboard/financial/bills">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-2xl tracking-tight">
							{bill.invoiceNumber}
						</h1>
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<span>
								Issued: {format(new Date(bill.invoiceDate), "MMM d, yyyy")}
							</span>
							<span>•</span>
							<span>Due: {format(new Date(bill.dueDate), "MMM d, yyyy")}</span>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Download PDF
					</Button>
					<Button>
						<Wallet className="mr-2 h-4 w-4" />
						Record Payment
					</Button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="md:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Bill Details</CardTitle>
							<CardDescription>
								View the line items and breakdown of this bill.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Description</TableHead>
										<TableHead className="text-right">Quantity</TableHead>
										<TableHead className="text-right">Unit Price</TableHead>
										<TableHead className="text-right">Tax</TableHead>
										<TableHead className="text-right">Amount</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{bill.lines?.map((line) => (
										<TableRow key={line.id}>
											<TableCell>{line.description}</TableCell>
											<TableCell className="text-right">
												{line.quantity}
											</TableCell>
											<TableCell className="text-right">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: bill.currency,
												}).format(Number(line.unitPrice))}
											</TableCell>
											<TableCell className="text-right">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: bill.currency,
												}).format(Number(line.taxAmount))}
											</TableCell>
											<TableCell className="text-right font-medium">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: bill.currency,
												}).format(Number(line.totalAmount))}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span>
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: bill.currency,
									}).format(Number(bill.netAmount))}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Tax</span>
								<span>
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: bill.currency,
									}).format(Number(bill.taxAmount))}
								</span>
							</div>
							<Separator />
							<div className="flex justify-between font-medium text-lg">
								<span>Total</span>
								<span>
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: bill.currency,
									}).format(Number(bill.totalAmount))}
								</span>
							</div>
							<div className="pt-4">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-sm">Status</span>
									<Badge
										variant={
											bill.status === "paid"
												? "success"
												: bill.status === "overdue"
													? "destructive"
													: "secondary"
										}
										className="capitalize"
									>
										{bill.status}
									</Badge>
								</div>
								<div className="mt-2 flex items-center justify-between">
									<span className="text-muted-foreground text-sm">
										Payment Status
									</span>
									<Badge variant="outline" className="capitalize">
										{bill.paymentStatus}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Supplier</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-1">
								<p className="font-medium">Supplier ID</p>
								<p className="text-muted-foreground text-sm">
									{bill.supplierId}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
