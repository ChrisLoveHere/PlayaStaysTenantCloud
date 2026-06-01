import {
  Banknote,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Palmtree,
  Users,
  Wrench,
  Settings,
  Kanban,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "/landlord": LayoutDashboard,
  "/landlord/pipeline": Kanban,
  "/landlord/properties": Building2,
  "/landlord/prospects": ClipboardList,
  "/landlord/showings": CalendarDays,
  "/landlord/tenants": Users,
  "/landlord/agents": Users,
  "/landlord/leases": FileText,
  "/landlord/rent": Banknote,
  "/landlord/maintenance": Wrench,
  "/landlord/commissions": Banknote,
  "/landlord/settings": Settings,
  "/agent": LayoutDashboard,
  "/agent/pipeline": Kanban,
  "/agent/properties": Building2,
  "/agent/showings": CalendarDays,
  "/agent/prospects": ClipboardList,
  "/agent/tenants": Users,
  "/agent/availability": CalendarDays,
  "/agent/commissions": Banknote,
  "/portal": Home,
  "/portal/application": ClipboardList,
  "/portal/properties": Palmtree,
  "/portal/lease": FileText,
  "/portal/payments": Banknote,
  "/portal/maintenance": Wrench,
};

export function getNavIcon(href: string): LucideIcon {
  return ICON_MAP[href] ?? LayoutDashboard;
}
