import type { Metadata } from "next";
import Dashboard from "@/components/dash/Dashboard";

export const metadata: Metadata = {
  title: { absolute: "Qatar 2030 Skills Intelligence" },
  description: "An interactive map and dashboard of the skills Qatar's 2030 strategies call for, compared with what employers advertise today, by hub, sector and future.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
