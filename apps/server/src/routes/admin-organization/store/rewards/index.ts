import { createRouter } from "@/lib/create-hono-app";
import { bonusProgramRoute } from "./bonus-program/route";
import { couponRoute } from "./coupon/route";
import { milestoneRoute } from "./milestone/route";
import { pointsAdminRoute } from "./points/route";
import { referralRoute } from "./referral/route";
import { rewardRoute } from "./reward/route";
import { tierRoute } from "./tier/route";

export const rewardsRoutes = createRouter()
	.route("/", bonusProgramRoute)
	.route("/", tierRoute)
	.route("/", rewardRoute)
	.route("/", milestoneRoute)
	.route("/", referralRoute)
	.route("/", couponRoute)
	.route("/", pointsAdminRoute);
