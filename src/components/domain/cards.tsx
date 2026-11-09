import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Flag,
  Heart,
  Link2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Play,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import type { Community, Course, EventItem, Post, Product } from "@/data/types";
import { creators, currentUserId, getCreator, getMember, members } from "@/data/seed";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  CoverArt,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  Progress,
  buttonClass,
} from "@/components/ui";
import { useApp, useToast } from "@/store/app-store";
import { cn, formatCompact, formatDate, formatMoney, formatTime, relativeTime } from "@/lib/utils";

export function CommunityCard({
  community,
  compact = false,
}: {
  community: Community;
  compact?: boolean;
}) {
  const creator = getCreator(community.creatorHandle);
  const { state, joinCommunity, leaveCommunity, dataMode } = useApp();
  const { toast } = useToast();
  const joined = state.joined.includes(community.slug);
  const [membershipPending, setMembershipPending] = useState(false);

  return (
    <Card className="group overflow-hidden transition-colors hover:border-slate-300">
      <a href={`/communities/${community.slug}`} className="block">
        <CoverArt
          seed={community.slug}
          hue={community.accentHue}
          label={community.categorySlug.replaceAll("-", " ")}
          rounded="rounded-none"
          className={cn("w-full", compact ? "h-24" : "h-36")}
        />
        <div className={cn(compact ? "p-3.5" : "p-4")}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[17px] font-bold tracking-tight text-slate-900 group-hover:text-indigo-700">
                {community.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
                {community.tagline}
              </p>
            </div>
            {community.privacy === "private" ? (
              <Lock
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-label="Private community"
              />
            ) : null}
          </div>
          {!compact ? (
            <div className="mt-4 flex items-center gap-2">
              <Avatar name={creator?.name ?? "Creator"} size={26} />
              <span className="min-w-0 truncate text-xs font-medium text-slate-600">
                By {creator?.name ?? `@${community.creatorHandle}`}
              </span>
            </div>
          ) : null}
          {dataMode === "fixtures" ? (
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {formatCompact(community.members)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {community.rating}
              </span>
              <span className="ml-auto font-semibold text-slate-900">
                {community.pricing.type === "free"
                  ? "Free"
                  : `${formatMoney(community.pricing.amount)}/${community.pricing.interval === "month" ? "mo" : "yr"}`}
              </span>
            </div>
          ) : (
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
              Connected catalogue
            </p>
          )}
        </div>
      </a>
      <div className="border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() =>
            void (async () => {
              if (membershipPending) return;
              setMembershipPending(true);
              try {
                if (joined) {
                  await leaveCommunity(community.slug);
                  toast("Left community", `${community.name} was removed from your home.`);
                } else {
                  await joinCommunity(community.slug);
                  toast("Welcome to the scene", `${community.name} now appears in your home.`);
                }
              } catch (error) {
                toast(
                  "Membership was not changed",
                  error instanceof Error ? error.message : "Please try again.",
                );
              } finally {
                setMembershipPending(false);
              }
            })()
          }
          disabled={
            membershipPending ||
            (!joined && dataMode !== "fixtures" && community.privacy === "private")
          }
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors",
            joined
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
          )}
        >
          {joined ? <Check className="h-3.5 w-3.5" /> : null}
          {joined
            ? "Joined"
            : dataMode !== "fixtures" && community.privacy === "private"
              ? "Invite only"
              : community.pricing.type === "free"
                ? "Join free"
                : "View membership"}
        </button>
      </div>
    </Card>
  );
}

export function CommunityRow({ community }: { community: Community }) {
  const creator = getCreator(community.creatorHandle);
  const { dataMode } = useApp();
  return (
    <a
      href={`/communities/${community.slug}`}
      className="grid min-w-[780px] grid-cols-[2fr_1fr_0.7fr_0.7fr_0.8fr] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
          style={{ backgroundColor: `hsl(${community.accentHue} 48% 38%)` }}
        >
          {community.name
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-slate-900">{community.name}</span>
          <span className="block truncate text-xs text-slate-500">{community.tagline}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Avatar name={creator?.name ?? community.creatorHandle} size={24} />
        <span className="truncate text-xs font-medium text-slate-700">
          {creator?.name ?? `@${community.creatorHandle}`}
        </span>
      </div>
      <span className="font-semibold tabular-nums text-slate-900">
        {dataMode === "fixtures" ? formatCompact(community.members) : "—"}
      </span>
      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
        {dataMode === "fixtures" ? (
          <>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {community.rating}
          </>
        ) : (
          "—"
        )}
      </span>
      <span className="font-semibold text-slate-900">
        {community.pricing.type === "free" ? "Free" : `${formatMoney(community.pricing.amount)}/mo`}
      </span>
    </a>
  );
}

export function CourseCard({ course, progress }: { course: Course; progress?: number }) {
  const instructor = getCreator(course.instructorHandle);
  const lessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  return (
    <Card className="group overflow-hidden transition-colors hover:border-slate-300">
      <a href={`/c/${course.communitySlug}/classroom/${course.slug}`} className="block">
        <CoverArt
          seed={course.slug}
          hue={course.accentHue}
          rounded="rounded-none"
          className="h-36"
        />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Badge tone="outline">{course.level}</Badge>
            <span className="text-[11px] text-slate-500">{course.hours} hours</span>
          </div>
          <h3 className="mt-3 font-display text-lg font-bold leading-snug tracking-tight text-slate-900 group-hover:text-indigo-700">
            {course.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {course.subtitle}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Avatar name={course.instructorName ?? instructor?.name ?? "Instructor"} size={25} />
            <span>
              {course.instructorName ?? instructor?.name ?? `@${course.instructorHandle}`}
            </span>
            <span className="ml-auto">{lessons} lessons</span>
          </div>
          {typeof progress === "number" ? (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-slate-500">
                <span>{progress ? "In progress" : "Not started"}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Users className="h-3.5 w-3.5" /> {formatCompact(course.students)} learners
              </span>
              <span className="font-bold text-slate-900">
                {course.price === "included" ? "Included" : formatMoney(course.price)}
              </span>
            </div>
          )}
        </div>
      </a>
    </Card>
  );
}

export function EventCard({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  const host = getCreator(event.hostHandle);
  const { state, toggleRsvp } = useApp();
  const { toast } = useToast();
  const going = state.rsvps.includes(event.id);
  return (
    <Card className={cn("p-4", compact && "p-3.5")}>
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-indigo-50 text-indigo-800">
          <span className="text-[10px] font-bold uppercase">
            {new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(event.start))}
          </span>
          <span className="font-display text-lg font-extrabold leading-none">
            {new Date(event.start).getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={`/c/${event.communitySlug}/events/${event.id}`}
            className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-indigo-700"
          >
            {event.title}
          </a>
          <p className="mt-1 text-xs text-slate-500">
            {formatTime(event.start)} · {event.timezone} · {host?.name}
          </p>
        </div>
      </div>
      {!compact ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">{event.attendees} going</span>
          <Button
            variant={going ? "secondary" : "soft"}
            size="sm"
            onClick={() => {
              toggleRsvp(event.id);
              toast(
                going ? "RSVP removed" : "You’re on the list",
                going ? undefined : "This is saved locally in the frontend preview.",
              );
            }}
          >
            {going ? "Going ✓" : "RSVP"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const creator = getCreator(product.creatorHandle);
  const { state, toggleSave } = useApp();
  const saved = state.saved.includes(product.slug);
  return (
    <Card className="group overflow-hidden">
      <div className="relative">
        <a href={`/marketplace/${product.slug}`}>
          <CoverArt
            seed={product.slug}
            hue={product.accentHue}
            rounded="rounded-none"
            className="h-40"
          />
        </a>
        <button
          type="button"
          onClick={() => toggleSave(product.slug)}
          aria-label={saved ? "Remove from saved items" : "Save item"}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm hover:text-indigo-700"
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-indigo-700 text-indigo-700")} />
        </button>
      </div>
      <a href={`/marketplace/${product.slug}`} className="block p-4">
        <div className="flex items-center gap-2">
          {product.bestseller ? <Badge tone="clay">Bestseller</Badge> : null}
          <span className="text-[11px] font-semibold text-slate-500">{product.category}</span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-700">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{product.blurb}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <Avatar name={creator?.name ?? "Creator"} size={24} />
            <span className="text-xs font-medium text-slate-600">{creator?.name}</span>
          </div>
          <span className="font-display text-lg font-extrabold text-slate-900">
            {formatMoney(product.price)}
          </span>
        </div>
      </a>
    </Card>
  );
}

export function PostCard({ post, detailHref }: { post: Post; detailHref?: string }) {
  const author =
    creators.find((creator) => creator.id === post.authorId) ?? getMember(post.authorId);
  const router = useRouter();
  const { state, toggleLike, toggleSave } = useApp();
  const { toast } = useToast();
  const liked = state.likedPosts.includes(post.id);
  const saved = state.saved.includes(post.id);
  const href = detailHref ?? `/c/${post.communitySlug}/posts/${post.id}`;

  const copyPostLink = async () => {
    const url = new URL(href, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied", url);
    } catch {
      toast("Copy unavailable", `Copy this address manually: ${url}`);
    }
  };

  return (
    <Card as="article" className="overflow-hidden">
      {post.pinned ? (
        <div className="flex items-center gap-1.5 border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-[11px] font-bold tracking-wide text-indigo-800 uppercase sm:px-5">
          <Bookmark className="h-3.5 w-3.5 fill-indigo-800" /> Pinned by the community team
        </div>
      ) : null}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <a href={`/c/${post.communitySlug}/members/${post.authorId}`}>
            <Avatar
              name={author?.name ?? "Member"}
              size={40}
              online={
                "online" in (author ?? {})
                  ? Boolean((author as { online?: boolean }).online)
                  : false
              }
            />
          </a>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <a
                href={`/c/${post.communitySlug}/members/${post.authorId}`}
                className="text-sm font-bold text-slate-900 hover:text-indigo-700"
              >
                {author?.name}
              </a>
              {"verified" in (author ?? {}) && (author as { verified?: boolean }).verified ? (
                <Badge tone="indigo" className="px-1.5 py-0 text-[9px]">
                  ✓
                </Badge>
              ) : null}
              <span className="text-xs text-slate-600">{relativeTime(post.createdAt)}</span>
            </div>
            <Badge tone="slate" className="mt-1.5 px-2 py-1 text-[10px]">
              {post.category}
            </Badge>
          </div>
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Post menu"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem onSelect={() => toggleSave(post.id)}>
                <Bookmark className="h-4 w-4" /> {saved ? "Remove saved post" : "Save post"}
              </DropdownItem>
              {post.authorId === currentUserId ? (
                <DropdownItem
                  onSelect={() =>
                    void router.navigate({
                      href: `/c/${post.communitySlug}/posts/new?edit=${encodeURIComponent(post.id)}`,
                    })
                  }
                >
                  <Pencil className="h-4 w-4" /> Edit post
                </DropdownItem>
              ) : null}
              <DropdownItem onSelect={() => void copyPostLink()}>
                <Link2 className="h-4 w-4" /> Copy discussion link
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                onSelect={() =>
                  toast(
                    "Report not sent",
                    "Moderation reporting is not connected in this frontend preview.",
                  )
                }
              >
                <Flag className="h-4 w-4" /> Report discussion
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>

        {post.title ? (
          <a href={href}>
            <h2 className="mt-4 font-display text-lg font-bold leading-snug tracking-tight text-slate-900 hover:text-indigo-700 sm:text-xl">
              {post.title}
            </h2>
          </a>
        ) : null}
        <p className={cn("text-sm leading-7 text-slate-700", post.title ? "mt-2" : "mt-4")}>
          {post.body}
        </p>

        {post.attachment ? (
          <a
            href={href}
            className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-slate-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-indigo-700 ring-1 ring-slate-200">
              {post.attachment.kind === "image" ? (
                <Play className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                {post.attachment.label}
              </span>
              <span className="text-xs text-slate-500">{post.attachment.meta}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
          </a>
        ) : null}

        <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => toggleLike(post.id)}
            aria-pressed={liked}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors",
              liked
                ? "bg-rose-50 text-rose-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-rose-600")} /> {post.likes}
          </button>
          <a
            href={href}
            className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <MessageCircle className="h-4 w-4" /> {post.comments.length}
          </a>
          <button
            type="button"
            onClick={() => void copyPostLink()}
            className="ml-auto rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Share
          </button>
        </div>

        {post.comments.length > 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <AvatarStack
              names={post.comments
                .slice(0, 3)
                .map((comment) => getMember(comment.authorId)?.name ?? "Member")}
              max={3}
            />
            <a href={href} className="text-xs font-semibold text-slate-600 hover:text-indigo-700">
              Join the discussion
            </a>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function MiniLearningCard({
  title,
  community,
  progress,
  href,
}: {
  title: string;
  community: string;
  progress: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
          <Play className="h-4 w-4 fill-indigo-700" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{community}</p>
          <div className="mt-3 flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-[11px] font-semibold text-slate-500">{progress}%</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export function EventMeta({ event }: { event: EventItem }) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="flex gap-2">
        <CalendarDays className="mt-0.5 h-4 w-4 text-indigo-700" />
        <div>
          <dt className="text-xs font-semibold text-slate-500">Date</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{formatDate(event.start)}</dd>
        </div>
      </div>
      <div className="flex gap-2">
        <Clock3 className="mt-0.5 h-4 w-4 text-indigo-700" />
        <div>
          <dt className="text-xs font-semibold text-slate-500">Time</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {formatTime(event.start)} · {event.timezone}
          </dd>
        </div>
      </div>
    </dl>
  );
}

export function PurchaseButton({ product }: { product: Product }) {
  const { state } = useApp();
  const purchased = state.purchases.includes(product.id);
  return (
    <a
      href={`/marketplace/${product.slug}`}
      className={buttonClass(purchased ? "secondary" : "primary", "lg", "w-full")}
    >
      {purchased ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {purchased ? "Purchased" : `Get it for ${formatMoney(product.price)}`}
    </a>
  );
}

export const sampleMemberNames = members.slice(0, 6).map((member) => member.name);
