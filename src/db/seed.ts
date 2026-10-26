import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  branchHours,
  brands,
  categories,
  doctorHours,
  doctors,
  doctorServices,
  posts,
  products,
  services,
  settings,
} from "@/db/schema";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

export const px = (id: number, w = 900, file?: string) =>
  `https://images.pexels.com/photos/${id}/${file ?? `pexels-photo-${id}`}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

let seeding: Promise<void> | null = null;

/** Idempotent: seeds DEVELOPMENT sample data once, when the settings table is empty. */
export function ensureSeed() {
  if (!seeding) {
    seeding = runSeed().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

async function runSeed() {
  const existing = await db.select({ key: settings.key }).from(settings).limit(1);
  if (existing.length) return;

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(424242)`);
    const again = await tx.select({ key: settings.key }).from(settings).limit(1);
    if (again.length) return;

    await tx.insert(settings).values(
      Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value: value as unknown })),
    );

    const [branch] = await tx
      .insert(branches)
      .values({
        slug: "main",
        name: "Samaya Taiba",
        city: "",
        address: "المدينة المنورة",
        timezone: "Asia/Riyadh",
        hoursVerified: true,
        infoVerified: true,
      })
      .returning();

    // SAMPLE hours (development only; flagged hoursVerified=false and shown with a notice)
    const H = (h: number, m = 0) => h * 60 + m;
    const rows: { weekday: number; openMin: number; closeMin: number }[] = [];
    for (const d of [0, 1, 2, 3, 4, 6]) rows.push({ weekday: d, openMin: H(15), closeMin: H(23) });
    rows.push({ weekday: 5, openMin: H(16), closeMin: H(22) });
    await tx.insert(branchHours).values(rows.map((r) => ({ ...r, branchId: branch.id })));

    const svc = await tx
      .insert(services)
      .values([
        {
          slug: "checkup",
          name: "الكشف والمعاينة",
          short: "فحص سريري شامل لتقييم صحة حيوانك ومتابعة حالته بهدوء.",
          description:
            "يبدأ الكشف بالاستماع إلى ملاحظاتك عن سلوك حيوانك وشهيته ونشاطه، ثم يُجرى فحص سريري يشمل الوزن والعينين والأذنين والفم والجلد والقلب. بعد ذلك يناقش الطبيب معك ما لاحظه، ويقترح الخطوات المناسبة إن لزم الأمر.",
          highlights: ["فحص سريري متكامل", "متابعة الوزن والنمو", "إرشادات عناية منزلية"],
          imageUrl: px(6235648),
          imageAlt: "طبيب بيطري يفحص كلبًا صغيرًا بالسماعة الطبية",
          durationMin: 30,
          visitTypes: ["clinic"],
          sortOrder: 1,
        },
        {
          slug: "vaccination",
          name: "التطعيمات والوقاية",
          short: "جدول تطعيمات منظم ووقاية دورية من الطفيليات حسب عمر الحيوان.",
          description:
            "يساعدك الطبيب على وضع جدول تطعيمات يناسب عمر حيوانك ونمط حياته، مع برنامج وقاية دوري من الطفيليات الداخلية والخارجية، وتسجيل كل جرعة لتسهيل المتابعة.",
          highlights: ["جدول تطعيم حسب العمر", "وقاية من الطفيليات", "سجل متابعة للجرعات"],
          imageUrl: px(6816869),
          imageAlt: "طبيب بيطري يرتدي قفازات يعطي قطة جرعة تطعيم",
          durationMin: 20,
          visitTypes: ["clinic"],
          sortOrder: 2,
        },
        {
          slug: "lab-tests",
          name: "الفحوصات والتحاليل",
          short: "تحاليل مخبرية تساعد الطبيب على فهم الحالة بدقة أكبر.",
          description:
            "عند الحاجة، يطلب الطبيب فحوصات مخبرية مثل تحاليل الدم أو غيرها لدعم التقييم السريري. يُشرح لك سبب كل فحص وما يعنيه بلغة واضحة.",
          highlights: ["تحاليل حسب توصية الطبيب", "شرح واضح للنتائج", "متابعة بعد الفحص"],
          imageUrl: px(8442568),
          imageAlt: "مختص في المختبر يستخدم المجهر",
          durationMin: 30,
          visitTypes: ["clinic"],
          sortOrder: 3,
        },
        {
          slug: "surgery",
          name: "العمليات والتعقيم",
          short: "إجراءات جراحية مخطط لها مع تحضير ومتابعة بعد العملية.",
          description:
            "تبدأ الخدمة بموعد تقييم يحدد فيه الطبيب مدى جاهزية الحيوان للإجراء، مع شرح التحضيرات المطلوبة قبل يوم العملية وتعليمات العناية بعدها. يُحدد موعد الإجراء نفسه بعد التقييم.",
          highlights: ["تقييم ما قبل الإجراء", "تعليمات تحضير واضحة", "متابعة بعد العملية"],
          imageUrl: px(6816862),
          imageAlt: "طبيب بيطري يضمد قدم قطة بعد إجراء طبي",
          durationMin: 45,
          visitTypes: ["clinic"],
          sortOrder: 4,
        },
        {
          slug: "grooming",
          name: "العناية والنظافة",
          short: "استحمام وتمشيط وقص أظافر بلطف يحترم راحة حيوانك.",
          description:
            "جلسة عناية تشمل الاستحمام بمنتجات مناسبة لنوع الفراء، والتجفيف والتمشيط، وقص الأظافر وتنظيف الأذنين، مع التعامل الهادئ مع الحيوانات القلقة.",
          highlights: ["استحمام وتجفيف", "تمشيط وفك التشابك", "قص الأظافر وتنظيف الأذنين"],
          imageUrl: px(19145883),
          imageAlt: "كلب صغير أثناء الاستحمام في صالون عناية",
          durationMin: 60,
          visitTypes: ["clinic"],
          sortOrder: 5,
        },
        {
          slug: "boarding",
          name: "الإقامة والفندقة",
          short: "إقامة مؤقتة لحيوانك أثناء غيابك — بانتظار تأكيد توفر الخدمة.",
          description: "الخدمة غير مفعلة حتى تؤكد الإدارة توفرها وشروطها.",
          imageUrl: px(32186519),
          imageAlt: "كلاب في منطقة إقامة خارجية مع مختصة رعاية",
          durationMin: 30,
          isActive: false,
          isBookable: false,
          sortOrder: 6,
        },
        {
          slug: "home-visits",
          name: "الزيارات المنزلية",
          short: "بانتظار تأكيد الإدارة.",
          description: "الخدمة غير مفعلة حتى تؤكد الإدارة توفرها ونطاقها الجغرافي.",
          imageUrl: px(7470634),
          imageAlt: "طبيب يفحص كلبًا",
          durationMin: 60,
          visitTypes: ["home"],
          isActive: false,
          isBookable: false,
          sortOrder: 7,
        },
        {
          slug: "tele-consult",
          name: "الاستشارات عن بعد",
          short: "بانتظار تأكيد الإدارة.",
          description: "الخدمة غير مفعلة حتى تؤكد الإدارة توفرها.",
          imageUrl: px(6235017),
          imageAlt: "طبيب يحمل كلبًا",
          durationMin: 20,
          visitTypes: ["online"],
          isActive: false,
          isBookable: false,
          sortOrder: 8,
        },
      ])
      .returning();

    const docs = await tx
      .insert(doctors)
      .values([
        {
          slug: "doctor-sample-1",
          name: "طبيب العيادة (نموذج ١)",
          title: "طبيب بيطري — طب عام ووقاية",
          qualifications: "تُضاف المؤهلات المعتمدة من الإدارة",
          specialties: ["الكشف العام", "التطعيمات"],
          bio: "ملف تجريبي يوضح شكل صفحة الطبيب. تُستبدل البيانات بالاسم والصورة والمؤهلات الرسمية بعد اعتمادها من العيادة.",
          branchId: branch.id,
          isSample: true,
          sortOrder: 1,
        },
        {
          slug: "doctor-sample-2",
          name: "طبيبة العيادة (نموذج ٢)",
          title: "طبيبة بيطرية — جراحة وتحاليل",
          qualifications: "تُضاف المؤهلات المعتمدة من الإدارة",
          specialties: ["العمليات", "الفحوصات المخبرية"],
          bio: "ملف تجريبي يوضح شكل صفحة الطبيبة. تُستبدل البيانات بالمعلومات الرسمية بعد اعتمادها.",
          branchId: branch.id,
          isSample: true,
          sortOrder: 2,
        },
        {
          slug: "doctor-sample-3",
          name: "طبيب العيادة (نموذج ٣)",
          title: "طبيب بيطري — طب عام",
          qualifications: "تُضاف المؤهلات المعتمدة من الإدارة",
          specialties: ["الكشف العام", "الوقاية"],
          bio: "ملف تجريبي يوضح شكل صفحة الطبيب. تُستبدل البيانات بالاسم والصورة والمؤهلات الرسمية بعد اعتمادها من العيادة.",
          branchId: branch.id,
          isSample: true,
          sortOrder: 3,
        },
        {
          slug: "doctor-sample-4",
          name: "طبيبة العيادة (نموذج ٤)",
          title: "طبيبة بيطرية — عناية",
          qualifications: "تُضاف المؤهلات المعتمدة من الإدارة",
          specialties: ["العناية", "التطعيمات"],
          bio: "ملف تجريبي يوضح شكل صفحة الطبيبة. تُستبدل البيانات بالمعلومات الرسمية بعد اعتمادها.",
          branchId: branch.id,
          isSample: true,
          sortOrder: 4,
        },
      ])
      .returning();

    const bySlug = Object.fromEntries(svc.map((s) => [s.slug, s.id]));
    await tx.insert(doctorServices).values([
      { doctorId: docs[0].id, serviceId: bySlug.checkup },
      { doctorId: docs[0].id, serviceId: bySlug.vaccination },
      { doctorId: docs[1].id, serviceId: bySlug.checkup },
      { doctorId: docs[1].id, serviceId: bySlug["lab-tests"] },
      { doctorId: docs[1].id, serviceId: bySlug.surgery },
      { doctorId: docs[2].id, serviceId: bySlug.checkup },
      { doctorId: docs[2].id, serviceId: bySlug.vaccination },
      { doctorId: docs[3].id, serviceId: bySlug.checkup },
      { doctorId: docs[3].id, serviceId: bySlug.grooming },
    ]);
    const dh: { doctorId: number; weekday: number; startMin: number; endMin: number }[] = [];
    for (const d of [0, 1, 2, 3, 4]) {
      dh.push({ doctorId: docs[0].id, weekday: d, startMin: H(10), endMin: H(14) });
      dh.push({ doctorId: docs[0].id, weekday: d, startMin: H(17), endMin: H(20) });
      dh.push({ doctorId: docs[1].id, weekday: d, startMin: H(17), endMin: H(22) });
      dh.push({ doctorId: docs[2].id, weekday: d, startMin: H(10), endMin: H(14) });
      dh.push({ doctorId: docs[3].id, weekday: d, startMin: H(17), endMin: H(22) });
    }
    dh.push({ doctorId: docs[1].id, weekday: 6, startMin: H(10), endMin: H(18) });
    dh.push({ doctorId: docs[3].id, weekday: 6, startMin: H(10), endMin: H(14) });
    await tx.insert(doctorHours).values(dh);

    const cats = await tx
      .insert(categories)
      .values([
        { slug: "cat-food", name: "طعام القطط", description: "أغذية جافة متوازنة للقطط بمختلف أعمارها.", imageUrl: px(17309676), sortOrder: 1 },
        { slug: "dog-food", name: "طعام الكلاب", description: "تغذية يومية للكلاب بأحجام وأعمار مختلفة.", imageUrl: px(6568950), sortOrder: 2 },
        { slug: "wet-food", name: "الطعام الرطب", description: "وجبات رطبة تضيف تنوعًا وترطيبًا لنظام حيوانك.", imageUrl: px(27175967), sortOrder: 3 },
        { slug: "grooming", name: "العناية والنظافة", description: "مستلزمات الاستحمام والتمشيط والنظافة اليومية.", imageUrl: px(1436139), sortOrder: 4 },
        { slug: "accessories", name: "الإكسسوارات", description: "أطواق وأحزمة ومستلزمات الخروج والراحة.", imageUrl: px(37549605), sortOrder: 5 },
        { slug: "toys", name: "الألعاب", description: "ألعاب تحفز النشاط وتخفف الملل.", imageUrl: px(20211114), sortOrder: 6 },
      ])
      .returning();
    const c = Object.fromEntries(cats.map((x) => [x.slug, x.id]));

    const br = await tx
      .insert(brands)
      .values([
        { slug: "valley-select", name: "Valley Select" },
        { slug: "pure-nature", name: "Pure Nature" },
        { slug: "happy-paws", name: "Happy Paws" },
      ])
      .returning();
    const b = Object.fromEntries(br.map((x) => [x.slug, x.id]));

    const P = (n: number) => Math.round(n * 100);
    await tx.insert(products).values([
      { slug: "adult-cat-dry-chicken", name: "طعام جاف للقطط البالغة بالدجاج", categoryId: c["cat-food"], brandId: b["valley-select"], petType: "cat", price: P(89), compareAtPrice: P(110), stock: 24, size: "2 كغ", imageUrl: px(17309676), imageAlt: "قطة بجانب حبيبات طعام", isFeatured: true, specs: { "المرحلة العمرية": "قطط بالغة", "النكهة": "دجاج" }, description: "تركيبة جافة يومية مخصصة للقطط البالغة، مع بروتين الدجاج كمكون رئيسي." },
      { slug: "kitten-dry-salmon", name: "طعام جاف للقطط الصغيرة بالسلمون", categoryId: c["cat-food"], brandId: b["pure-nature"], petType: "cat", price: P(75), stock: 15, size: "1.5 كغ", imageUrl: px(14440677), imageAlt: "قطة صغيرة مخططة", isFeatured: true, specs: { "المرحلة العمرية": "قطط صغيرة", "النكهة": "سلمون" }, description: "حبيبات صغيرة الحجم تناسب أسنان القطط الصغيرة في مرحلة النمو." },
      { slug: "indoor-cat-formula", name: "تركيبة القطط المنزلية", categoryId: c["cat-food"], brandId: b["valley-select"], petType: "cat", price: P(95), stock: 0, size: "2 كغ", imageUrl: px(160839, 900, "cat-animal-love-pet-160839"), imageAlt: "قطة بعيون خضراء", specs: { "المرحلة العمرية": "قطط بالغة" }, description: "تركيبة مناسبة للقطط التي تقضي معظم وقتها داخل المنزل." },
      { slug: "adult-dog-dry-lamb", name: "طعام جاف للكلاب البالغة باللحم", categoryId: c["dog-food"], brandId: b["valley-select"], petType: "dog", price: P(140), compareAtPrice: P(165), stock: 12, size: "4 كغ", imageUrl: px(6568950), imageAlt: "كلب يأكل من وعاء أبيض", isFeatured: true, specs: { "المرحلة العمرية": "كلاب بالغة", "الحجم": "سلالات متوسطة" }, description: "وجبة يومية متوازنة للكلاب البالغة من السلالات المتوسطة." },
      { slug: "puppy-dry-chicken", name: "طعام جاف للجراء بالدجاج", categoryId: c["dog-food"], brandId: b["pure-nature"], petType: "dog", price: P(120), stock: 9, size: "3 كغ", imageUrl: px(8473440), imageAlt: "كلب بوميرانيان بجانب وعاء الطعام", specs: { "المرحلة العمرية": "جراء" }, description: "تركيبة لمرحلة النمو بحبيبات مناسبة للجراء." },
      { slug: "dog-treats-bowl", name: "مكافآت مقرمشة للكلاب", categoryId: c["dog-food"], brandId: b["happy-paws"], petType: "dog", price: P(35), stock: 40, size: "300 غ", imageUrl: px(8434633), imageAlt: "وعاء معدني مليء بمكافآت الكلاب", isFeatured: true, specs: { "الاستخدام": "مكافأة أثناء التدريب" }, description: "قطع صغيرة مناسبة للمكافأة أثناء التدريب اليومي." },
      { slug: "wet-food-pouches-cat", name: "أكياس طعام رطب للقطط (12 قطعة)", categoryId: c["wet-food"], brandId: b["pure-nature"], petType: "cat", price: P(60), stock: 30, size: "12 × 85 غ", imageUrl: px(30764606), imageAlt: "قطة مسترخية تحت الشمس", specs: { "النوع": "قطع في مرق" }, description: "وجبات رطبة متنوعة النكهات تضيف ترطيبًا لنظام القطة الغذائي." },
      { slug: "wet-food-dog-tray", name: "وجبة رطبة للكلاب", categoryId: c["wet-food"], brandId: b["valley-select"], petType: "dog", price: P(18), stock: 50, size: "400 غ", imageUrl: px(27175967), imageAlt: "يد تطعم جروًا صغيرًا", specs: { "النوع": "باتيه" }, description: "وجبة رطبة يمكن تقديمها منفردة أو مع الطعام الجاف." },
      { slug: "gentle-pet-shampoo", name: "شامبو لطيف للحيوانات الأليفة", categoryId: c.grooming, brandId: b["pure-nature"], petType: "all", price: P(45), compareAtPrice: P(55), stock: 18, size: "500 مل", imageUrl: px(1436139), imageAlt: "جرو مبلل في حوض الاستحمام", isFeatured: true, relatedServiceSlug: "grooming", specs: { "الاستخدام": "استحمام دوري" }, description: "شامبو بتركيبة لطيفة للاستحمام الدوري." },
      { slug: "grooming-brush", name: "فرشاة تمشيط مزدوجة", categoryId: c.grooming, brandId: b["happy-paws"], petType: "all", price: P(39), stock: 22, size: "مقاس واحد", imageUrl: px(6131099), imageAlt: "مختص يمشط قطة برتقالية", relatedServiceSlug: "grooming", specs: { "النوع": "شعيرات ودبابيس" }, description: "جهة لفك التشابك وجهة لتلميع الفراء." },
      { slug: "nylon-harness", name: "حزام صدر قابل للتعديل", categoryId: c.accessories, brandId: b["happy-paws"], petType: "dog", price: P(65), stock: 14, size: "S / M / L", imageUrl: px(37549605), imageAlt: "كلب بوميرانيان يرتدي حزامًا ورديًا", isFeatured: true, specs: { "الخامة": "نايلون" }, description: "حزام صدر مريح يوزع الضغط أثناء المشي." },
      { slug: "leather-collar", name: "طوق كلاسيكي للكلاب", categoryId: c.accessories, brandId: b["valley-select"], petType: "dog", price: P(49), stock: 3, size: "M", imageUrl: px(16254908), imageAlt: "كلب يرتدي طوقًا أسود", specs: { "الخامة": "جلد صناعي" }, description: "طوق متين بإبزيم معدني." },
      { slug: "feather-wand-toy", name: "عصا ريش تفاعلية للقطط", categoryId: c.toys, brandId: b["happy-paws"], petType: "cat", price: P(25), stock: 35, size: "مقاس واحد", imageUrl: px(20211114), imageAlt: "قطة بنغالية صغيرة تلعب بلعبة ريش وردية", isFeatured: true, specs: { "النوع": "لعب تفاعلي" }, description: "لعبة تشجع القطة على الحركة والقفز." },
      { slug: "hanging-ball-toy", name: "كرة معلقة للقطط", categoryId: c.toys, brandId: b["happy-paws"], petType: "cat", price: P(19), stock: 27, size: "مقاس واحد", imageUrl: px(26706493), imageAlt: "قطة صغيرة تلعب بكرة معلقة", specs: { "النوع": "لعب فردي" }, description: "كرة خفيفة معلقة بخيط مرن." },
      { slug: "dog-ball-toy", name: "كرة مطاطية للكلاب", categoryId: c.toys, brandId: b["happy-paws"], petType: "dog", price: P(22), stock: 20, size: "متوسط", imageUrl: px(32070609), imageAlt: "كلب بيغل مع كرة برتقالية على العشب", specs: { "الخامة": "مطاط" }, description: "كرة مطاطية للعب والجلب في الهواء الطلق." },
      { slug: "rope-tug-toy", name: "حبل شد للعب", categoryId: c.toys, brandId: b["valley-select"], petType: "dog", price: P(29), stock: 16, size: "40 سم", imageUrl: px(27680249), imageAlt: "كلب أبيض يلعب لعبة شد الحبل", specs: { "الخامة": "قطن مجدول" }, description: "حبل مجدول للعب المشترك بينك وبين كلبك." },
    ]);

    await tx.insert(posts).values([
      {
        slug: "first-vet-visit",
        title: "كيف تُحضّر حيوانك لزيارته الأولى للعيادة؟",
        excerpt: "خطوات بسيطة تجعل الزيارة الأولى أهدأ لك ولحيوانك.",
        category: "نصائح عامة",
        imageUrl: px(6235650),
        imageAlt: "كلب صغير في العيادة البيطرية",
        content:
          "الزيارة الأولى فرصة لبناء علاقة مريحة بين حيوانك والعيادة.\n\nعوّد حيوانك على حقيبة النقل قبل الموعد بأيام، وضع فيها قطعة قماش تحمل رائحة المنزل.\n\nاكتب ملاحظاتك عن الأكل والنوم والسلوك، وأحضر أي سجلات تطعيم سابقة.\n\nحافظ على هدوئك؛ فالحيوانات تتأثر بتوتر أصحابها.",
      },
      {
        slug: "grooming-at-home",
        title: "أساسيات العناية بالفراء في المنزل",
        excerpt: "روتين أسبوعي بسيط يحافظ على نظافة الفراء وراحة حيوانك.",
        category: "العناية",
        imageUrl: px(6222967),
        imageAlt: "جرو يوركشاير في حوض الاستحمام",
        content:
          "التمشيط المنتظم يقلل التشابك ويمنحك فرصة لملاحظة أي تغير في الجلد.\n\nاختر فرشاة تناسب طول الفراء، وابدأ بجلسات قصيرة مع المكافأة.\n\nلا تُكثر من الاستحمام؛ واسأل الطبيب عن المعدل المناسب لحيوانك.",
      },
      {
        slug: "play-and-activity",
        title: "اللعب اليومي: لماذا يحتاجه حيوانك؟",
        excerpt: "النشاط اليومي جزء من الصحة النفسية والجسدية للحيوانات الأليفة.",
        category: "السلوك",
        imageUrl: px(6853522),
        imageAlt: "قطة برتقالية تلعب بحبل",
        content:
          "يساعد اللعب على تفريغ الطاقة وتقليل السلوكيات المزعجة الناتجة عن الملل.\n\nخصص وقتًا ثابتًا يوميًا، ونوّع الألعاب بين التفاعلية والفردية.\n\nراقب علامات التعب وتوقف قبل أن يفقد حيوانك اهتمامه.",
      },
    ]);
  });
}
