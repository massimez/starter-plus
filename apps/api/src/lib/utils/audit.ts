export function getAuditData(
	user: { id: string },
	action: "create" | "update" | "delete",
) {
	if (action === "create") {
		return {
			createdBy: user.id,
			updatedBy: user.id,
		};
	}

	if (action === "update") {
		return {
			updatedBy: user.id,
		};
	}

	if (action === "delete") {
		return {
			deletedAt: new Date(),
			updatedBy: user.id,
		};
	}

	return {};
}
