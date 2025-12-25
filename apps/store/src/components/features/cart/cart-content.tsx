"use client";

import { Button } from "@workspace/ui/components/button";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useCartStore } from "@/store/use-cart-store";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";

interface CartContentProps {
	onCartClose?: () => void;
}

export function CartContent({ onCartClose }: CartContentProps) {
	const t = useTranslations("Cart");
	const {
		items,
		clearCart,
		subtotal: getSubtotal,
		total: getTotal,
	} = useCartStore();
	const { data: session } = useSession();

	const isEmpty = items.length === 0;

	const subtotal = getSubtotal();
	const total = getTotal();
	const taxes = 0; // Taxes handled at checkout

	const _handleClearCart = () => {
		clearCart();
		// Could show a toast notification here
	};

	if (isEmpty) {
		return (
			<div className="flex h-full flex-col items-center justify-center py-12 text-center">
				<ShoppingBag className="mb-4 size-12 text-muted-foreground" />
				<h3 className="mb-2 font-semibold text-lg">{t("empty")}</h3>
				<p className="mb-8 text-muted-foreground">{t("emptyMessage")}</p>
				{onCartClose && (
					<Button onClick={onCartClose} className="mb-4">
						{t("continueShopping")}
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex-1 overflow-y-auto">
				<div className="space-y-3 pb-4">
					{items.map((item) => (
						<CartItem key={item.id} item={item} />
					))}
				</div>
			</div>

			<div className="mt-4 shrink-0">
				<CartSummary subtotal={subtotal} taxes={taxes} total={total} />

				<div className="mt-4 mb-3 space-y-3">
					{session ? (
						<Link href="/checkout" onClick={() => onCartClose?.()}>
							<Button className="w-full" size="lg">
								{t("checkout")}
							</Button>
						</Link>
					) : (
						<Link href="/login" onClick={() => onCartClose?.()}>
							<Button className="w-full" size="lg">
								{t("checkout")}
							</Button>
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
