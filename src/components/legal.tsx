import { Notice, PageHeader } from "./ui";

export function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <>
      <PageHeader title={title} crumbs={[{ label: title }]} />
      <section className="container-pv max-w-3xl py-12">
        <Notice tone="warn">مسودة أولية — يجب مراجعة هذا النص واعتماده من إدارة العيادة ومستشار قانوني قبل النشر.</Notice>
        <div className="mt-8 space-y-8">
          {sections.map(([h, p]) => (
            <div key={h}>
              <h2 className="text-xl">{h}</h2>
              <p className="mt-2 leading-loose text-pv-text/85">{p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
