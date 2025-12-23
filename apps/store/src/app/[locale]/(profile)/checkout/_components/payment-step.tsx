import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Check, CreditCard } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CheckoutFormValues } from "./validation";

interface PaymentStepProps {
	form: UseFormReturn<CheckoutFormValues>;
}

export function PaymentStep({ form }: PaymentStepProps) {
	return (
		<div className="space-y-4">
			<div className="">
				<div className="mb-4">
					<CardTitle className="flex items-center gap-3 text-xl">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<CreditCard className="h-5 w-5 text-primary" />
						</div>
						Payment Method
					</CardTitle>
				</div>
				<div className="space-y-6">
					<div className="rounded-xl border-2 bg-linear-to-br from-blue-50 to-cyan-50 p-6 shadow-sm dark:from-blue-950/30 dark:to-cyan-950/30">
						<div className="flex items-center gap-4">
							<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500 text-white shadow-blue-500/30 shadow-lg">
								<span className="font-bold text-2xl">$</span>
							</div>
							<div className="flex-1">
								<h3 className="font-bold text-lg">Cash on Delivery</h3>
								<p className="text-muted-foreground text-sm">
									Pay when your order arrives at your doorstep
								</p>
							</div>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
								<Check className="h-5 w-5" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<Card className="border-2 shadow-sm transition-shadow duration-300 hover:shadow-md">
				<CardHeader>
					<CardTitle className="text-xl">Contact Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<FormField
						control={form.control}
						name="customerInfo.fullName"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="font-semibold text-sm">
									Full Name *
								</FormLabel>
								<FormControl>
									<Input
										placeholder="John Doe"
										className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										{...field}
									/>
								</FormControl>
								<FormMessage className="mt-1.5" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="customerInfo.email"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="font-semibold text-sm">
									Email Address *
								</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="john@example.com"
										className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										{...field}
									/>
								</FormControl>
								<FormMessage className="mt-1.5" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="customerInfo.phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="font-semibold text-sm">
									Phone Number *
								</FormLabel>
								<FormControl>
									<Input
										type="tel"
										placeholder="(555) 123-4567"
										className="h-12 rounded-lg border-2 px-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
										{...field}
									/>
								</FormControl>
								<FormMessage className="mt-1.5" />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
