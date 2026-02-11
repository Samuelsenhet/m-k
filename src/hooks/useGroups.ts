/**
 * Alias for useCollections for Chat page compatibility (Samlingar / groups).
 * Prefer useCollections elsewhere.
 */
import {
  useCollections,
  type CollectionWithMeta,
} from "@/hooks/useCollections";

export type SamlingGroup = CollectionWithMeta;

export function useGroups() {
  const {
    list: groups,
    create: createGroup,
    leave: leaveGroup,
    refetch: refreshGroups,
  } = useCollections();

  return {
    groups,
    createGroup,
    leaveGroup,
    refreshGroups,
  };
}
