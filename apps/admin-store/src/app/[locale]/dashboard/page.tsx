import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";

export default function DashBoard() {
	return (
		<div className="overflow-hidden">
			<PageDashboardHeader
				title="Dashboard"
				description="Overview and quick stats"
			/>
			<div className="mt-4">
				<div />
			</div>
		</div>
	);
}
