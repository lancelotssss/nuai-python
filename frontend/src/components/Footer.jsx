import { Mail, MapPin, Clock } from "lucide-react";

export default function Footer({
  logoSrc,
  aboutTitle = "ABOUT NUAI",
  contactTitle = "CONTACT US",
}) {
  return (
    <footer className="bg-nu-blue text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-center md:gap-46">
          <div className="max-w-[220px]">
            <img src={logoSrc} alt="NUAI" className="w-104 object-contain" />
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-4 text-[11px] text-white/70">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-nu-gold">
                {aboutTitle}
              </p>
              <p className="max-w-[220px] leading-5">
                The NU Alumni Information System supports alumni engagement,
                university updates, career services, and lifelong community
                building for all Nationalians.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-nu-gold">
                {contactTitle}
              </p>
              <div className="space-y-1 leading-5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0 text-nu-gold/70" />
                  <span>Coral Way Street 1000, Pasay City</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3 shrink-0 text-nu-gold/70" />
                  <span>admissions@nu-moa.edu.ph</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3 shrink-0 text-nu-gold/70" />
                  <span>Mon–Fri 8:30AM–5:30PM &middot; Sat 8:30AM–12:30PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/15 pt-3">
          <p className="text-center text-[10px] text-white/50">
            &copy; {new Date().getFullYear()} National University. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
