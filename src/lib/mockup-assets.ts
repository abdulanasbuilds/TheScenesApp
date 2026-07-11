// All uploaded SukaSpace mockups - production-ready assets served from public folder
// Only using the 7 mockups that have actual real image files

export const UPLOADED_MOCKUPS = {
  createCommunityStep1: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_create_community_step_1/screen.png",
  createCommunityStep2: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_create_community_step_2/screen.png",
  inviteMembers: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_invite_members/screen.png",
  launchSuccess: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_launch_success/screen.png",
  manageAccess: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_manage_access/screen.png",
  onboardingJourney: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_onboarding_journey/screen.png",
  searchZeroState: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_search_zero_state/screen.png",
  discoverZeroState: "/uploads/discover-zero-state.png",
  creatorGrowthAnalytics: "/uploads/creator-growth-analytics.png",
  communityCalendar: "/uploads/community-calendar.png",
  leaderboard: "/uploads/leaderboard.png",
  membersTable: "/uploads/members-table.png",
  payoutsFinancials: "/uploads/payouts-financials.png",
  searchResults: "/uploads/search-results.png",
} as const;

// Landing page gallery — every uploaded screen that has real images
export const MOCKUP_GALLERY: ReadonlyArray<{ id: string; label: string; caption: string; src: string }> = [
  { id: "create-step1", label: "Create a Community", caption: "Guided setup for community creation.", src: UPLOADED_MOCKUPS.createCommunityStep1 },
  { id: "create-step2", label: "Configure Settings", caption: "Customize your community preferences.", src: UPLOADED_MOCKUPS.createCommunityStep2 },
  { id: "invite", label: "Invite Members", caption: "Add team members and learners.", src: UPLOADED_MOCKUPS.inviteMembers },
  { id: "manage", label: "Manage Access", caption: "Control roles and permissions.", src: UPLOADED_MOCKUPS.manageAccess },
  { id: "onboarding", label: "Onboarding Flow", caption: "Guide new members through setup.", src: UPLOADED_MOCKUPS.onboardingJourney },
  { id: "search-empty", label: "Search Discovery", caption: "Find courses and communities.", src: UPLOADED_MOCKUPS.searchZeroState },
  { id: "launch", label: "Launch Success", caption: "Celebrate your community launch.", src: UPLOADED_MOCKUPS.launchSuccess },
];
