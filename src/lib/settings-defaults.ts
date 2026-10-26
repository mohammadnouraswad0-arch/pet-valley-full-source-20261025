export type SiteSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroEyebrow: string;
  heroImage: string;
  heroImageAlt: string;
  topbarMessage: string;
  shopBarMessage: string;
  shopHeroTitle: string;
  shopHeroSubtitle: string;
  shopHeroImage: string;
  previewNotice: string; // shown site-wide while sample data is in use; empty = hidden
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  snapchat: string;
  tiktok: string;
  mapUrl: string;
  currency: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: number; // minor units
  freeShippingThreshold: number | null; // minor units, null = no free shipping offer
  codEnabled: boolean;
  bookingReviewMode: "manual" | "auto";
};

export const DEFAULT_SETTINGS: SiteSettings = {
  heroEyebrow: "رعاية بيطرية باهتمام",
  heroTitle: "رعاية تحبها… وراحة يشعر بها حيوانك",
  heroSubtitle:
    "رعاية بيطرية متكاملة لحيواناتك الأليفة، من الفحص والتطعيم إلى العناية والإقامة، وفق الخدمات المتاحة لدى عيادة سامايا طيبة.",
  heroImage:
    "https://images.pexels.com/photos/19490691/pexels-photo-19490691.jpeg?auto=compress&cs=tinysrgb&w=1800",
  heroImageAlt: "كلب وقطة يحتضنان بعضهما بودّ في حديقة خضراء",
  topbarMessage: "احجز موعدك إلكترونيًا في دقائق",
  shopBarMessage: "كل ما يحتاجه صديقك الأليف في مكان واحد",
  shopHeroTitle: "اختيارات يومية لحياة أكثر سعادة",
  shopHeroSubtitle: "اكتشف منتجات مختارة للعناية والتغذية وراحة أصدقائك الأوفياء.",
  shopHeroImage:
    "https://images.pexels.com/photos/9428284/pexels-photo-9428284.jpeg?auto=compress&cs=tinysrgb&w=1400",
  previewNotice: "",
  phone: "0552323189",
  whatsapp: "0552323189",
  email: "",
  instagram: "https://instagram.com/samayataiba/",
  snapchat: "https://www.snapchat.com/add/samayataiba",
  tiktok: "https://www.tiktok.com/@samayataiba",
  mapUrl: "https://maps.app.goo.gl/MhKVMBivCxLqqkgB8?g_st=ic",
  currency: "ر.س",
  pickupEnabled: true,
  deliveryEnabled: true,
  deliveryFee: 2500,
  freeShippingThreshold: null,
  codEnabled: true,
  bookingReviewMode: "manual",
};
