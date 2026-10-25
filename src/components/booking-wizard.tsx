"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addDays, nowInTz, weekdayOf } from "@/lib/hours";
import { PET_TYPES, VISIT_TYPES, WEEKDAYS, formatDateAr, minToTime } from "@/lib/format";
import { IconCalendar, IconCheck, IconPaw } from "./icons";

type Svc = { id: number; slug: string; name: string; short: string; durationMin: number; visitTypes: string[]; imageUrl: string };
type Doc = { id: number; slug: string; name: string; title: string; branchId: number | null; services: string[]; isSample: boolean };
type Branch = { id: number; name: string; timezone: string; address: string };
type Slot = { start: number; end: number };

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const STEPS = ["الحيوان", "الخدمة", "الموعد", "بياناتك", "المراجعة"];

export function BookingWizard({ services, doctors, branches, initService, initDoctor }: { services: Svc[]; doctors: Doc[]; branches: Branch[]; initService?: string; initDoctor?: string }) {
  const router = useRouter();
  const preDoc = doctors.find((d) => d.slug === initDoctor);
  const preSvc = services.find((s) => s.slug === initService) ?? (preDoc ? services.find((s) => preDoc.services.includes(s.slug)) : undefined);

  const [step, setStep] = useState(0);
  const [petType, setPetType] = useState("");
  const [petName, setPetName] = useState("");
  const [serviceId, setServiceId] = useState<number | null>(preSvc?.id ?? null);
  const [visitType, setVisitType] = useState(preSvc?.visitTypes[0] ?? "clinic");
  const [branchId, setBranchId] = useState<number>(preDoc?.branchId ?? branches[0]?.id);
  const [doctorId, setDoctorId] = useState<number | null>(preDoc && preSvc && preDoc.services.includes(preSvc.slug) ? preDoc.id : null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [reason, setReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [owner, setOwner] = useState({ ownerName: "", phone: "", email: "", address: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitErr, setSubmitErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(preDoc && preSvc && !preDoc.services.includes(preSvc.slug) ? `${preDoc.name} لا يقدم خدمة «${preSvc.name}»، لذلك سيُختار أي طبيب متاح.` : "");

  const service = services.find((s) => s.id === serviceId);
  const branch = branches.find((b) => b.id === branchId);
  const doctor = doctors.find((d) => d.id === doctorId);
  const availableDoctors = useMemo(() => doctors.filter((d) => service && d.services.includes(service.slug) && d.branchId === branchId), [doctors, service, branchId]);

  const today = branch ? nowInTz(branch.timezone).date : "";
  const days = useMemo(() => (today ? Array.from({ length: 21 }, (_, i) => addDays(today, i)) : []), [today]);

  // Re-validate availability whenever relevant inputs change
  useEffect(() => {
    if (!serviceId || !branchId || !date) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setSlot(null);
    const qs = new URLSearchParams({ serviceId: String(serviceId), branchId: String(branchId), date, visitType });
    if (doctorId) qs.set("doctorId", String(doctorId));
    fetch(`/api/availability?${qs}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setSlots(d.slots ?? []);
        setReason(d.reason ?? "");
      })
      .catch(() => alive && (setSlots([]), setReason("تعذر تحميل الأوقات، حاول مرة أخرى.")))
      .finally(() => alive && setLoadingSlots(false));
    return () => {
      alive = false;
    };
  }, [serviceId, branchId, doctorId, date, visitType]);

  function chooseService(s: Svc) {
    setServiceId(s.id);
    setVisitType(s.visitTypes[0] ?? "clinic");
    if (doctor && !doctor.services.includes(s.slug)) {
      setNotice(`${doctor.name} لا يقدم هذه الخدمة؛ تم التحويل إلى «أي طبيب متاح». يمكنك اختيار طبيب آخر.`);
      setDoctorId(null);
    } else setNotice("");
  }

  function validate(i: number) {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!petType) e.petType = "اختر نوع الحيوان";
      if (!petName.trim()) e.petName = "أدخل اسم الحيوان";
    }
    if (i === 1 && !serviceId) e.serviceId = "اختر الخدمة";
    if (i === 2) {
      if (!date) e.date = "اختر التاريخ";
      else if (!slot) e.slot = "اختر وقتًا من الأوقات المتاحة";
    }
    if (i === 3) {
      if (owner.ownerName.trim().length < 2) e.ownerName = "أدخل اسمك الكامل";
      if (!/^\+?[0-9\s-]{8,20}$/.test(owner.phone.trim())) e.phone = "أدخل رقم هاتف صحيح (8 أرقام على الأقل)";
      if (owner.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) e.email = "البريد الإلكتروني غير صالح";
      if (visitType === "home" && owner.address.trim().length < 5) e.address = "أدخل عنوان الزيارة";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => validate(step) && setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  async function submit() {
    if (!service || !slot || !branch) return;
    setBusy(true);
    setSubmitErr("");
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serviceId, branchId, doctorId, date, startMin: slot.start, visitType, petType, petName, ...owner }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setSubmitErr(d.error ?? "تعذر إرسال الطلب");
        if (d.alternatives) {
          setSlots(d.alternatives);
          setSlot(null);
          setStep(2);
        }
        if (d.errors) setErrors(d.errors);
        return;
      }
      router.push(`/booking/confirmation?ref=${encodeURIComponent(d.ref)}`);
    } catch {
      setSubmitErr("تعذر الاتصال بالخادم. لم يُسجَّل الحجز.");
    } finally {
      setBusy(false);
    }
  }

  const Err = ({ k }: { k: string }) => (errors[k] ? <p className="mt-1.5 text-sm font-semibold text-red-700" role="alert">{errors[k]}</p> : null);
  const choice = (active: boolean) =>
    `rounded-2xl border-2 p-4 text-right transition-all duration-200 ${active ? "border-pv-green bg-pv-green/5 shadow-sm" : "border-pv-border bg-white hover:border-pv-green/50"}`;

  return (
    <div className="card overflow-hidden shadow-[0_24px_60px_rgb(23_76_69/8%)]">
      {/* progress */}
      <div className="border-b border-pv-border bg-pv-cream/60 p-5 md:p-6">
        <ol className="flex items-center gap-2" aria-label="خطوات الحجز">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === step ? "step" : undefined}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${i < step ? "bg-pv-green text-white" : i === step ? "bg-pv-yellow text-pv-deep" : "bg-white text-pv-muted ring-1 ring-pv-border"}`}>
                {i < step ? <IconCheck size={16} /> : i + 1}
              </span>
              <span className={`hidden text-sm font-semibold md:block ${i === step ? "text-pv-deep" : "text-pv-muted"}`}>{s}</span>
              {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? "bg-pv-green" : "bg-pv-border"}`} />}
            </li>
          ))}
        </ol>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-pv-border" aria-hidden>
          <div className="h-full rounded-full bg-pv-yellow transition-[width] duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div key={step} className="step-enter p-5 md:p-8">
        {step === 0 && (
          <fieldset>
            <legend className="text-2xl font-bold text-pv-deep">لنتعرف على صديقك</legend>
            <p className="mt-1 text-pv-muted">اختر نوع الحيوان وأدخل اسمه.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="نوع الحيوان">
              {Object.entries(PET_TYPES).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={petType === k} onClick={() => setPetType(k)} className={choice(petType === k) + " flex flex-col items-center gap-2 text-center"}>
                  <IconPaw size={28} className={petType === k ? "text-pv-green" : "text-pv-muted"} />
                  <span className="font-bold">{v}</span>
                </button>
              ))}
            </div>
            <Err k="petType" />
            <div className="mt-6 max-w-md">
              <label htmlFor="petName" className="label">اسم الحيوان</label>
              <input id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} className="input" maxLength={60} aria-invalid={!!errors.petName} />
              <Err k="petName" />
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <fieldset>
              <legend className="text-2xl font-bold text-pv-deep">اختر الخدمة</legend>
              {notice && <p className="mt-3 rounded-xl bg-pv-pale/70 p-3 text-sm font-semibold text-pv-deep" role="status">{notice}</p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="الخدمة">
                {services.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={serviceId === s.id} onClick={() => chooseService(s)} className={choice(serviceId === s.id) + " flex items-center gap-4"}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.imageUrl.replace("w=900", "w=200")} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    <span>
                      <span className="block font-bold text-pv-deep">{s.name}</span>
                      <span className="block text-xs text-pv-muted">المدة التقريبية {s.durationMin} دقيقة</span>
                    </span>
                  </button>
                ))}
              </div>
              <Err k="serviceId" />
            </fieldset>

            {service && service.visitTypes.length > 1 && (
              <fieldset>
                <legend className="label">طريقة الزيارة</legend>
                <div className="flex flex-wrap gap-2">
                  {service.visitTypes.map((v) => (
                    <button key={v} type="button" onClick={() => setVisitType(v)} className={choice(visitType === v) + " py-2.5!"}>{VISIT_TYPES[v]}</button>
                  ))}
                </div>
              </fieldset>
            )}

            {branches.length > 1 && (
              <div className="max-w-md">
                <label htmlFor="branch" className="label">الفرع</label>
                <select id="branch" value={branchId} onChange={(e) => { setBranchId(Number(e.target.value)); setDoctorId(null); }} className="input">
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            {service && availableDoctors.length > 0 && (
              <fieldset>
                <legend className="label">الطبيب (اختياري)</legend>
                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                  <button type="button" role="radio" aria-checked={doctorId === null} onClick={() => setDoctorId(null)} className={choice(doctorId === null)}>
                    <span className="block font-bold">أي طبيب متاح</span>
                    <span className="text-xs text-pv-muted">أوقات أكثر للاختيار</span>
                  </button>
                  {availableDoctors.map((d) => (
                    <button key={d.id} type="button" role="radio" aria-checked={doctorId === d.id} onClick={() => setDoctorId(d.id)} className={choice(doctorId === d.id)}>
                      <span className="block font-bold">{d.name}</span>
                      <span className="text-xs text-pv-muted">{d.title}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl">اختر التاريخ والوقت</h2>
            <p className="mt-1 text-pv-muted">{service?.name}{doctor ? ` — ${doctor.name}` : " — أي طبيب متاح"}</p>
            {submitErr && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{submitErr} — اختر أحد الأوقات البديلة أدناه.</p>}
            <div className="no-scrollbar -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="التاريخ">
              {days.map((d) => {
                const [, m, dd] = d.split("-");
                return (
                  <button key={d} type="button" role="radio" aria-checked={date === d} aria-label={formatDateAr(d)} onClick={() => { setDate(d); setSubmitErr(""); }} className={`flex w-20 shrink-0 flex-col items-center rounded-2xl border-2 py-3 transition-colors ${date === d ? "border-pv-green bg-pv-green text-white" : "border-pv-border bg-white hover:border-pv-green/50"}`}>
                    <span className="text-xs">{d === today ? "اليوم" : WEEKDAYS[weekdayOf(d)]}</span>
                    <span className="text-2xl font-extrabold">{Number(dd)}</span>
                    <span className="text-xs opacity-80">{MONTHS[Number(m) - 1]}</span>
                  </button>
                );
              })}
            </div>
            <Err k="date" />
            {date && (
              <div className="mt-6">
                <p className="label flex items-center gap-2"><IconCalendar size={18} /> الأوقات المتاحة — {formatDateAr(date)}</p>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-busy="true" aria-label="جارٍ تحميل الأوقات">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-pv-beige/60" />)}
                  </div>
                ) : slots && slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6" role="radiogroup" aria-label="الوقت">
                    {slots.map((s) => (
                      <button key={s.start} type="button" role="radio" aria-checked={slot?.start === s.start} onClick={() => setSlot(s)} className={`h-12 rounded-xl border-2 font-bold transition-colors ${slot?.start === s.start ? "border-pv-yellow bg-pv-yellow text-pv-deep" : "border-pv-border bg-white hover:border-pv-yellow"}`}>
                        {minToTime(s.start)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-pv-cream p-4 text-pv-muted">{reason || "لا توجد أوقات متاحة"}. جرّب يومًا آخر{doctorId ? " أو اختر «أي طبيب متاح»" : ""}.</p>
                )}
                <Err k="slot" />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="col-span-full mb-2 text-2xl font-bold text-pv-deep">بيانات صاحب الحيوان</legend>
            {([
              ["ownerName", "الاسم الكامل", "text", "name"],
              ["phone", "رقم الجوال", "tel", "tel"],
              ["email", "البريد الإلكتروني (اختياري)", "email", "email"],
            ] as const).map(([k, l, t, a]) => (
              <div key={k}>
                <label htmlFor={k} className="label">{l}</label>
                <input id={k} type={t} autoComplete={a} dir={t !== "text" ? "ltr" : undefined} value={owner[k]} onChange={(e) => setOwner({ ...owner, [k]: e.target.value })} className={`input ${t !== "text" ? "text-right" : ""}`} aria-invalid={!!errors[k]} />
                <Err k={k} />
              </div>
            ))}
            {visitType === "home" && (
              <div className="sm:col-span-2">
                <label htmlFor="address" className="label">عنوان الزيارة</label>
                <input id="address" value={owner.address} onChange={(e) => setOwner({ ...owner, address: e.target.value })} className="input" />
                <Err k="address" />
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="label">ملاحظات (اختياري)</label>
              <textarea id="notes" rows={3} value={owner.notes} onChange={(e) => setOwner({ ...owner, notes: e.target.value })} className="input" placeholder="مثال: عمر الحيوان، أعراض لاحظتها، أو أي معلومات تساعد الطبيب" />
            </div>
          </fieldset>
        )}

        {step === 4 && service && slot && (
          <div>
            <h2 className="text-2xl">راجع تفاصيل طلبك</h2>
            <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-pv-border sm:grid-cols-2">
              {[
                ["الحيوان", `${petName} (${PET_TYPES[petType]})`],
                ["الخدمة", service.name],
                ["طريقة الزيارة", VISIT_TYPES[visitType]],
                ["الفرع", branch?.name ?? ""],
                ["الطبيب", doctor?.name ?? "أي طبيب متاح"],
                ["الموعد", `${formatDateAr(date)} — ${minToTime(slot.start)}`],
                ["صاحب الحيوان", owner.ownerName],
                ["الجوال", owner.phone],
              ].map(([k, v]) => (
                <div key={k} className="bg-white p-4"><dt className="text-sm text-pv-muted">{k}</dt><dd className="mt-0.5 font-bold text-pv-deep">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-5 rounded-xl bg-pv-pale/60 p-4 text-sm text-pv-deep">بعد الإرسال، يُسجَّل طلبك بحالة «قيد المراجعة» وتتواصل معك العيادة لتأكيد الموعد.</p>
            {submitErr && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{submitErr}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-pv-border bg-pv-cream/40 p-5 md:px-8">
        <button type="button" onClick={back} disabled={step === 0 || busy} className="btn btn-secondary">السابق</button>
        {step < 4 ? (
          <button type="button" onClick={next} className="btn btn-book">التالي</button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="btn btn-book">{busy ? "جارٍ الإرسال…" : "إرسال طلب الحجز"}</button>
        )}
      </div>
    </div>
  );
}
