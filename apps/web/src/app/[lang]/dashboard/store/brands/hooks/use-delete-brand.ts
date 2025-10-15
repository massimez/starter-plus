import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export function useDeleteBrand() {
	const queryClient = useQueryClient();

	const { mutate: deleteBrand, isPending: isDeletingBrand } = useMutation({
		mutationFn: async (brandId: string) => {
			const res = await hc.api.store.brands[":id"].$delete({
				param: { id: brandId },
			});

			return res.json();
		},
		onSuccess: () => {
			toast.success("Brand deleted successfully!");
			queryClient.invalidateQueries({
				queryKey: ["brands"],
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { deleteBrand, isDeletingBrand };
}
