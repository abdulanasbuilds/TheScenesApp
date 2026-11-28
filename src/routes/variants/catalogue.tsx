import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  Earth,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { categories, communities, courses } from "@/data/seed";
import { formatCompact, formatMoney } from "@/lib/utils";
import cssText from "../../variants/catalogue.css?raw";

const jsx: any = _jsx;
const jsxs: any = _jsxs;

var publicLinks = [
	{
		href: "/explore",
		label: "Explore"
	},
	{
		href: "/marketplace",
		label: "Marketplace"
	},
	{
		href: "/pricing",
		label: "Pricing"
	},
	{
		href: "/become-a-teacher",
		label: "For creators"
	}
];
var categoryName = (slug: string) => categories.find((category) => category.slug === slug)?.name ?? "";
var priceLabel = (community: any) => community.pricing.type === "free" ? "Free" : `${formatMoney(community.pricing.amount)}/mo`;
function Catalogue() {
	const indexCommunities = communities.slice(0, 5);
	const featuredCommunities = communities.filter((community) => community.featured).slice(0, 3);
	const featuredCourses = courses.slice(0, 3);
	return /* @__PURE__ */ jsxs("div", {
		className: "v-catalogue",
		children: [
			/* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: cssText } }),
			/* @__PURE__ */ jsxs("aside", {
				className: "vp-strip",
				"aria-label": "Variant preview navigation",
				children: [
					/* @__PURE__ */ jsx("span", { children: "Variant preview" }),
					/* @__PURE__ */ jsx("a", {
						href: "/variants",
						children: "All variants"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "/variants/call-sheet",
						children: "Call sheet"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "/variants/night-studio",
						children: "Night studio"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "/variants/catalogue",
						"aria-current": "page",
						children: "Catalogue"
					})
				]
			}),
			/* @__PURE__ */ jsx("header", {
				className: "ct-nav",
				children: /* @__PURE__ */ jsxs("div", {
					className: "ct-wrap ct-nav__in",
					children: [
						/* @__PURE__ */ jsxs("a", {
							className: "ct-mark",
							href: "/",
							children: [/* @__PURE__ */ jsx("span", {
								className: "ct-mark__tile",
								"aria-hidden": "true",
								children: "S"
							}), "The Scenes"]
						}),
						/* @__PURE__ */ jsx("nav", {
							className: "ct-nav__links",
							"aria-label": "Main navigation",
							children: publicLinks.map((item) => /* @__PURE__ */ jsx("a", {
								href: item.href,
								children: item.label
							}, item.href))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ct-nav__actions",
							children: [/* @__PURE__ */ jsx("a", {
								className: "ct-nav__login",
								href: "/login",
								children: "Log in"
							}), /* @__PURE__ */ jsx("a", {
								className: "ct-btn ct-btn--primary ct-btn--sm",
								href: "/register",
								children: "Join free"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ jsxs("main", {
				id: "main-content",
				children: [
					/* @__PURE__ */ jsx("section", {
						className: "ct-hero",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap ct-hero__grid",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("h1", { children: "Learn practical skills with people doing the work." }),
								/* @__PURE__ */ jsx("p", {
									className: "ct-hero__lede",
									children: "Focused communities, useful courses and honest working notes."
								}),
								/* @__PURE__ */ jsxs("form", {
									action: "/search",
									method: "get",
									className: "ct-search",
									role: "search",
									children: [
										/* @__PURE__ */ jsx("label", {
											className: "ct-sr",
											htmlFor: "ct-search",
											children: "Search communities and courses"
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "ct-search__field",
											children: [/* @__PURE__ */ jsx(Search, {
												className: "ct-i",
												"aria-hidden": "true"
											}), /* @__PURE__ */ jsx("input", {
												id: "ct-search",
												name: "q",
												type: "search",
												placeholder: "What do you want to learn?"
											})]
										}),
										/* @__PURE__ */ jsx("button", {
											type: "submit",
											className: "ct-btn ct-btn--primary",
											children: "Explore The Scenes"
										})
									]
								}),
								/* @__PURE__ */ jsxs("ul", {
									className: "ct-trust",
									children: [
										/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(CircleCheck, {
											className: "ct-i",
											"aria-hidden": "true"
										}), "Free communities available"] }),
										/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(ShieldCheck, {
											className: "ct-i",
											"aria-hidden": "true"
										}), "Creator-led, moderated spaces"] }),
										/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(Earth, {
											className: "ct-i",
											"aria-hidden": "true"
										}), "Learn from anywhere"] })
									]
								})
							] }), /* @__PURE__ */ jsxs("div", {
								className: "ct-index",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "ct-index__head",
									children: [
										/* @__PURE__ */ jsx("span", { children: "Scene" }),
										/* @__PURE__ */ jsx("span", { children: "Field" }),
										/* @__PURE__ */ jsx("span", { children: "Members" }),
										/* @__PURE__ */ jsx("span", { children: "Plan" })
									]
								}), indexCommunities.map((community, index) => /* @__PURE__ */ jsxs("a", {
									className: `ct-index__row${index === 0 ? " ct-index__row--lead" : ""}`,
									href: `/communities/${community.slug}`,
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "ct-index__name",
											children: community.name
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-index__cell",
											children: categoryName(community.categorySlug)
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-index__cell",
											children: formatCompact(community.members)
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-index__price",
											children: priceLabel(community)
										})
									]
								}, community.id))]
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-sec ct-pillars",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap",
							children: [/* @__PURE__ */ jsx("h2", { children: "Built for people who want to do more than watch" }), /* @__PURE__ */ jsx("div", {
								className: "ct-pillars__grid",
								children: [
									[
										Users,
										"Focused communities",
										"Discuss real work"
									],
									[
										BookOpen,
										"Practical classrooms",
										"Learn in sequence"
									],
									[
										CalendarDays,
										"Live sessions",
										"Ask and apply"
									],
									[
										Sparkles,
										"Creator tools",
										"Teach and grow"
									]
								].map(([Icon, title, description], index) => {
									return /* @__PURE__ */ jsxs("div", {
										className: "ct-pillar",
										children: [/* @__PURE__ */ jsxs("h3", { children: [/* @__PURE__ */ jsx("span", {
											className: "ct-pillar__ord",
											children: `0${index + 1}`
										}), String(title)] }), /* @__PURE__ */ jsx("p", { children: String(description) })]
									}, String(title));
								})
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-sec",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "ct-head",
									children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "The room, the classroom and the numbers in one place." }), /* @__PURE__ */ jsx("p", { children: "These are screenshots from the working product, filled with sample data so you can judge the fit before you create an account." })] }), /* @__PURE__ */ jsxs("a", {
										className: "ct-link",
										href: "/explore",
										children: ["Open the preview", /* @__PURE__ */ jsx(ArrowRight, {
											className: "ct-i",
											"aria-hidden": "true"
										})]
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "ct-shots",
									children: [/* @__PURE__ */ jsxs("figure", {
										className: "ct-shot ct-shot--lead",
										children: [/* @__PURE__ */ jsx("img", {
											src: "/media/screens/creator-overview.jpg",
											alt: "Creator overview showing member counts, weekly posts, course learners and sample gross sales.",
											loading: "lazy",
											decoding: "async"
										}), /* @__PURE__ */ jsxs("figcaption", { children: [/* @__PURE__ */ jsx("span", { children: "Creator overview" }), /* @__PURE__ */ jsx("span", { children: "Sample data" })] })]
									}), /* @__PURE__ */ jsxs("div", {
										className: "ct-shots__stack",
										children: [
											/* @__PURE__ */ jsxs("figure", {
												className: "ct-shot",
												children: [/* @__PURE__ */ jsx("img", {
													src: "/media/screens/community-home.jpg",
													alt: "Community home for the AI Builders Guild with the post feed, upcoming events and member activity.",
													loading: "lazy",
													decoding: "async"
												}), /* @__PURE__ */ jsx("figcaption", { children: /* @__PURE__ */ jsx("span", { children: "Community home" }) })]
											}),
											/* @__PURE__ */ jsxs("figure", {
												className: "ct-shot",
												children: [/* @__PURE__ */ jsx("img", {
													src: "/media/screens/classroom-lesson.jpg",
													alt: "Classroom lesson page with the course outline, lesson content and progress controls.",
													loading: "lazy",
													decoding: "async"
												}), /* @__PURE__ */ jsx("figcaption", { children: /* @__PURE__ */ jsx("span", { children: "Classroom lesson" }) })]
											}),
											/* @__PURE__ */ jsxs("figure", {
												className: "ct-shot",
												children: [/* @__PURE__ */ jsx("img", {
													src: "/media/screens/explore.jpg",
													alt: "Explore page with category filters and community results.",
													loading: "lazy",
													decoding: "async"
												}), /* @__PURE__ */ jsx("figcaption", { children: /* @__PURE__ */ jsx("span", { children: "Explore" }) })]
											})
										]
									})]
								}),
								/* @__PURE__ */ jsx("p", {
									className: "ct-note",
									children: "Captured from the running app with sample data. Payments, image uploads and live video are coming soon."
								})
							]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-sec",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ct-head",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Communities with a point of view." }), /* @__PURE__ */ jsx("p", { children: "Not another endless feed. Each scene has a clear purpose, working practitioners and a structured path from question to action." })] }), /* @__PURE__ */ jsxs("a", {
									className: "ct-link",
									href: "/explore",
									children: ["Explore all", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ct-i",
										"aria-hidden": "true"
									})]
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "ct-ledger",
								children: featuredCommunities.map((community, index) => /* @__PURE__ */ jsxs("a", {
									className: "ct-ledger__row",
									href: `/communities/${community.slug}`,
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "ct-ledger__num",
											children: `0${index + 1}`
										}),
										/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
											className: "ct-ledger__name",
											children: community.name
										}), /* @__PURE__ */ jsx("span", {
											className: "ct-ledger__tag",
											children: community.tagline
										})] }),
										/* @__PURE__ */ jsxs("span", {
											className: "ct-ledger__facts",
											children: [formatCompact(community.members), " members"]
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-ledger__price",
											children: priceLabel(community)
										})
									]
								}, community.id))
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-sec",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap ct-cats",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ct-cats__intro",
								children: [/* @__PURE__ */ jsx("h2", { children: "Start with an interest. Find the practitioners." }), /* @__PURE__ */ jsx("a", {
									className: "ct-btn ct-btn--outline",
									href: "/explore",
									children: "Browse every category"
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "ct-leaders",
								children: categories.map((category) => /* @__PURE__ */ jsxs("a", {
									className: "ct-leader",
									href: `/categories/${category.slug}`,
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "ct-leader__name",
											children: category.name
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-leader__dots",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-leader__count",
											children: category.communityCount
										})
									]
								}, category.id))
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-sec",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ct-head",
								children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { children: "Short courses. Clear outcomes." }) }), /* @__PURE__ */ jsxs("a", {
									className: "ct-link",
									href: "/my-learning",
									children: ["See the classroom", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ct-i",
										"aria-hidden": "true"
									})]
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "ct-courses",
								children: featuredCourses.map((course) => /* @__PURE__ */ jsxs("a", {
									className: "ct-course",
									href: `/c/${course.communitySlug}/classroom/${course.slug}`,
									children: [
										/* @__PURE__ */ jsx("h3", { children: course.title }),
										/* @__PURE__ */ jsx("p", { children: course.subtitle }),
										/* @__PURE__ */ jsxs("span", {
											className: "ct-course__meta",
											children: [/* @__PURE__ */ jsxs("span", { children: [course.hours, " hours"] }), /* @__PURE__ */ jsxs("span", { children: [formatCompact(course.students), " learners"] })]
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ct-course__price",
											children: course.price === "included" ? "Included" : formatMoney(course.price)
										})
									]
								}, course.id))
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-band",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap ct-band__grid",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("h2", { children: "Turn what you know into a place people return to." }),
								/* @__PURE__ */ jsx("p", { children: "Run a community, publish a classroom and host events from one calm workspace." }),
								/* @__PURE__ */ jsxs("div", {
									className: "ct-band__actions",
									children: [/* @__PURE__ */ jsxs("a", {
										className: "ct-btn ct-btn--onforest",
										href: "/register?role=creator",
										children: ["Start your scene", /* @__PURE__ */ jsx(ArrowRight, {
											className: "ct-i",
											"aria-hidden": "true"
										})]
									}), /* @__PURE__ */ jsx("a", {
										className: "ct-btn ct-btn--forest",
										href: "/dashboard/creator",
										children: "Preview the workspace"
									})]
								})
							] }), /* @__PURE__ */ jsxs("div", {
								className: "ct-band__shot",
								children: [/* @__PURE__ */ jsx("img", {
									src: "/media/screens/creator-overview.jpg",
									alt: "Creator overview showing community performance and sample sales at a glance.",
									loading: "lazy",
									decoding: "async"
								}), /* @__PURE__ */ jsx("span", {
									className: "ct-band__cap",
									children: "Creator overview, sample data"
								})]
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ct-close",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ct-wrap",
							children: [
								/* @__PURE__ */ jsx("h2", { children: "Useful knowledge gets better in company." }),
								/* @__PURE__ */ jsx("p", { children: "Browse communities by craft, meet the people teaching inside them and start with one concrete lesson." }),
								/* @__PURE__ */ jsxs("a", {
									className: "ct-btn ct-btn--primary",
									href: "/explore",
									children: ["Explore The Scenes", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ct-i",
										"aria-hidden": "true"
									})]
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ jsx("footer", {
				className: "ct-foot",
				children: /* @__PURE__ */ jsxs("div", {
					className: "ct-wrap",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "ct-foot__grid",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("a", {
								className: "ct-mark",
								href: "/",
								children: [/* @__PURE__ */ jsx("span", {
									className: "ct-mark__tile",
									"aria-hidden": "true",
									children: "S"
								}), "The Scenes"]
							}), /* @__PURE__ */ jsx("p", {
								className: "ct-foot__tag",
								children: "Practical learning and focused communities, built in Africa, open to the world."
							})] }),
							/* @__PURE__ */ jsxs("nav", {
								"aria-label": "Discover",
								children: [/* @__PURE__ */ jsx("p", {
									className: "ct-foot__title",
									children: "Discover"
								}), /* @__PURE__ */ jsxs("ul", { children: [
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/explore",
										children: "Explore communities"
									}) }),
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/search?type=courses",
										children: "Browse courses"
									}) }),
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/marketplace",
										children: "Marketplace"
									}) })
								] })]
							}),
							/* @__PURE__ */ jsxs("nav", {
								"aria-label": "Create",
								children: [/* @__PURE__ */ jsx("p", {
									className: "ct-foot__title",
									children: "Create"
								}), /* @__PURE__ */ jsxs("ul", { children: [
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/become-a-teacher",
										children: "Become a teacher"
									}) }),
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/dashboard/creator",
										children: "Creator workspace"
									}) }),
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/pricing",
										children: "Pricing"
									}) })
								] })]
							}),
							/* @__PURE__ */ jsxs("nav", {
								"aria-label": "The Scenes",
								children: [/* @__PURE__ */ jsx("p", {
									className: "ct-foot__title",
									children: "The Scenes"
								}), /* @__PURE__ */ jsxs("ul", { children: [
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/about",
										children: "About"
									}) }),
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/help",
										children: "Help centre"
									}) }),
									/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: "/help#status",
										children: "Product status"
									}) })
								] })]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "ct-foot__legal",
						children: [/* @__PURE__ */ jsx("p", { children: "© 2026 The Scenes. Designed for useful knowledge." }), /* @__PURE__ */ jsx("p", { children: "Payments, accounts and live services are coming soon." })]
					})]
				})
			})
		]
	});
}

export const Route = createFileRoute("/variants/catalogue")({
  head: () => ({
    meta: [
      { title: "The Scenes — Learn practical skills with people doing the work" },
      { name: "description", content: "Discover focused communities, practical courses and working creators. Learn, participate and build in public on The Scenes." },
    ],
  }),
  component: Catalogue,
});
