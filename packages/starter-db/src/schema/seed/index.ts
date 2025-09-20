// drizzle/seed.ts

import { randomUUID } from "crypto";
import { db } from "src";
import {
	currency,
	language,
	location,
	member,
	order,
	orderItem,
	organization,
	product,
	productCategory,
	productTranslation,
	productVariant,
	productVariantStock,
	productVariantStockTransaction,
	productVariantTranslation,
	user,
} from "../index";

async function seed() {
	console.log("🌱 Starting seed...");

	// ─── Users ──────────────────────────────
	const users = [
		{
			id: randomUUID(),
			name: "Alice Johnson",
			email: "alice@example.com",
			image: "https://i.pravatar.cc/300?u=alice",
			role: "admin",
		},
		{
			id: randomUUID(),
			name: "Bob Smith",
			email: "bob@example.com",
			image: "https://i.pravatar.cc/300?u=bob",
			role: "user",
		},
	];
	await db.insert(user).values(
		users.map((u) => ({
			...u,
			emailVerified: true,
			banned: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		})),
	);

	// ─── Organization ───────────────────────
	const orgs = [
		{
			id: randomUUID(),
			name: "Acme Inc",
			slug: "acme-inc",
			logo: "https://dummyimage.com/200x200/000/fff&text=ACME",
		},
		{
			id: randomUUID(),
			name: "Globex Corp",
			slug: "globex-corp",
			logo: "https://dummyimage.com/200x200/111/fff&text=Globex",
		},
	];
	await db.insert(organization).values(
		orgs.map((o) => ({
			...o,
			createdAt: new Date(),
		})),
	);

	// ─── Members ────────────────────────────
	await db.insert(member).values([
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			userId: users[0].id,
			role: "owner",
			createdAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgs[1].id,
			userId: users[1].id,
			role: "owner",
			createdAt: new Date(),
		},
	]);

	// ─── Languages ──────────────────────────
	await db.insert(language).values([
		{
			code: "en",
			name: "English",
			nativeName: "English",
			isActive: true,
			isDefault: true,
			createdAt: new Date(),
		},
		{
			code: "fr",
			name: "French",
			nativeName: "Français",
			isActive: true,
			isDefault: false,
			createdAt: new Date(),
		},
	]);

	// ─── Currencies ─────────────────────────
	await db.insert(currency).values([
		{
			code: "USD",
			name: "US Dollar",
			symbol: "$",
			isActive: true,
			isDefault: true,
			exchangeRate: "1.0",
			createdAt: new Date(),
		},
		{
			code: "EUR",
			name: "Euro",
			symbol: "€",
			isActive: true,
			isDefault: false,
			exchangeRate: "0.9",
			createdAt: new Date(),
		},
	]);

	// ─── Locations ──────────────────────────
	const locId = randomUUID();
	await db.insert(location).values({
		id: locId,
		organizationId: orgs[0].id,
		locationType: "warehouse",
		name: "Main Warehouse",
		description: "Primary stock location",
		isActive: true,
		isDefault: true,
		metadata: {},
		createdBy: users[0].id,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// ─── Categories ─────────────────────────
	const catId = randomUUID();
	await db.insert(productCategory).values({
		id: catId,
		organizationId: orgs[0].id,
		name: "Electronics",
		slug: "electronics",
		description: "Electronic devices and accessories",
		sortOrder: 1,
		isActive: true,
		createdBy: users[0].id,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// ─── Products + Variants ────────────────
	const product1Id = randomUUID();
	const product2Id = randomUUID();

	await db.insert(product).values([
		{
			id: product1Id,
			organizationId: orgs[0].id,
			status: "active",
			type: "simple",
			currency: "USD",
			taxRate: "10.00",
			minQuantity: 1,
			isFeatured: true,
			trackStock: true,
			allowBackorders: false,
			isActive: true,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: product2Id,
			organizationId: orgs[0].id,
			status: "active",
			type: "simple",
			currency: "USD",
			taxRate: "5.00",
			minQuantity: 1,
			isFeatured: false,
			trackStock: true,
			allowBackorders: false,
			isActive: true,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	await db.insert(productTranslation).values([
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			productId: product1Id,
			languageCode: "en",
			name: "Smartphone X",
			slug: "smartphone-x",
			shortDescription: "High-end smartphone",
			description: "Latest smartphone with AI-powered features.",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			productId: product2Id,
			languageCode: "en",
			name: "Wireless Earbuds",
			slug: "wireless-earbuds",
			shortDescription: "Noise-cancelling earbuds",
			description: "Comfortable earbuds with long battery life.",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	const variant1Id = randomUUID();
	const variant2Id = randomUUID();

	await db.insert(productVariant).values([
		{
			id: variant1Id,
			organizationId: orgs[0].id,
			productId: product1Id,
			sku: "SPX-001",
			barcode: "1234567890123",
			price: "999.99",
			cost: "700.00",
			reorderPoint: 5,
			reorderQuantity: 20,
			isActive: true,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: variant2Id,
			organizationId: orgs[0].id,
			productId: product2Id,
			sku: "EB-100",
			barcode: "9876543210987",
			price: "199.99",
			cost: "120.00",
			reorderPoint: 10,
			reorderQuantity: 50,
			isActive: true,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	await db.insert(productVariantTranslation).values([
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			productVariantId: variant1Id,
			languageCode: "en",
			name: "Smartphone X (128GB, Black)",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			productVariantId: variant2Id,
			languageCode: "en",
			name: "Wireless Earbuds (Black)",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	// ─── Stock ──────────────────────────────
	await db.insert(productVariantStock).values([
		{
			organizationId: orgs[0].id,
			productVariantId: variant1Id,
			locationId: locId,
			quantity: 50,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			organizationId: orgs[0].id,
			productVariantId: variant2Id,
			locationId: locId,
			quantity: 200,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	await db.insert(productVariantStockTransaction).values([
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			productVariantId: variant1Id,
			locationId: locId,
			quantityChange: 50,
			reason: "initial stock",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			productVariantId: variant2Id,
			locationId: locId,
			quantityChange: 200,
			reason: "initial stock",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	// ─── Orders ─────────────────────────────
	const order1Id = randomUUID();
	const order2Id = randomUUID();

	await db.insert(order).values([
		{
			id: order1Id,
			organizationId: orgs[0].id,
			userId: users[1].id,
			orderNumber: "ORD-001",
			status: "completed",
			currency: "USD",
			subtotal: "1199.98",
			totalAmount: "1199.98",
			shippingAddress: {
				street: "123 Main St",
				city: "Anytown",
				state: "CA",
				zipCode: "12345",
				country: "USA",
			},
			locationId: locId,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: order2Id,
			organizationId: orgs[0].id,
			userId: users[1].id,
			orderNumber: "ORD-002",
			status: "pending",
			currency: "USD",
			subtotal: "199.99",
			totalAmount: "199.99",
			shippingAddress: {
				street: "456 Elm St",
				city: "Anytown",
				state: "CA",
				zipCode: "12345",
				country: "USA",
			},
			locationId: locId,
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	await db.insert(orderItem).values([
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			orderId: order1Id,
			productVariantId: variant1Id,
			locationId: locId,
			productName: "Smartphone X",
			variantName: "Smartphone X (128GB, Black)",
			sku: "SPX-001",
			quantity: 1,
			unitPrice: "999.99",
			totalPrice: "999.99",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			orderId: order1Id,
			productVariantId: variant2Id,
			locationId: locId,
			productName: "Wireless Earbuds",
			variantName: "Wireless Earbuds (Black)",
			sku: "EB-100",
			quantity: 1,
			unitPrice: "199.99",
			totalPrice: "199.99",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: randomUUID(),
			organizationId: orgs[0].id,
			orderId: order2Id,
			productVariantId: variant2Id,
			locationId: locId,
			productName: "Wireless Earbuds",
			variantName: "Wireless Earbuds (Black)",
			sku: "EB-100",
			quantity: 1,
			unitPrice: "199.99",
			totalPrice: "199.99",
			createdBy: users[0].id,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	console.log("✅ Seed completed");
}

seed().catch((err) => {
	console.error("❌ Seed failed", err);
	process.exit(1);
});
