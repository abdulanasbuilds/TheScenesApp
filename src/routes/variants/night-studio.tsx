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
import cssText from "../../variants/night-studio.css?raw";

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
var priceLabel = (community: any) => community.pricing.type === "free" ? "Free" : `${formatMoney(community.pricing.amount)}/mo`;
function NightStudio() {
	const featuredCommunities = communities.filter((community) => community.featured).slice(0, 3);
	const featuredCourses = courses.slice(0, 3);
	return /* @__PURE__ */ jsxs("div", {
		className: "v-night-studio",
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
						"aria-current": "page",
						children: "Night studio"
					}),
					/* @__PURE__ */ jsx("a", {
						href: "/variants/catalogue",
						children: "Catalogue"
					})
				]
			}),
			/* @__PURE__ */ jsx("header", {
				className: "ns-nav",
				children: /* @__PURE__ */ jsxs("div", {
					className: "ns-wrap ns-nav__in",
					children: [
						/* @__PURE__ */ jsxs("a", {
							className: "ns-mark",
							href: "/",
							children: [/* @__PURE__ */ jsx("span", {
								className: "ns-mark__tile",
								"aria-hidden": "true",
								children: "S"
							}), "The Scenes"]
						}),
						/* @__PURE__ */ jsx("nav", {
							className: "ns-nav__links",
							"aria-label": "Main navigation",
							children: publicLinks.map((item) => /* @__PURE__ */ jsx("a", {
								href: item.href,
								children: item.label
							}, item.href))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ns-nav__actions",
							children: [/* @__PURE__ */ jsx("a", {
								className: "ns-nav__login",
								href: "/login",
								children: "Log in"
							}), /* @__PURE__ */ jsx("a", {
								className: "ns-btn ns-btn--primary ns-btn--sm",
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
						className: "ns-hero",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap ns-hero__grid",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("h1", { children: "Learn practical skills with people doing the work." }),
								/* @__PURE__ */ jsx("p", {
									className: "ns-hero__lede",
									children: "Focused communities, useful courses and honest working notes."
								}),
								/* @__PURE__ */ jsxs("form", {
									action: "/search",
									method: "get",
									className: "ns-search",
									role: "search",
									children: [
										/* @__PURE__ */ jsx("label", {
											className: "ns-sr",
											htmlFor: "ns-search",
											children: "Search communities and courses"
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "ns-search__field",
											children: [/* @__PURE__ */ jsx(Search, {
												className: "ns-i",
												"aria-hidden": "true"
											}), /* @__PURE__ */ jsx("input", {
												id: "ns-search",
												name: "q",
												type: "search",
												placeholder: "What do you want to learn?"
											})]
										}),
										/* @__PURE__ */ jsx("button", {
											type: "submit",
											className: "ns-btn ns-btn--primary",
											children: "Explore The Scenes"
										})
									]
								}),
								/* @__PURE__ */ jsxs("ul", {
									className: "ns-trust",
									children: [
										/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(CircleCheck, {
											className: "ns-i",
											"aria-hidden": "true"
										}), "Free communities available"] }),
										/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(ShieldCheck, {
											className: "ns-i",
											"aria-hidden": "true"
										}), "Creator-led, moderated spaces"] }),
										/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx(Earth, {
											className: "ns-i",
											"aria-hidden": "true"
										}), "Learn from anywhere"] })
									]
								})
							] }), /* @__PURE__ */ jsxs("figure", {
								className: "ns-hero__visual",
								children: [/* @__PURE__ */ jsx("img", {
									src: "/media/screens/creator-overview.jpg",
									alt: "Creator overview showing member counts, weekly posts, course learners and sample gross sales.",
									decoding: "async"
								}), /* @__PURE__ */ jsx("figcaption", {
									className: "ns-hero__cap",
									children: "Creator overview, sample data"
								})]
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-sec ns-pillars",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap",
							children: [/* @__PURE__ */ jsx("h2", { children: "Built for people who want to do more than watch" }), /* @__PURE__ */ jsx("div", {
								className: "ns-pillars__grid",
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
								].map(([Icon, title, description]) => {
									return /* @__PURE__ */ jsxs("div", {
										className: "ns-pillar",
										children: [/* @__PURE__ */ jsx("span", {
											className: "ns-pillar__icon",
											"aria-hidden": "true",
											children: /* @__PURE__ */ jsx(Icon, { className: "ns-i" })
										}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", { children: String(title) }), /* @__PURE__ */ jsx("p", { children: String(description) })] })]
									}, String(title));
								})
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-light",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ns-head",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "The room, the classroom and the numbers in one place." }), /* @__PURE__ */ jsx("p", { children: "Screenshots from the working product with sample data. Payments, image uploads and live video are coming soon." })] }), /* @__PURE__ */ jsxs("a", {
									className: "ns-link",
									href: "/explore",
									children: ["Open the preview", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ns-i",
										"aria-hidden": "true"
									})]
								})]
							}), /* @__PURE__ */ jsxs("div", {
								className: "ns-shots",
								children: [
									/* @__PURE__ */ jsxs("figure", {
										className: "ns-shot",
										children: [/* @__PURE__ */ jsx("img", {
											src: "/media/screens/community-home.jpg",
											alt: "Community home for the AI Builders Guild with the post feed, upcoming events and member activity.",
											loading: "lazy",
											decoding: "async"
										}), /* @__PURE__ */ jsxs("figcaption", { children: [/* @__PURE__ */ jsx("span", { children: "Community home" }), /* @__PURE__ */ jsx("span", { children: "Sample data" })] })]
									}),
									/* @__PURE__ */ jsxs("figure", {
										className: "ns-shot",
										children: [/* @__PURE__ */ jsx("img", {
											src: "/media/screens/classroom-lesson.jpg",
											alt: "Classroom lesson page with the course outline, lesson content and progress controls.",
											loading: "lazy",
											decoding: "async"
										}), /* @__PURE__ */ jsx("figcaption", { children: /* @__PURE__ */ jsx("span", { children: "Classroom lesson" }) })]
									}),
									/* @__PURE__ */ jsxs("figure", {
										className: "ns-shot",
										children: [/* @__PURE__ */ jsx("img", {
											src: "/media/screens/explore.jpg",
											alt: "Explore page with category filters and community results.",
											loading: "lazy",
											decoding: "async"
										}), /* @__PURE__ */ jsx("figcaption", { children: /* @__PURE__ */ jsx("span", { children: "Explore" }) })]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-sec",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ns-head",
								children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "Communities with a point of view." }), /* @__PURE__ */ jsx("p", { children: "Not another endless feed. Each scene has a clear purpose, working practitioners and a structured path from question to action." })] }), /* @__PURE__ */ jsxs("a", {
									className: "ns-link",
									href: "/explore",
									children: ["Explore all", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ns-i",
										"aria-hidden": "true"
									})]
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "ns-roster",
								children: featuredCommunities.map((community) => /* @__PURE__ */ jsxs("a", {
									className: "ns-roster__row",
									href: `/communities/${community.slug}`,
									children: [
										community.coverUrl ? /* @__PURE__ */ jsx("img", {
											className: "ns-roster__thumb",
											src: community.coverUrl,
											alt: "",
											loading: "lazy",
											decoding: "async"
										}) : /* @__PURE__ */ jsx("span", {
											className: "ns-roster__type",
											"aria-hidden": "true",
											children: community.name.slice(0, 1)
										}),
										/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
											className: "ns-roster__name",
											children: community.name
										}), /* @__PURE__ */ jsx("span", {
											className: "ns-roster__tag",
											children: community.tagline
										})] }),
										/* @__PURE__ */ jsxs("span", {
											className: "ns-roster__facts",
											children: [/* @__PURE__ */ jsxs("span", { children: [formatCompact(community.members), " members"] }), /* @__PURE__ */ jsx("span", { children: community.privacy === "private" ? "Private" : "Open" })]
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ns-roster__price",
											children: priceLabel(community)
										})
									]
								}, community.id))
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-sec ns-cats-band",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap ns-cats",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ns-cats__intro",
								children: [/* @__PURE__ */ jsx("h2", { children: "Start with an interest. Find the practitioners." }), /* @__PURE__ */ jsx("a", {
									className: "ns-btn ns-btn--outline",
									href: "/explore",
									children: "Browse every category"
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "ns-cats__list",
								children: categories.map((category) => /* @__PURE__ */ jsxs("a", {
									className: "ns-cat",
									href: `/categories/${category.slug}`,
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "ns-cat__swatch",
											"aria-hidden": "true",
											style: { backgroundColor: `hsl(${category.hue} 52% 44%)` }
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ns-cat__name",
											children: category.name
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ns-cat__count",
											children: category.communityCount
										})
									]
								}, category.id))
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-light",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "ns-head",
								children: [/* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h2", { children: "Short courses. Clear outcomes." }) }), /* @__PURE__ */ jsxs("a", {
									className: "ns-link",
									href: "/my-learning",
									children: ["See the classroom", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ns-i",
										"aria-hidden": "true"
									})]
								})]
							}), /* @__PURE__ */ jsx("div", {
								className: "ns-courses",
								children: featuredCourses.map((course) => /* @__PURE__ */ jsxs("a", {
									className: "ns-course",
									href: `/c/${course.communitySlug}/classroom/${course.slug}`,
									children: [
										/* @__PURE__ */ jsx("h3", { children: course.title }),
										/* @__PURE__ */ jsx("p", { children: course.subtitle }),
										/* @__PURE__ */ jsxs("span", {
											className: "ns-course__stats",
											children: [/* @__PURE__ */ jsxs("span", { children: [course.hours, " hours"] }), /* @__PURE__ */ jsxs("span", { children: [formatCompact(course.students), " learners"] })]
										}),
										/* @__PURE__ */ jsx("span", {
											className: "ns-course__price",
											children: course.price === "included" ? "Included" : formatMoney(course.price)
										})
									]
								}, course.id))
							})]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-sec ns-creators",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap ns-creators__grid",
							children: [/* @__PURE__ */ jsx("div", {
								className: "ns-creators__shot",
								children: /* @__PURE__ */ jsx("img", {
									src: "/media/screens/creator-overview.jpg",
									alt: "Creator overview showing community performance and sample sales at a glance.",
									loading: "lazy",
									decoding: "async"
								})
							}), /* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("h2", { children: "Turn what you know into a place people return to." }),
								/* @__PURE__ */ jsx("p", { children: "Run a community, publish a classroom and host events from one calm workspace." }),
								/* @__PURE__ */ jsxs("div", {
									className: "ns-creators__actions",
									children: [/* @__PURE__ */ jsxs("a", {
										className: "ns-btn ns-btn--primary",
										href: "/register?role=creator",
										children: ["Start your scene", /* @__PURE__ */ jsx(ArrowRight, {
											className: "ns-i",
											"aria-hidden": "true"
										})]
									}), /* @__PURE__ */ jsx("a", {
										className: "ns-btn ns-btn--outline",
										href: "/dashboard/creator",
										children: "Preview the workspace"
									})]
								})
							] })]
						})
					}),
					/* @__PURE__ */ jsx("section", {
						className: "ns-close",
						children: /* @__PURE__ */ jsxs("div", {
							className: "ns-wrap",
							children: [
								/* @__PURE__ */ jsx("h2", { children: "Useful knowledge gets better in company." }),
								/* @__PURE__ */ jsx("p", { children: "Meet the people teaching inside them and start with one concrete lesson." }),
								/* @__PURE__ */ jsxs("a", {
									className: "ns-btn ns-btn--primary",
									href: "/explore",
									children: ["Explore The Scenes", /* @__PURE__ */ jsx(ArrowRight, {
										className: "ns-i",
										"aria-hidden": "true"
									})]
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ jsx("footer", {
				className: "ns-foot",
				children: /* @__PURE__ */ jsxs("div", {
					className: "ns-wrap",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "ns-foot__grid",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("a", {
								className: "ns-mark",
								href: "/",
								children: [/* @__PURE__ */ jsx("span", {
									className: "ns-mark__tile",
									"aria-hidden": "true",
									children: "S"
								}), "The Scenes"]
							}), /* @__PURE__ */ jsx("p", {
								className: "ns-foot__tag",
								children: "Practical learning and focused communities, built in Africa, open to the world."
							})] }),
							/* @__PURE__ */ jsxs("nav", {
								"aria-label": "Discover",
								children: [/* @__PURE__ */ jsx("p", {
									className: "ns-foot__title",
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
									className: "ns-foot__title",
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
									className: "ns-foot__title",
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
						className: "ns-foot__legal",
						children: [/* @__PURE__ */ jsx("p", { children: "© 2026 The Scenes. Designed for useful knowledge." }), /* @__PURE__ */ jsx("p", { children: "Payments, accounts and live services are coming soon." })]
					})]
				})
			})
		]
	});
}

export const Route = createFileRoute("/variants/night-studio")({
  head: () => ({
    meta: [
      { title: "The Scenes — Learn practical skills with people doing the work" },
      { name: "description", content: "Discover focused communities, practical courses and working creators. Learn, participate and build in public on The Scenes." },
    ],
  }),
  component: NightStudio,
});
