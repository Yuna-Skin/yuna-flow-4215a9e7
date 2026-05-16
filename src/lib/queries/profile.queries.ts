import { queryOptions } from "@tanstack/react-query";
import { getMyProfileWithJourney } from "@/lib/profile.functions";

export const profileWithJourneyQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["profile-with-journey", userId],
    queryFn: () => getMyProfileWithJourney(),
    enabled: !!userId,
    staleTime: 60_000,
  });
