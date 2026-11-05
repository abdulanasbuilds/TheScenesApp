import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  CalendarDays,
  Check,
  Flag,
  Link2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PostCard } from "@/components/domain/cards";
import { CommunityShell } from "@/components/layout/community-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui";
import { communities, creators, getCommunity, getMember, posts } from "@/data/seed";
import { formatDate, formatCompact } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/c/$communityId/members/$memberId")({
  loader: ({ params }) => {
    const community = getCommunity(params.communityId);
    const member = getMember(params.memberId);
    const creator = creators.find((item) => item.id === params.memberId);
    if (!community || (!member && !creator)) throw notFound();
    return { community, member, creator };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.member?.name ?? loaderData?.creator?.name ?? "Profile"} — The Scenes`,
      },
    ],
  }),
  component: MemberProfilePage,
});

function MemberProfilePage() {
  const { community, member, creator } = Route.useLoaderData();
  const router = useRouter();
  const profile = member ?? creator!;
  const { toast } = useToast();
  const [following, setFollowing] = useState(false);
  const activity = posts.filter((post) => post.authorId === (member?.id ?? creator?.id));
  const profileCommunities = communities.filter((item) =>
    member ? member.communities.includes(item.slug) : creator?.communities.includes(item.slug),
  );
  const isCreator = Boolean(creator);

  const copyProfileLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Profile link copied", url);
    } catch {
      toast("Copy unavailable", `Copy this address manually: ${url}`);
    }
  };

  return (
    <CommunityShell community={community} active="members">
      <section className="border-b border-slate-200 bg-white">
        <div className="h-28 bg-indigo-700 sm:h-36" />
        <div className="mx-auto max-w-5xl px-4 pb-7 sm:px-6">
          <div className="-mt-11 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end">
            <Avatar
              name={profile.name}
              size={96}
              className="ring-4 ring-white"
              online={member?.online ?? true}
            />
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold text-slate-950 sm:text-3xl">
                  {profile.name}
                </h1>
                {isCreator ? (
                  <Badge tone="indigo">
                    <ShieldCheck className="h-3 w-3" /> Creator
                  </Badge>
                ) : member?.role !== "Member" ? (
                  <Badge tone="indigo">{member?.role}</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">@{profile.handle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={following ? "secondary" : "primary"}
                size="sm"
                onClick={() => {
                  setFollowing((value) => !value);
                  toast(
                    following ? "Unfollowed" : "Profile followed",
                    "Stored only for this page session.",
                  );
                }}
              >
                {following ? <Check className="h-4 w-4" /> : null}
                {following ? "Following" : "Follow"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast("Messaging unavailable", "Private messaging is a later product phase.")
                }
              >
                <MessageCircle className="h-4 w-4" /> Message
              </Button>
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    aria-label="Profile actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem onSelect={() => void copyProfileLink()}>
                    <Link2 className="h-4 w-4" /> Copy profile link
                  </DropdownItem>
                  <DropdownItem
                    onSelect={() => void router.navigate({ href: `/c/${community.slug}/members` })}
                  >
                    <Users className="h-4 w-4" /> Member directory
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    onSelect={() =>
                      toast(
                        "Report not sent",
                        "Profile reporting requires the later moderation backend.",
                      )
                    }
                  >
                    <Flag className="h-4 w-4" /> Report profile
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-700">{profile.bio}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {profile.location}
            </span>
            {member ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Joined {formatDate(member.joined)}
              </span>
            ) : (
              <span>{formatCompact(creator?.followers ?? 0)} followers</span>
            )}
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="min-w-0">
          <div className="mb-4">
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              Recent contributions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Public activity in this community preview.
            </p>
          </div>
          {activity.length ? (
            <div className="space-y-4">
              {activity.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="font-display text-lg font-bold text-slate-900">No public posts yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Contributions will appear here when this member posts.
              </p>
            </Card>
          )}
        </div>
        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              Community record
            </h2>
            {member ? (
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Level</dt>
                  <dd className="font-semibold text-slate-900">{member.level}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Points</dt>
                  <dd className="font-semibold text-slate-900">{formatCompact(member.points)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Role</dt>
                  <dd className="font-semibold text-slate-900">{member.role}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Community creator and host of {creator?.communities.length} public scene.
              </p>
            )}
          </Card>
          {member?.badges.length ? (
            <Card className="p-4">
              <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                <Award className="h-4 w-4 text-amber-600" /> Achievements
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {member.badges.map((badge) => (
                  <Badge key={badge} tone="amber">
                    {badge}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}
          <Card className="p-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
              Also a member of
            </h2>
            <div className="mt-3 space-y-2">
              {profileCommunities.map((item) => (
                <a
                  key={item.id}
                  href={`/c/${item.slug}`}
                  className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50"
                >
                  <span
                    className="h-7 w-7 rounded-md"
                    style={{ backgroundColor: `hsl(${item.accentHue} 48% 38%)` }}
                  />
                  <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                </a>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </CommunityShell>
  );
}
