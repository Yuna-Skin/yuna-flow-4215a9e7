import { queryOptions } from "@tanstack/react-query";
import { getDayDetail } from "@/lib/day.functions";

export const dayDetailQueryOptions = (dayId: string) =>
  queryOptions({
    queryKey: ["day-detail", dayId],
    queryFn: () => getDayDetail({ data: { dayId } }),
    staleTime: 45 * 60_000,
  });
