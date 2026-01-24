import { useTranslations } from "next-intl";

export function CodePreviewSection() {
	const t = useTranslations("CodePreview");
	return (
		<section className="bg-muted/30 py-20">
			<div className="container mx-auto px-4">
				<div className="mx-auto max-w-6xl">
					<div className="mb-16 text-center">
						<h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">
							{t("heading")}
						</h2>
						<p className="text-lg text-muted-foreground">{t("subheading")}</p>
					</div>

					<div className="overflow-hidden rounded-xl border bg-background shadow-2xl">
						<div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
							<div className="flex gap-2">
								<div className="h-3 w-3 rounded-full bg-red-500" />
								<div className="h-3 w-3 rounded-full bg-yellow-500" />
								<div className="h-3 w-3 rounded-full bg-green-500" />
							</div>
							<div className="ms-4 font-mono text-muted-foreground text-sm">
								{t("filename")}
							</div>
						</div>

						<div className="overflow-x-auto p-6 font-mono text-sm">
							<pre className="text-muted-foreground">
								<code>{`import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)`}</code>
							</pre>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
