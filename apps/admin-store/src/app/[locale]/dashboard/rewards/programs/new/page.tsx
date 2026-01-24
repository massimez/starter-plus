import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { ProgramForm } from "../_components/program-form";

const NewProgramPage = () => {
	return (
		<div className="space-y-6 p-4">
			<div className="mb-4">
				<Link href="/dashboard/rewards/programs">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 pl-0 text-muted-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Programs
					</Button>
				</Link>
			</div>
			<PageDashboardHeader
				title="Create Bonus Program"
				description="Set up a new loyalty program for your store"
			/>
			<div className="mx-auto max-w-2xl">
				<ProgramForm />
			</div>
		</div>
	);
};

export default NewProgramPage;
