import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IconSearch = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const IconBag = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>);
export const IconUser = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);
export const IconMenu = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>);
export const IconClose = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconCalendar = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
export const IconClock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconPin = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const IconPhone = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>);
export const IconArrow = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const IconChevron = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m15 6-6 6 6 6" /></svg>);
export const IconHeart = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>);
export const IconShield = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconStetho = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 3v6a4 4 0 0 0 8 0V3" /><path d="M10 13v2a5 5 0 0 0 10 0v-2" /><circle cx="20" cy="11" r="2" /></svg>);
export const IconPaw = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><ellipse cx="12" cy="16" rx="4.5" ry="3.8" /><circle cx="6" cy="10" r="1.8" /><circle cx="9.5" cy="6" r="1.8" /><circle cx="14.5" cy="6" r="1.8" /><circle cx="18" cy="10" r="1.8" /></svg>);
export const IconInfo = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>);
export const IconUp = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>);
export const IconCheck = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m5 12 4 4 10-10" /></svg>);
export const IconInstagram = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>);
export const IconTruck = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>);
export const IconStore = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5h16V12a2.6 2.6 0 0 1-5.2 0A2.6 2.6 0 0 1 9.6 12 2.6 2.6 0 0 1 4 12v-2.5Z" /><path d="M5.5 14.5V20h13v-5.5" /><path d="M10 20v-4.5h4V20" /></svg>);

export function Logo({ light = false }: { light?: boolean }) {
  // Placeholder wordmark — replace with the official Samaya Taiba logo file once provided (keep original artwork).
  return (
    <span className="flex items-center gap-2.5" aria-label="Samaya Taiba Vet Clinic — عيادة سامايا طيبة البيطرية">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${light ? "bg-white/15 text-pv-yellow" : "bg-pv-green text-pv-yellow"}`}>
        <IconPaw size={24} />
      </span>
      <span className="leading-tight">
        <span className={`block text-[17px] font-extrabold ${light ? "text-white" : "text-pv-deep"}`}>سامايا طيبة</span>
        <span className={`ltr block text-[11px] font-bold tracking-wide ${light ? "text-pv-pale" : "text-pv-green"}`}>SAMAYA TAIBA VET CLINIC</span>
      </span>
    </span>
  );
}
