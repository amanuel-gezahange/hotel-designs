import type { ReactNode } from "react";

/** Image with a brand-gradient fallback so sites look good before photos arrive. */
export function Img({
  src,
  alt = "",
  className = "",
  priority = false,
}: {
  src?: string;
  alt?: string;
  className?: string;
  /** Above-the-fold photo: load immediately instead of lazily. */
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`bg-gradient-to-br from-brand to-accent/70 ${className}`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={`object-cover ${className}`}
    />
  );
}

export function Section({
  id,
  title,
  eyebrow,
  children,
  tint = false,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  tint?: boolean;
}) {
  return (
    <section id={id} className={tint ? "bg-brand-soft" : ""}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div data-reveal className="section-head mb-10">
          {eyebrow && (
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent-text">
              {eyebrow}
            </p>
          )}
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold sm:text-4xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "solid",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "accent";
  external?: boolean;
}) {
  const styles = {
    solid: "bg-brand text-on-brand hover:opacity-90",
    accent: "bg-accent text-on-accent hover:opacity-90",
    outline: "border border-current hover:bg-white/10",
  }[variant];
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className={`inline-flex items-center justify-center rounded-[var(--radius)] px-6 py-3 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </a>
  );
}
