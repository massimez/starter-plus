import { Resend } from "resend";
import { envData } from "@/env";

export const resend = envData.RESEND_KEY
	? new Resend(envData.RESEND_KEY)
	: null;
