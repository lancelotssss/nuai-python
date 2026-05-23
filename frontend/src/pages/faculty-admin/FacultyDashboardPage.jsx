import {
  BarChart3,
  ShieldCheck,
  BriefcaseBusiness,
  Activity,
} from "lucide-react";

export default function FacultyDashboardPage() {
  const stats = [
    {
      title: "Internship Dashboard",
      value: "Coming Soon",
      desc: "This section will be used for internship analytics and summaries.",
      icon: BarChart3,
    },
    {
      title: "Internship Records",
      value: "Managed Here",
      desc: "Track internship-related information and student placement records.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Security Monitoring",
      value: "Audit Ready",
      desc: "Review activities through the system audit logs.",
      icon: ShieldCheck,
    },
    {
      title: "System Health",
      value: "Stable",
      desc: "Internship Adviser workspace is active and accessible.",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-nu-blue via-[#183B8C] to-[#234AA8] px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Internship Adviser Analytics
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
            This page is reserved for future internship analytics, placement
            summaries, and adviser overview metrics.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-nu-blue">
                      {item.value}
                    </p>
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-nu-blue/10 text-nu-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
          Placeholder
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
          Internship Adviser Content Goes Here
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Add internship charts, student deployment summaries, company partner
          counts, evaluation status, or adviser-based statistics here later.
        </p>
      </div>
    </div>
  );
}
