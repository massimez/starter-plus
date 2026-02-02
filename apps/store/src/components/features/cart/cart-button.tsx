"use client";

import { Button } from "@workspace/ui/components/button";
import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { cn } from "@workspace/ui/lib/utils";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/use-cart-store";
import { CartModal } from "./cart-modal";

export function CartButton({
	className,
	classNameIcon,
	onLoginClick,
}: {
	className?: string;
	classNameIcon?: string;
	onLoginClick?: () => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const isMounted = useMounted();
	const { itemCount } = useCartStore();

	const cartCount = isMounted ? itemCount() : 0;

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				className={cn("relative xl:hidden", className)}
				onClick={() => setIsOpen(true)}
				title="Open cart"
			>
				<ShoppingBag className={cn("h-6 w-6 stroke-[1.5]", classNameIcon)} />
				{cartCount > 0 && (
					<span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-600 font-medium text-[10px] text-white">
						{cartCount > 99 ? "99+" : cartCount}
					</span>
				)}
			</Button>

			<CartModal
				open={isOpen}
				onOpenChange={setIsOpen}
				onLoginClick={onLoginClick}
			/>
		</>
	);
}
