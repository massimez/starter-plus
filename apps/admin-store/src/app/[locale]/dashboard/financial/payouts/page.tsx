"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export default function PayoutsPage() {
	const queryClient = useQueryClient();
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [selectedPayout, setSelectedPayout] = useState<{
		id: string;
		status: string;
		[key: string]: unknown;
	} | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["payouts"],
		queryFn: async () => {
			const res = await hc.api.financial.payouts.$get({
				query: {
					limit: "50",
					offset: "0",
				},
			});
			return await res.json();
		},
	});

	const approveMutation = useMutation({
		mutationFn: async (payoutId: string) => {
			const res = await hc.api.financial.payouts[":id"].approve.$post({
				param: { id: payoutId },
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to approve payout");
			}
			return data;
		},
		onSuccess: () => {
			toast.success("Payout approved successfully");
			queryClient.invalidateQueries({ queryKey: ["payouts"] });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const rejectMutation = useMutation({
		mutationFn: async ({
			payoutId,
			reason,
		}: {
			payoutId: string;
			reason: string;
		}) => {
			const res = await hc.api.financial.payouts[":id"].reject.$post({
				param: { id: payoutId },
				json: { reason },
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to reject payout");
			}
			return data;
		},
		onSuccess: () => {
			toast.success("Payout rejected and points refunded");
			queryClient.invalidateQueries({ queryKey: ["payouts"] });
			setRejectDialogOpen(false);
			setRejectionReason("");
			setSelectedPayout(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const markPaidMutation = useMutation({
		mutationFn: async (payoutId: string) => {
			const res = await hc.api.financial.payouts[":id"]["mark-paid"].$post({
				param: { id: payoutId },
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to mark as paid");
			}
			return data;
		},
		onSuccess: () => {
			toast.success("Payout marked as paid");
			queryClient.invalidateQueries({ queryKey: ["payouts"] });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleReject = (payout: {
		id: string;
		status: string;
		[key: string]: unknown;
	}) => {
		setSelectedPayout(payout);
		setRejectDialogOpen(true);
	};

	const confirmReject = () => {
		if (selectedPayout && rejectionReason.trim()) {
			rejectMutation.mutate({
				payoutId: selectedPayout.id,
				reason: rejectionReason,
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	const payouts = data?.success ? data.data.requests : [];

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Payout Requests</CardTitle>
					<CardDescription>
						Manage cash back payout requests from customers
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Points</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payouts.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-center text-muted-foreground"
									>
										No payout requests
									</TableCell>
								</TableRow>
							) : (
								payouts.map(
									(payout: {
										id: string;
										status: string;
										user?: { email?: string };
										cashAmount: string;
										pointsDeducted: number;
										payoutMethod?: { type?: string };
										createdAt: string;
									}) => (
										<TableRow key={payout.id}>
											<TableCell>{payout.user?.email || "Unknown"}</TableCell>
											<TableCell>${payout.cashAmount}</TableCell>
											<TableCell>{payout.pointsDeducted}</TableCell>
											<TableCell className="capitalize">
												{payout.payoutMethod?.type?.replace("_", " ")}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														payout.status === "paid"
															? "primary"
															: payout.status === "approved"
																? "secondary"
																: payout.status === "rejected"
																	? "destructive"
																	: "primary"
													}
												>
													{payout.status}
												</Badge>
											</TableCell>
											<TableCell>
												{new Date(payout.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													{payout.status === "pending" && (
														<>
															<Button
																size="sm"
																onClick={() =>
																	approveMutation.mutate(payout.id)
																}
																disabled={approveMutation.isPending}
															>
																<CheckCircle className="h-4 w-4" />
															</Button>
															<Button
																size="sm"
																variant="destructive"
																onClick={() => handleReject(payout)}
																disabled={rejectMutation.isPending}
															>
																<XCircle className="h-4 w-4" />
															</Button>
														</>
													)}
													{payout.status === "approved" && (
														<Button
															size="sm"
															onClick={() => markPaidMutation.mutate(payout.id)}
															disabled={markPaidMutation.isPending}
														>
															Mark Paid
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									),
								)
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Payout Request</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting this payout. Points will be
							refunded to the user.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="reason">Rejection Reason</Label>
							<Input
								id="reason"
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Enter reason..."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRejectDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmReject}
							disabled={!rejectionReason.trim() || rejectMutation.isPending}
						>
							{rejectMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Reject & Refund
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
