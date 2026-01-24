import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export const useDeleteClient = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: async (clientId: string) => {
			const response = await hc.api.store.clients[":id"].$delete({
				param: { id: clientId },
			});

			if (!response.ok) {
				throw new Error("Failed to delete client");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Client deleted successfully!");
			queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete client");
		},
	});

	return {
		deleteClient: mutation.mutate,
		isDeletingClient: mutation.isPending,
	};
};
