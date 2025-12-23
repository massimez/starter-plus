"use client";

import { useMutation } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Check, Loader2, Tag, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";

export function CouponInput() {
	const [couponCode, setCouponCode] = useState("");
	const { appliedCoupon, applyCoupon, removeCoupon, subtotal } = useCartStore();
	const [isDisplayCoupon, setIsDisplayCoupon] = useState(false);
	const validateCouponMutation = useMutation({
		mutationFn: async (code: string) => {
			const res = await hc.api.storefront.rewards.coupons.validate.$post({
				json: {
					code,
					orderTotal: subtotal(),
				},
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error?.message || "Invalid coupon code");
			}

			return await res.json();
		},
		onSuccess: (data) => {
			if (data.success && data.data) {
				applyCoupon({
					code: couponCode,
					discountAmount: data.data.discountAmount,
					couponId: data.data.coupon.id,
					type: data.data.coupon.type,
				});
				toast.success("Coupon applied successfully!");
				setCouponCode("");
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to apply coupon");
		},
	});

	const handleApplyCoupon = () => {
		if (!couponCode.trim()) {
			toast.error("Please enter a coupon code");
			return;
		}
		validateCouponMutation.mutate(couponCode.trim().toUpperCase());
	};

	const handleRemoveCoupon = () => {
		removeCoupon();
		toast.success("Coupon removed");
	};

	if (appliedCoupon) {
		return (
			<div className="rounded-lg border-2 border-green-500/20 bg-green-500/5 p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
							<Check className="h-4 w-4 text-green-600" />
						</div>
						<div>
							<p className="font-semibold text-sm">Coupon Applied</p>
							<p className="font-mono text-muted-foreground text-xs">
								{appliedCoupon.code}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="success" className="font-semibold">
							-${appliedCoupon.discountAmount.toFixed(2)}
						</Badge>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleRemoveCoupon}
							className="h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<button
				type="button"
				onClick={() => setIsDisplayCoupon((prev) => !prev)}
				className="w-full cursor-pointer text-left font-medium text-sm"
			>
				Promo code
			</button>
			<div
				className={cn(
					"flex gap-2 overflow-hidden transition-all duration-500",
					isDisplayCoupon ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
				)}
			>
				<div className="relative flex-1">
					<Tag className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						id="coupon-code"
						type="text"
						placeholder="Enter code"
						value={couponCode}
						onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleApplyCoupon();
							}
						}}
						className="pl-9 font-mono uppercase"
						disabled={validateCouponMutation.isPending}
					/>
				</div>
				<Button
					type="button"
					onClick={handleApplyCoupon}
					disabled={validateCouponMutation.isPending || !couponCode.trim()}
					className="shrink-0"
				>
					{validateCouponMutation.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Applying
						</>
					) : (
						"Apply"
					)}
				</Button>
			</div>
		</div>
	);
}
