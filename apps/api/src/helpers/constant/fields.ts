const auditFields = {
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	createdBy: true,
	updatedBy: true,
} as const;

export const idAndAuditFields = {
	id: true,
	organizationId: true,
	...auditFields,
} as const;
