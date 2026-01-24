import { parseAsString } from "nuqs";

export const financialSearchParams = {
	status: parseAsString,
	from: parseAsString,
	to: parseAsString,
	categoryId: parseAsString,
};
