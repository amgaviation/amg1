import {
  Gauge,
  Plane,
  PlaneTakeoff,
  Plus,
  FileText,
  Receipt,
  MessageSquare,
  Settings,
  Radar,
  Calendar,
  BadgeCheck,
  Users,
  Building2,
  Handshake,
  Wallet,
  UserCheck,
  History,
  ClipboardList,
  Bell,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge,
  plane: Plane,
  planeTakeoff: PlaneTakeoff,
  plus: Plus,
  fileText: FileText,
  receipt: Receipt,
  messageSquare: MessageSquare,
  settings: Settings,
  radar: Radar,
  calendar: Calendar,
  badgeCheck: BadgeCheck,
  users: Users,
  building: Building2,
  handshake: Handshake,
  wallet: Wallet,
  userCheck: UserCheck,
  history: History,
  clipboard: ClipboardList,
  bell: Bell,
  logout: LogOut,
  shield: ShieldCheck,
};

export function PortalIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Gauge;
  return <Icon className={className} />;
}
