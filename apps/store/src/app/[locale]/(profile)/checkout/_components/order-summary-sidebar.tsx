import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Check } from "lucide-react";
import Image from "next/image";
import type { CartItem } from "@/store/use-cart-store";
import { CouponInput } from "./coupon-input";

interface OrderSummarySidebarProps {
	items: CartItem[];
	total: number;
	subtotal: number;
	discount: number;
}

export function OrderSummarySidebar({
	items,
	total,
	subtotal,
	discount,
}: OrderSummarySidebarProps) {
	return (
		<div className="space-y-6 lg:sticky lg:top-6 lg:w-96">
			<Card className="overflow-hidden border-2 shadow-lg">
				<CardHeader className="border-b">
					<CardTitle className="text-xl">Order Summary</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Items List */}
					<div className="mb-6 space-y-4">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-muted-foreground text-sm">
								ITEMS ({items.length})
							</span>
						</div>
						<div className="space-y-3">
							{items.map((item) => (
								<div
									key={item.id}
									className="group relative flex gap-4 rounded-xl border-2 bg-linear-to-br from-muted/30 to-muted/50 p-3 transition-all hover:border-primary/30 hover:shadow-md"
								>
									{item.image && (
										<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
											<Image
												src={item.image}
												alt={item.name}
												width={80}
												height={80}
												className="h-full w-full object-cover transition-transform group-hover:scale-105"
											/>
											<div className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
												{item.quantity}
											</div>
										</div>
									)}
									<div className="flex flex-1 flex-col justify-between space-y-1">
										<div>
											<p className="font-semibold text-sm leading-tight">
												{item.name}
											</p>
											{(item.variantName || item.variantSku) && (
												<p className="mt-1 text-muted-foreground text-xs">
													{item.variantName && <span>{item.variantName}</span>}
													{item.variantName && item.variantSku && (
														<span> • </span>
													)}
													{item.variantSku && (
														<span>SKU: {item.variantSku}</span>
													)}
												</p>
											)}
										</div>
										<div className="flex items-end justify-between">
											<span className="text-muted-foreground text-xs">
												${item.price.toFixed(2)} each
											</span>
											<span className="font-bold text-primary text-sm">
												${(item.price * item.quantity).toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<Separator className="my-1" />

					{/* Coupon Input */}
					<CouponInput />

					<Separator className="my-1" />

					{/* Price Breakdown */}
					<div className="space-y-4">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Subtotal</span>
							<span className="font-semibold">${subtotal.toFixed(2)}</span>
						</div>
						{discount > 0 && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Discount</span>
								<span className="font-semibold text-green-600">
									-${discount.toFixed(2)}
								</span>
							</div>
						)}
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Shipping</span>
							<div className="flex items-center gap-2">
								<span className="rounded-full bg-green-500/10 px-2 py-0.5 font-bold text-green-600 text-xs">
									FREE
								</span>
								<span className="font-semibold text-green-600 line-through">
									$9.99
								</span>
							</div>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Tax</span>
							<span className="font-medium">Calculated at checkout</span>
						</div>

						<Separator />

						{/* Total */}
						<div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary to-primary/80 p-5 text-white shadow-lg">
							<div className="-translate-y-8 absolute top-0 right-0 h-32 w-32 translate-x-8 rounded-full bg-white/10" />
							<div className="relative flex items-center justify-between">
								<div>
									<p className="mb-1 text-sm opacity-90">Total Amount</p>
									<p className="font-bold text-3xl tracking-tight">
										${total.toFixed(2)}
									</p>
								</div>
								<Check className="h-8 w-8 opacity-50" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
