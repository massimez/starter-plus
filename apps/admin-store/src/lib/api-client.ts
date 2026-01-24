import { hcWithType } from "@workspace/server/hc";

export const hc = hcWithType(process.env.NEXT_PUBLIC_API_BASE_URL || "", {
	init: { credentials: "include" },
});
