import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MapPin, Star, Users } from "lucide-react";
import { CommunityCard, CourseCard, ProductCard } from "@/components/domain/cards";
import { PublicShell } from "@/components/layout/public-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { communities, courses, getCreator, products } from "@/data/seed";
import { formatCompact } from "@/lib/utils";
import { useApp, useToast } from "@/store/app-store";

export const Route = createFileRoute("/creators/$handle")({
  loader: ({ params }) => {
    const creator = getCreator(params.handle);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.creator.name ?? "Creator"} — The Scenes` }],
  }),
  component: CreatorProfilePage,
});

function CreatorProfilePage() {
  const { creator } = Route.useLoaderData();
  const { state, toggleFollow } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const followed = state.following.includes(creator.handle);
  const creatorCommunities = communities.filter((community) =>
    creator.communities.includes(community.slug),
  );
  const creatorCourses = courses.filter((course) => course.instructorHandle === creator.handle);
  const creatorProducts = products.filter((product) => product.creatorHandle === creator.handle);

  return (
    <PublicShell>
      <section className="border-b border-slate-200 bg-white">
        <div className="h-32 bg-indigo-700 sm:h-44" />
        <div className="mx-auto max-w-6xl px-4 pb-7 sm:px-6 lg:px-8">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end">
            <Avatar name={creator.name} size={112} className="ring-4 ring-white" online />
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">
                  {creator.name}
                </h1>
                {creator.verified ? (
                  <Badge tone="indigo">
                    <Check className="h-3 w-3" /> Verified
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">@{creator.handle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={followed ? "secondary" : "primary"}
                onClick={() => {
                  toggleFollow(creator.handle);
                  toast(
                    followed ? "Unfollowed" : "Creator followed",
                    "Follow state is stored locally for this preview.",
                  );
                }}
              >
                {followed ? <Check className="h-4 w-4" /> : null}
                {followed ? "Following" : "Follow"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast("Message unavailable", "Direct messaging belongs to a later product phase.")
                }
              >
                Message
              </Button>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">{creator.headline}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {creator.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {formatCompact(creator.followers)} followers
            </span>
            <span>{creatorCommunities.length} communities</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
          <div className="mt-7">
            <TabsContent value="overview">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <Card className="p-5 sm:p-7">
                  <h2 className="font-display text-xl font-extrabold text-slate-900">
                    About {creator.name.split(" ")[0]}
                  </h2>
                  <p className="mt-3 text-[15px] leading-7 text-slate-700">{creator.bio}</p>
                  <h3 className="mt-7 text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                    Works in
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {creator.expertise.map((item) => (
                      <Badge key={item} tone="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </Card>
                <div className="space-y-4">
                  <Card className="p-4">
                    <h2 className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                      Creator record
                    </h2>
                    <dl className="mt-3 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Followers</dt>
                        <dd className="font-semibold text-slate-900">
                          {formatCompact(creator.followers)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Course learners</dt>
                        <dd className="font-semibold text-slate-900">
                          {formatCompact(
                            creatorCourses.reduce((sum, course) => sum + course.students, 0),
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Average rating</dt>
                        <dd className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{" "}
                          {creatorCourses[0]?.rating ?? "New"}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                  <Card className="p-4">
                    <h2 className="text-sm font-bold text-slate-900">What to expect</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Specific examples, real constraints and work you can apply immediately. No
                      income promises or fabricated outcomes.
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="communities">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {creatorCommunities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="courses">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {creatorCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="products">
              {creatorProducts.length ? (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {creatorProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <Card className="p-10 text-center">
                  <p className="font-display text-lg font-bold text-slate-900">
                    No public products yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    This creator has not published marketplace items in the preview catalogue.
                  </p>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PublicShell>
  );
}
