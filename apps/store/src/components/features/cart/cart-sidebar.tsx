"use client";

import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { cn } from "@workspace/ui/lib/utils";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartStore } from "@/store/use-cart-store";
import { AuthModal } from "../../auth/auth-modal";
import { CartContent } from "./cart-content";
import { CartModal } from "./cart-modal";

interface CartSidebarProps {
	className?: string;
}

export function CartSidebar({ className }: CartSidebarProps) {
	const t = useTranslations("Cart");
	const { itemCount } = useCartStore();
	const isMounted = useMounted();
	const count = isMounted ? itemCount() : 0;
	const [showCheckout, setShowCheckout] = useState(false);
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalView, setAuthModalView] = useState<"signIn" | "signUp">(
		"signIn",
	);

	const handleLoginClick = () => {
		setAuthModalView("signIn");
		setIsAuthModalOpen(true);
	};

	const handleLoginSuccess = () => {
		setShowCheckout(true);
	};

	return (
		<>
			<aside className={cn(className)}>
				<div className="mb-4 flex items-center gap-2">
					<ShoppingBag className="size-5" />
					<h2 className="font-semibold text-lg">{t("title")}</h2>
					{count > 0 && (
						<span className="text-muted-foreground">({count})</span>
					)}
				</div>

				<div className="flex-1 overflow-hidden">
					<CartContent
						onCheckout={() => setShowCheckout(true)}
						onLoginClick={handleLoginClick}
					/>
				</div>
			</aside>

			<CartModal
				open={showCheckout}
				onOpenChange={setShowCheckout}
				defaultView="checkout"
				onLoginClick={handleLoginClick}
			/>

			<AuthModal
				open={isAuthModalOpen}
				onOpenChange={setIsAuthModalOpen}
				defaultView={authModalView}
				onLoginSuccess={handleLoginSuccess}
			/>
		</>
	);
}
