import {fetchApi} from '@/lib/services/api';

export type PublicSharedMember = {
  id?: string;
  name?: string | null;
  description?: string | null;
  imageSignedUrl?: string | null;
  imagePath?: string | null;
  avatar?: string | null;
  hasImage?: boolean | null;
  hairDescription?: string | null;
  faceDescription?: string | null;
  matches?: Record<string, any> | null;
  [k: string]: any;
};

export type PublicShareResponse = {
  status: string;
  data: { referencePerson: PublicSharedMember };
};

/**
 * Fetch public shared member details
 * GET /api/public/shares/groups/:groupShareId/members/:memberShareId
 * (API_URL already contains /api)
 */
export async function getPublicSharedMember(
  groupShareId: string,
  memberShareId: string
): Promise<PublicSharedMember | null> {
  const endpoint = `/public/shares/groups/${encodeURIComponent(groupShareId)}/members/${encodeURIComponent(memberShareId)}`;
  const payload = await fetchApi<PublicShareResponse>(endpoint, { method: 'GET' });
  // API returns { status: 'success', data: { referencePerson: person } }
  const person = (payload as any)?.data?.referencePerson as PublicSharedMember | undefined;
  return person ?? null;
}
