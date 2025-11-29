import { Resend } from "resend";
import env from "../../env";

export const resend = env.RESEND_KEY ? new Resend(env.RESEND_KEY) : null;
