"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/use-cart-store";
import { CartModal } from "./cart-modal";

export function CartButton() {
	const [isOpen, setIsOpen] = useState(false);
	const isMounted = useMounted();
	const { itemCount } = useCartStore();

	const cartCount = isMounted ? itemCount() : 0;

	return (
		<>
			<Button
				variant="outline"
				size="icon"
				className="relative"
				onClick={() => setIsOpen(true)}
				title="Open cart"
			>
				<ShoppingCart className="size-5" />
				{cartCount > 0 && (
					<Badge
						variant="destructive"
						className="-top-2 -right-2 absolute flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
					>
						{cartCount > 99 ? "99+" : cartCount}
					</Badge>
				)}
			</Button>

			<CartModal open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
