import { relations } from "drizzle-orm";
import { organization } from "../organization";
import { location } from "../store/location";
import { order, orderItem } from "../store/order";
import { productVariant } from "../store/product";
import { user } from "../user";

export const orderRelations = relations(order, ({ many, one }) => ({
	items: many(orderItem),
	organization: one(organization, {
		fields: [order.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [order.userId],
		references: [user.id],
	}),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id],
	}),
	productVariant: one(productVariant, {
		fields: [orderItem.productVariantId],
		references: [productVariant.id],
	}),
	location: one(location, {
		fields: [orderItem.locationId],
		references: [location.id],
	}),
}));
