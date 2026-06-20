import { ShieldCheck, Users, Plane, ClipboardList } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Plane,
    title: "Aircraft Status Reviewed",
    body: "Support is reviewed against current aircraft condition, maintenance status, and known operating limitations.",
  },
  {
    icon: Users,
    title: "Crew Availability Checked",
    body: "Crew-related support is coordinated only after timing, qualification context, and availability are reviewed.",
  },
  {
    icon: ShieldCheck,
    title: "Owner/Operator Approval Considered",
    body: "AMG keeps operating authority and approval context central to request review.",
  },
  {
    icon: ClipboardList,
    title: "Support Scope Defined",
    body: "Requests are clarified before AMG presents a support path as accepted.",
  },
];

export function OperationalTrustStrip() {
  return (
    <section className="border-b border-[var(--oc-line)] bg-[var(--oc-ivory)]">
      <div className="oc-shell py-12 lg:py-16">
        <p className="oc-eyebrow mb-8 text-center">How AMG Approaches Every Request</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              data-stagger-item
              className="flex flex-col gap-3 rounded-lg border border-[var(--oc-line)] bg-[var(--oc-ivory-2)]/86 p-6 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--oc-navy)]/6 text-[var(--oc-navy)]">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="oc-kicker text-[0.72rem] text-[var(--oc-ink)]">{item.title}</h3>
              <p className="text-[0.84rem] leading-relaxed text-[var(--oc-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
