import { queryOptions } from "@tanstack/react-query";
import { getCommunityFeed, getPostComments } from "@/lib/community.functions";

export const communityFeedQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["community-feed", userId],
    queryFn: () => getCommunityFeed(),
    enabled: !!userId,
    staleTime: 30_000,
  });

export const postCommentsQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ["post-comments", postId],
    queryFn: () => getPostComments({ data: { postId } }),
    staleTime: 15_000,
  });
