"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useCartStore } from "@/store/use-cart-store";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";

interface CartModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
	const t = useTranslations("Cart");
	const { items, clearCart, itemCount } = useCartStore();
	const { data: session } = useSession();

	const isEmpty = items.length === 0;

	// Calculate totals
	const subtotal = items.reduce(
		(total, item) => total + item.price * item.quantity,
		0,
	);
	const taxes = subtotal * 0.08; // 8% tax rate (or optional)
	const total = subtotal + taxes;

	const handleClearCart = () => {
		clearCart();
		// Could show a toast notification here
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
				<SheetHeader className="shrink-0">
					<div className="mt-2 flex items-center justify-between">
						<SheetTitle className="flex items-center gap-2">
							<ShoppingBag className="size-5" />
							{t("title")}
							{itemCount() > 0 && (
								<span className="text-muted-foreground">({itemCount()})</span>
							)}
						</SheetTitle>
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-hidden">
					{isEmpty ? (
						<div className="flex h-full flex-col items-center justify-center py-12 text-center">
							<ShoppingBag className="mb-4 size-12 text-muted-foreground" />
							<h3 className="mb-2 font-semibold text-lg">{t("empty")}</h3>
							<p className="mb-8 text-muted-foreground">{t("emptyMessage")}</p>
							<Button onClick={() => onOpenChange(false)} className="mb-4">
								{t("continueShopping")}
							</Button>
						</div>
					) : (
						<div className="h-full overflow-y-auto px-1">
							<div className="space-y-3">
								{items.map((item) => (
									<CartItem key={item.id} item={item} />
								))}
							</div>
						</div>
					)}
				</div>

				{!isEmpty && (
					<div className="shrink-0">
						<CartSummary subtotal={subtotal} taxes={taxes} total={total} />

						<div className="mt-4 mb-3 space-y-3">
							{session ? (
								<Link href="/checkout" onClick={() => onOpenChange(false)}>
									<Button className="w-full" size="lg">
										{t("checkout")}
									</Button>
								</Link>
							) : (
								<Link href="/login" onClick={() => onOpenChange(false)}>
									<Button className="w-full" size="lg">
										{t("checkout")}
									</Button>
								</Link>
							)}
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
