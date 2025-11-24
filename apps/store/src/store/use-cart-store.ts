import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
	description?: string;
	productVariantId: string;
	locationId: string;
}

interface CartState {
	items: CartItem[];
	addItem: (item: CartItem) => void;
	removeItem: (id: string) => void;
	updateQuantity: (id: string, quantity: number) => void;
	clearCart: () => void;
	total: () => number;
	itemCount: () => number;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			addItem: (item) =>
				set((state) => {
					const existingItem = state.items.find((i) => i.id === item.id);
					if (existingItem) {
						return {
							items: state.items.map((i) =>
								i.id === item.id
									? { ...i, quantity: i.quantity + item.quantity }
									: i,
							),
						};
					}
					return { items: [...state.items, item] };
				}),
			removeItem: (id) =>
				set((state) => ({
					items: state.items.filter((i) => i.id !== id),
				})),
			updateQuantity: (id, quantity) =>
				set((state) => ({
					items: state.items.map((item) =>
						item.id === id
							? { ...item, quantity: Math.max(1, quantity) }
							: item,
					),
				})),
			clearCart: () => set({ items: [] }),
			total: () =>
				get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
			itemCount: () =>
				get().items.reduce((acc, item) => acc + item.quantity, 0),
		}),
		{
			name: "cart-storage",
		},
	),
);
