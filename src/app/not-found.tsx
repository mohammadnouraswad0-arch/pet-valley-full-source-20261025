import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[80vh] place-items-center bg-pv-cream px-6 text-center">
      <div>
        <p className="text-7xl font-extrabold text-pv-yellow">404</p>
        <h1 className="mt-4 text-3xl">الصفحة غير موجودة</h1>
        <p className="mt-2 text-pv-muted">ربما نُقلت الصفحة أو أن الرابط غير صحيح.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-secondary">الرئيسية</Link>
          <Link href="/shop" className="btn btn-shop">المتجر</Link>
          <Link href="/booking" className="btn btn-book">احجز موعدًا</Link>
        </div>
      </div>
    </main>
  );
}
