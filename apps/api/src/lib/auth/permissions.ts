// src/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	ownerAc,
} from "better-auth/plugins/organization/access";

export const statements = {
	...defaultStatements,
	product: ["create", "update", "delete", "view"],
	stock: ["adjust", "view"],
	supplier: ["create", "update", "delete", "view"],
	order: ["create", "update", "delete", "view", "approve", "ship", "cancel"],
	review: ["moderate", "delete", "view"],
	location: ["create", "update", "delete", "view"],
	report: ["view", "export"],
} as const;

export type Resource = keyof typeof statements;

export const ac = createAccessControl(statements);

/**
 * Roles (merge your custom perms with built-ins if you want to keep them)
 */
export const roles = {
	owner: ac.newRole({
		...ownerAc.statements,
		product: ["create", "update", "delete", "view"],
		stock: ["adjust", "view"],
		supplier: ["create", "update", "delete", "view"],
		order: ["create", "update", "delete", "view", "approve", "ship", "cancel"],
		review: ["moderate", "delete", "view"],
		location: ["create", "update", "delete", "view"],
		report: ["view", "export"],
	}),
	admin: ac.newRole({
		...adminAc.statements,
		product: ["create", "update", "view"],
		stock: ["adjust", "view"],
		supplier: ["create", "update", "view"],
		order: ["create", "update", "view", "approve", "ship"],
		review: ["moderate", "view"],
		location: ["create", "update", "view"],
		report: ["view", "export"],
	}),
	manager: ac.newRole({
		product: ["update", "view"],
		stock: ["adjust", "view"],
		supplier: ["view"],
		order: ["create", "update", "view", "ship"],
		review: ["view"],
		location: ["view"],
		report: ["view"],
	}),
	staff: ac.newRole({
		product: ["view"],
		stock: ["view"],
		order: ["create", "update", "view"],
		review: ["view"],
		location: ["view"],
	}),
} as const;
