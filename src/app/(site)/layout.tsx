import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackToTop, FloatingContact } from "@/components/client-ui";
import { getSettings } from "@/lib/settings";
import { getBranches } from "@/lib/data";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [s, branches] = await Promise.all([getSettings(), getBranches()]);
  return (
    <>
      <Header topbarMessage={s.topbarMessage} whatsapp={s.whatsapp} previewNotice={s.previewNotice} />
      <main id="main">{children}</main>
      {s.previewNotice && (
        <div className="container-pv mt-16">
          <p className="rounded-2xl border border-dashed border-pv-teal/40 bg-pv-teal/5 p-4 text-center text-sm text-[#0f5d66]">{s.previewNotice}</p>
        </div>
      )}
      <Footer s={s} branch={branches[0]} />
      <BackToTop />
    </>
  );
}
