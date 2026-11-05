import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  Clock3,
  MailPlus,
  MoreHorizontal,
  Search,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { CreatorShell } from "@/components/layout/creator-shell";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Stat,
  buttonClass,
} from "@/components/ui";
import { members } from "@/data/seed";
import type { Member } from "@/data/types";
import { formatCompact, formatDate } from "@/lib/utils";
import { useToast } from "@/store/app-store";

export const Route = createFileRoute("/dashboard/members")({
  head: () => ({ meta: [{ title: "Members — The Scenes creator workspace" }] }),
  component: MemberManagementPage,
});

const roleTone = {
  Owner: "clay",
  Admin: "indigo",
  Moderator: "amber",
  Member: "slate",
} as const;

function MemberManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [directory, setDirectory] = useState<Member[]>(() =>
    members.filter((member) => member.communities.includes("ai-builders-guild")),
  );
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Member" | "Moderator">("Member");
  const [inviteError, setInviteError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return directory.filter((member) => {
      const queryMatch =
        !normalized ||
        `${member.name} ${member.handle} ${member.headline} ${member.location}`
          .toLowerCase()
          .includes(normalized);
      const roleMatch = role === "all" || member.role.toLowerCase() === role;
      const statusMatch = status === "all" || member.status === status;
      return queryMatch && roleMatch && statusMatch;
    });
  }, [directory, query, role, status]);

  const activeCount = directory.filter((member) => member.status === "active").length;
  const onlineCount = directory.filter((member) => member.online).length;
  const teamCount = directory.filter((member) => member.role !== "Member").length;
  const invitedCount = directory.filter((member) => member.status === "invited").length;

  const updateRole = (id: string, nextRole: Member["role"]) => {
    setDirectory((current) =>
      current.map((member) => (member.id === id ? { ...member, role: nextRole } : member)),
    );
    toast(
      "Role updated locally",
      "Production roles require server-side authorization and an audit log.",
    );
  };

  const updateStatus = (id: string, nextStatus: Member["status"]) => {
    setDirectory((current) =>
      current.map((member) => (member.id === id ? { ...member, status: nextStatus } : member)),
    );
    toast(
      nextStatus === "paused" ? "Member paused locally" : "Member reactivated locally",
      "No access token or server policy was changed.",
    );
  };

  const invite = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(inviteEmail)) {
      setInviteError("Enter a valid email address.");
      return;
    }
    const name = inviteEmail
      .split("@")[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const newMember: Member = {
      id: `invited-${Date.now()}`,
      name,
      handle: inviteEmail
        .split("@")[0]
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase(),
      role: inviteRole,
      headline: "Invitation pending",
      bio: "This invited member has not completed onboarding in the preview.",
      location: "Not provided",
      joined: new Date().toISOString(),
      points: 0,
      level: 1,
      status: "invited",
      communities: ["ai-builders-guild"],
      badges: [],
      online: false,
    };
    setDirectory((current) => [newMember, ...current]);
    setInviteEmail("");
    setInviteRole("Member");
    setInviteError("");
    setInviteOpen(false);
    toast("Invitation added locally", "No email was sent. Email delivery is not connected.");
  };

  return (
    <CreatorShell active="members">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                  People and moderation
                </p>
                <Badge tone="outline">AI Builders Guild</Badge>
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-950">
                Members
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Find people, assign roles and pause access. Every action is local to this preview
                and never claims a production permission change.
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <MailPlus className="h-4 w-4" /> Invite member
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Members in view" value={directory.length} hint="Fixture community roster" />
          <Stat label="Active" value={activeCount} hint={`${invitedCount} invited`} />
          <Stat label="Online now" value={onlineCount} hint="Deterministic fixture presence" />
          <Stat label="Admins + moderators" value={teamCount} hint="Role changes are local only" />
        </div>

        <Card className="mt-5 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <label htmlFor="member-admin-search" className="sr-only">
                Search members
              </label>
              <Input
                id="member-admin-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, handle, skill or city"
                className="pl-9"
              />
            </div>
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-36"
              aria-label="Filter by role"
            >
              <option value="all">All roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="member">Member</option>
            </Select>
            <div className="flex gap-1.5 overflow-x-auto">
              {(
                [
                  ["all", "All"],
                  ["active", "Active"],
                  ["invited", "Invited"],
                  ["paused", "Paused"],
                ] as const
              ).map(([value, label]) => (
                <Chip key={value} active={status === value} onClick={() => setStatus(value)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          {visible.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Member
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Joined
                    </th>
                    <th scope="col" className="px-4 py-2.5">
                      Points
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size={36} online={member.online} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{member.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              @{member.handle} · {member.headline}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={roleTone[member.role]}>{member.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            member.status === "active"
                              ? "green"
                              : member.status === "invited"
                                ? "amber"
                                : "slate"
                          }
                        >
                          {member.status === "active" ? (
                            <Check className="h-3 w-3" />
                          ) : member.status === "invited" ? (
                            <Clock3 className="h-3 w-3" />
                          ) : null}
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(member.joined)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold tabular-nums text-slate-700">
                        {formatCompact(member.points)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown>
                          <DropdownTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              aria-label={`Actions for ${member.name}`}
                            >
                              Manage <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </DropdownTrigger>
                          <DropdownContent>
                            {member.status !== "invited" ? (
                              <DropdownItem
                                onSelect={() => {
                                  void router.navigate({
                                    href: `/c/ai-builders-guild/members/${member.id}`,
                                  });
                                }}
                              >
                                <Users className="h-4 w-4" /> View profile
                              </DropdownItem>
                            ) : null}
                            <DropdownItem onSelect={() => updateRole(member.id, "Moderator")}>
                              <Shield className="h-4 w-4" /> Make moderator
                            </DropdownItem>
                            <DropdownItem onSelect={() => updateRole(member.id, "Admin")}>
                              <UserCheck className="h-4 w-4" /> Make admin
                            </DropdownItem>
                            <DropdownItem onSelect={() => updateRole(member.id, "Member")}>
                              <UserPlus className="h-4 w-4" /> Make member
                            </DropdownItem>
                            <DropdownSeparator />
                            {member.status === "paused" ? (
                              <DropdownItem onSelect={() => updateStatus(member.id, "active")}>
                                <Check className="h-4 w-4" /> Reactivate
                              </DropdownItem>
                            ) : (
                              <DropdownItem onSelect={() => updateStatus(member.id, "paused")}>
                                <Clock3 className="h-4 w-4" /> Pause member
                              </DropdownItem>
                            )}
                            <DropdownItem onSelect={() => setRemoveTarget(member)}>
                              <UserMinus className="h-4 w-4" /> Remove from community
                            </DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title="No members match"
              description="Try another name, role or status. Invited members appear here after you add them."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setRole("all");
                    setStatus("all");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          )}
        </Card>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            {visible.length} of {directory.length} preview members shown
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Role and status changes are not persisted
          </p>
        </div>

        <Card className="mt-6 grid gap-4 border-indigo-100 bg-indigo-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm font-bold text-slate-900">Moderation needs a real policy.</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Reports, appeals, audit logs and role enforcement belong to the backend phase. This
              screen validates the workflow without pretending those controls exist.
            </p>
          </div>
          <a href="/dashboard/community" className={buttonClass("secondary", "md")}>
            Review access settings
          </a>
        </Card>
      </div>

      <Modal
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) {
            setInviteEmail("");
            setInviteError("");
          }
        }}
        title="Invite a member"
        description="Add a pending invitation to the local roster. No email will be sent."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="invite-form">
              <MailPlus className="h-4 w-4" /> Add invitation
            </Button>
          </div>
        }
      >
        <form id="invite-form" onSubmit={invite} className="space-y-4" noValidate>
          <Field label="Email address" htmlFor="invite-email" error={inviteError} required>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(event) => {
                setInviteEmail(event.target.value);
                if (inviteError) setInviteError("");
              }}
              placeholder="name@example.com"
              invalid={Boolean(inviteError)}
            />
          </Field>
          <Field label="Initial role" htmlFor="invite-role">
            <Select
              id="invite-role"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as "Member" | "Moderator")}
            >
              <option value="Member">Member</option>
              <option value="Moderator">Moderator</option>
            </Select>
          </Field>
          <div className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            This creates a fixture row only. Invitations, email delivery and token-based acceptance
            are not connected.
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        onOpenChange={(open) => (!open ? setRemoveTarget(null) : undefined)}
        title={`Remove ${removeTarget?.name ?? "member"}?`}
        description="This is a local preview action, not a production access change."
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-700 hover:bg-rose-800"
              onClick={() => {
                if (!removeTarget) return;
                setDirectory((current) =>
                  current.filter((member) => member.id !== removeTarget.id),
                );
                toast("Member removed locally", "No account, file or message was deleted.");
                setRemoveTarget(null);
              }}
            >
              <UserMinus className="h-4 w-4" /> Remove locally
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-slate-700">
          In production this action would need object-level authorization, an audit record and a
          clear policy for owned content. None of that exists in this frontend preview.
        </p>
      </Modal>
    </CreatorShell>
  );
}
