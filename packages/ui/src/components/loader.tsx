import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const loaderVariants = cva("animate-spin rounded-full border-t-2 border-b-2", {
	variants: {
		size: {
			sm: "h-8 w-8 border-2",
			md: "h-16 w-16 border-2",
			lg: "h-32 w-32 border-2",
			xl: "h-48 w-48 border-4",
		},
		color: {
			primary: "border-primary",
			violet: "border-violet-500",
			secondary: "border-secondary",
			muted: "border-muted-foreground",
		},
	},
	defaultVariants: {
		size: "lg",
		color: "violet",
	},
});

type LoaderVariantProps = VariantProps<typeof loaderVariants>;

interface LoaderProps {
	className?: string;
	size?: LoaderVariantProps["size"];
	color?: LoaderVariantProps["color"];
}

export function Loader({ className, size, color }: LoaderProps) {
	return <div className={cn(loaderVariants({ size, color }), className)} />;
}

interface LoaderContainerProps {
	className?: string;
	minHeight?: string;
	children?: React.ReactNode;
}

export function LoaderContainer({
	className,
	minHeight = "min-h-[400px]",
	children,
}: LoaderContainerProps) {
	return (
		<div
			className={cn("flex items-center justify-center", minHeight, className)}
		>
			{children || <Loader />}
		</div>
	);
}
