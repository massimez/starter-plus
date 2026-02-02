"use client";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartStore } from "@/store/use-cart-store";
import { CartContent } from "./cart-content";
import { CheckoutSheetContent } from "./checkout/checkout-sheet-content";

interface CartModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultView?: "cart" | "checkout";
	onLoginClick?: () => void;
}

export function CartModal({
	open,
	onOpenChange,
	defaultView = "cart",
	onLoginClick,
}: CartModalProps) {
	const t = useTranslations("Cart");
	const { itemCount } = useCartStore();
	const [view, setView] = useState<"cart" | "checkout">(defaultView);

	// Reset view to default when closed
	const handleOpenChange = (newOpen: boolean) => {
		onOpenChange(newOpen);
		if (!newOpen) {
			setTimeout(() => setView(defaultView), 300);
		}
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent
				side="right"
				className={`flex w-full flex-col ${view === "checkout" ? "sm:max-w-xl [&>button]:hidden" : "sm:max-w-lg"}`}
			>
				{view === "cart" ? (
					<>
						<SheetHeader className="shrink-0">
							<div className="flex items-center justify-between">
								<SheetTitle className="flex items-center gap-2">
									<ShoppingBag className="size-5" />
									{t("title")}
									{itemCount() > 0 && (
										<span className="text-muted-foreground">
											({itemCount()})
										</span>
									)}
								</SheetTitle>
							</div>
						</SheetHeader>

						<div className="flex-1 overflow-hidden pt-4">
							<CartContent
								onCartClose={() => onOpenChange(false)}
								onCheckout={() => setView("checkout")}
								onLoginClick={onLoginClick}
							/>
						</div>
					</>
				) : (
					<CheckoutSheetContent
						onBack={() => setView("cart")}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
}
