// All uploaded SukaSpace mockups - production-ready assets served from public folder

export const UPLOADED_MOCKUPS = {
  // Newly uploaded human-designed mockups mapped to folder structure
  exploreSearchHub: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_landing_page/screen.png",
  searchResults: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_global_search_results/screen.png",
  communityCalendar: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_community_calendar/screen.png",
  signInScreen: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_access_portal_auth/screen.png",
  messagesChannel: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_messaging_hub/screen.png",
  leaderboard: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_rankings_gamification/screen.png",
  membersTable: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_members_directory/screen.png",
  payoutsFinancials: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_financial_hub/screen.png",
  launchSuccess: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_launch_success/screen.png",
  discoverZeroState: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_discovery_engine_zero_state/screen.png",
  
  // Additional available mockups
  createCommunityStep1: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_create_community_step_1/screen.png",
  createCommunityStep2: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_create_community_step_2/screen.png",
  inviteMembers: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_invite_members/screen.png",
  launchSuccessOriginal: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_launch_success/screen.png",
  manageAccess: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_manage_access/screen.png",
  onboardingJourney: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_onboarding_journey/screen.png",
  searchZeroStateOriginal: "/design-reference/stitch_sukaspace_learning_platform/sukaspace_search_zero_state/screen.png",
} as const;

// Landing page gallery — every uploaded screen in one strip.
export const MOCKUP_GALLERY: ReadonlyArray<{ id: string; label: string; caption: string; src: string }> = [
  { id: "explore", label: "Explore hub", caption: "Search courses, communities, and documentation.", src: UPLOADED_MOCKUPS.exploreSearchHub },
  { id: "discover-empty", label: "Claim a niche", caption: "Zero-state discovery invites the first creator.", src: UPLOADED_MOCKUPS.discoverZeroState },
  { id: "signin", label: "Sign in", caption: "Focused workspace authentication.", src: UPLOADED_MOCKUPS.signInScreen },
  { id: "search", label: "Search results", caption: "Communities, courses, experts, and threads in one view.", src: UPLOADED_MOCKUPS.searchResults },
  { id: "messages", label: "Channels & DMs", caption: "Team channels alongside 1-on-1 messages.", src: UPLOADED_MOCKUPS.messagesChannel },
  { id: "calendar", label: "Community calendar", caption: "Live sessions, deadlines, and meetups.", src: UPLOADED_MOCKUPS.communityCalendar },
  { id: "leaderboard", label: "Rankings & badges", caption: "XP, tiers, and community leaderboards.", src: UPLOADED_MOCKUPS.leaderboard },
  { id: "members", label: "Members admin", caption: "Roles, XP, and activity for every learner.", src: UPLOADED_MOCKUPS.membersTable },
  { id: "payouts", label: "Payouts & financials", caption: "Balance, earnings, and transaction history.", src: UPLOADED_MOCKUPS.payoutsFinancials },
  { id: "launch", label: "Launch success", caption: "Post-launch checklist for new creators.", src: UPLOADED_MOCKUPS.launchSuccess },
];
