import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../form";
import { Input } from "../input";
import { Switch } from "../switch";

// Switch field component for boolean values
export const SwitchFormField = ({
	control,
	name,
	labelKey,
	descriptionKey,
}: {
	control: any;
	name: string;
	labelKey: string;
	descriptionKey: string;
}) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 md:p-4">
					<div className="space-y-0.5">
						<FormLabel className="md:text-base">{labelKey}</FormLabel>
						<FormDescription>{descriptionKey}</FormDescription>
					</div>
					<FormControl>
						<Switch checked={field.value} onCheckedChange={field.onChange} />
					</FormControl>
				</FormItem>
			)}
		/>
	);
};

export const InputFormField = ({
	control,
	name,
	labelKey,
	placeholderKey,
	descriptionKey,
	component: Component = Input,
	...props
}: {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	control: any;
	name: string;
	labelKey: string;
	placeholderKey: string;
	descriptionKey?: string;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	component?: React.ComponentType<any>;
	// biome-ignore lint/suspicious/noExplicitAny: <>
	[key: string]: any;
}) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{labelKey}</FormLabel>
					<FormControl>
						<Component placeholder={placeholderKey} {...field} {...props} />
					</FormControl>
					{descriptionKey && (
						<FormDescription>{descriptionKey}</FormDescription>
					)}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
