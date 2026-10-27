import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { parseProjectList } from "@/lib/project-data";
import { SITE_HOST } from "@/lib/site";

export const getProfile = cache(async () => {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) return null;

  return { ...profile, aliases: parseProjectList(profile.aliases) };
});

export type PortfolioProfile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

export function displayName(profile: PortfolioProfile | null): string {
  return profile?.name.trim() || SITE_HOST;
}

export type AliasIdentity = {
  displayName?: string;
  username?: string;
};

const compact = (value: string) => value.replace(/\s+/g, "").toLowerCase();

export function aliasIdentities(aliases: string[]): AliasIdentity[] {
  const usernames = aliases.filter((alias) => !/\s/.test(alias));
  const identities: AliasIdentity[] = aliases
    .filter((alias) => /\s/.test(alias))
    .map((displayName) => ({
      displayName,
      username: usernames.find((username) => compact(username) === compact(displayName)),
    }));
  const paired = new Set(identities.map((identity) => identity.username));

  return [
    ...identities,
    ...usernames
      .filter((username) => !paired.has(username))
      .map((username) => ({ username })),
  ];
}

export function formatIdentity(identity: AliasIdentity): string {
  return [identity.displayName, identity.username && `@${identity.username}`]
    .filter(Boolean)
    .join(" ");
}

export function displayTitle(profile: PortfolioProfile | null): string {
  const name = displayName(profile);
  const username = aliasIdentities(profile?.aliases ?? []).find((identity) => identity.username)?.username;
  return username ? `${name} @${username}` : name;
}
