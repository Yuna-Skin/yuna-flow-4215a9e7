import { queryOptions } from "@tanstack/react-query";
import { getModerationPosts, type ModerationStatus } from "@/lib/moderation.functions";

export const moderationPostsQueryOptions = (status: ModerationStatus) =>
  queryOptions({
    queryKey: ["moderation-posts", status],
    queryFn: () => getModerationPosts({ data: { status } }),
    staleTime: 15_000,
  });
