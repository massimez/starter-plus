"use client";

import type { Product } from "./product-card";
import { ProductCarousel } from "./product-carousel";

const featuredProducts: Product[] = [
	{
		id: "1",
		name: "Wireless Headphones",
		price: 199.99,
		category: "Electronics",
		description: "High-quality wireless headphones with noise cancellation",
		rating: 4.5,
		reviews: 123,
		isOnSale: true,
		discountPercentage: 20,
	},
	{
		id: "2",
		name: "Running Shoes",
		price: 89.99,
		category: "Sports",
		description: "Comfortable running shoes with advanced cushioning",
		rating: 4.2,
		reviews: 89,
		isNew: true,
	},
	{
		id: "3",
		name: "Smart Watch",
		price: 249.99,
		category: "Electronics",
		description: "Feature-rich smartwatch with health monitoring",
		rating: 4.7,
		reviews: 256,
	},
	{
		id: "4",
		name: "Coffee Maker",
		price: 129.99,
		category: "Home",
		description: "Automatic coffee maker with programmable timer",
		rating: 4.0,
		reviews: 67,
		isOnSale: true,
		discountPercentage: 15,
	},
	{
		id: "5",
		name: "Bluetooth Speaker",
		price: 59.99,
		category: "Electronics",
		description: "Portable Bluetooth speaker with excellent sound quality",
		rating: 4.3,
		reviews: 145,
	},
	{
		id: "6",
		name: "Yoga Mat",
		price: 29.99,
		category: "Sports",
		description: "Non-slip yoga mat for all your exercise needs",
		rating: 4.1,
		reviews: 98,
		isNew: true,
	},
];

export function FeaturedProducts() {
	return (
		<ProductCarousel
			products={featuredProducts}
			title="Featured Products"
			showWishlist
			compact
			showArrows={false}
			showDots
			enableAutoplay
		/>
	);
}
