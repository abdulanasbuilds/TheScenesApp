// All uploaded SukaSpace mockups, wired as permanent production assets.

export const UPLOADED_MOCKUPS = {
  // Original 7 (Stitch export)
  createCommunityStep1: "/__l5e/assets-v1/e354e369-5208-4ab8-9ee5-80baf781a563/sukaspace_create_community_step_1.png",
  createCommunityStep2: "/__l5e/assets-v1/319a0c83-9b34-423e-93ae-47491699100f/sukaspace_create_community_step_2.png",
  inviteMembers: "/__l5e/assets-v1/53166f45-f07a-4d1c-b0f4-bd221425e40a/sukaspace_invite_members.png",
  launchSuccessOriginal: "/__l5e/assets-v1/a370569f-f0b1-44b4-a8a9-5f35b9161598/sukaspace_launch_success.png",
  manageAccess: "/__l5e/assets-v1/af01a2b0-eada-4dc2-a228-2bb50a4806de/sukaspace_manage_access.png",
  onboardingJourney: "/__l5e/assets-v1/3f6f7098-8f80-4908-9171-105c48251a23/sukaspace_onboarding_journey.png",
  searchZeroStateOriginal: "/__l5e/assets-v1/10a0972c-d949-4e3c-94df-b5033f111af1/sukaspace_search_zero_state.png",

  // Newly uploaded human-designed mockups (10)
  exploreSearchHub: "/__l5e/assets-v1/74d77748-db45-4e0d-a68c-0314422a18b0/sukaspace_30.png",
  searchResults: "/__l5e/assets-v1/14dea511-7c2f-41cd-be32-6d29e5c1a289/sukaspace_31.png",
  communityCalendar: "/__l5e/assets-v1/7eaeb2e6-cb26-4e1e-82fe-f159efa29ea9/sukaspace_32.png",
  signInScreen: "/__l5e/assets-v1/a3cc4de4-5f9a-4c9a-b904-d20ee451a3ca/sukaspace_33.png",
  messagesChannel: "/__l5e/assets-v1/44881be5-b13b-4c1a-b702-f0cc9977f348/sukaspace_34.png",
  leaderboard: "/__l5e/assets-v1/e7f63d9f-4c22-4c9a-a2bf-41b50e0aa952/sukaspace_35.png",
  membersTable: "/__l5e/assets-v1/7129ab37-b8dd-4d24-8a17-7972a968e283/sukaspace_36.png",
  payoutsFinancials: "/__l5e/assets-v1/b184166a-6107-4a52-ba20-34aa3ffa30e2/sukaspace_37.png",
  launchSuccess: "/__l5e/assets-v1/02eacbe8-57f1-4528-bef0-67be97627ec7/sukaspace_38.png",
  discoverZeroState: "/__l5e/assets-v1/02dd51ba-b4cc-400e-a2cc-f17c2824f1e2/sukaspace_39.png",
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
