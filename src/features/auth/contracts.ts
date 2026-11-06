import { z } from "zod";

export const publicProfileSchema = z.object({
  id: z.string().uuid(),
  handle: z.string(),
  displayName: z.string(),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;

export type ViewerDTO = PublicProfile &
  Readonly<{
    accountEmail: string;
    joinedCommunities: readonly Readonly<{
      id: string;
      slug: string;
      name: string;
      accentHue: number;
    }>[];
  }>;
