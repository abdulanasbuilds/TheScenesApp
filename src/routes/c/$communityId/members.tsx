import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Search, Users } from "lucide-react";
import { CommunityShell } from "@/components/layout/community-shell";
import { Avatar, Badge, Card, Chip, EmptyState, Select } from "@/components/ui";
import { getCommunity, members } from "@/data/seed";
import { formatCompact } from "@/lib/utils";

export const Route = createFileRoute("/c/$communityId/members")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    if (!community) throw notFound();
    return { community };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Members · ${loaderData?.community.name ?? "The Scenes"}` }],
  }),
  component: MembersDirectoryPage,
});

function MembersDirectoryPage() {
  const { community } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const directory = useMemo(
    () =>
      members.filter((member) => {
        const communityMatch =
          member.communities.includes(community.slug) || community.slug === "ai-builders-guild";
        const queryMatch =
          !query.trim() ||
          `${member.name} ${member.handle} ${member.headline} ${member.location}`
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        const roleMatch = role === "all" || member.role.toLowerCase() === role;
        const statusMatch =
          status === "all" || (status === "online" ? member.online : !member.online);
        return communityMatch && queryMatch && roleMatch && statusMatch;
      }),
    [community.slug, query, role, status],
  );

  return (
    <CommunityShell community={community} active="members">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                People in this room
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Members
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {formatCompact(community.members)} members · {community.online} online now
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="member-search" className="sr-only">
                Search members
              </label>
              <input
                id="member-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, skill or city"
                className="h-10 w-full rounded-lg border border-slate-300 pr-3 pl-9 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Chip active={status === "all"} onClick={() => setStatus("all")}>
              Everyone
            </Chip>
            <Chip active={status === "online"} onClick={() => setStatus("online")}>
              ● Online
            </Chip>
            <Chip active={status === "offline"} onClick={() => setStatus("offline")}>
              Offline
            </Chip>
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="ml-auto w-36 border-0 bg-slate-50"
            >
              <option value="all">All roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="member">Member</option>
            </Select>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">{directory.length} preview profiles</p>
          <p className="text-xs text-slate-500">Sorted by recent activity</p>
        </div>
        {directory.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {directory.map((member) => (
              <a
                key={member.id}
                href={`/c/${community.slug}/members/${member.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={member.name} size={48} online={member.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-bold text-slate-900">{member.name}</h2>
                      {member.role !== "Member" ? <Badge tone="indigo">{member.role}</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">@{member.handle}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                  {member.headline}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {member.location.split(",")[0]}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Level {member.level} · {formatCompact(member.points)} pts
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No members match"
            description="Try a different name, role or activity filter."
          />
        )}
      </div>
    </CommunityShell>
  );
}
