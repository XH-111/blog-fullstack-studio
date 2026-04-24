type PageHeroProps = {
  title: string;
  description: string;
  image?: string;
};

export function PageHero({
  title,
  description,
  image = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,36,47,0.18),rgba(20,36,47,0.34))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.18),transparent_22%)]" />
      <div className="relative mx-auto flex min-h-[380px] w-full max-w-7xl items-center px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-white">
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">{title}</h1>
          <p className="mt-5 inline-block rounded-full bg-black/24 px-4 py-2 text-sm text-white/88 backdrop-blur-sm">
            {description}
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 translate-y-1">
        <svg
          viewBox="0 0 1440 160"
          className="w-full fill-[var(--background)]"
          preserveAspectRatio="none"
        >
          <path d="M0,96L40,90.7C80,85,160,75,240,80C320,85,400,107,480,117.3C560,128,640,128,720,117.3C800,107,880,85,960,85.3C1040,85,1120,107,1200,112C1280,117,1360,107,1400,101.3L1440,96L1440,160L1400,160C1360,160,1280,160,1200,160C1120,160,1040,160,960,160C880,160,800,160,720,160C640,160,560,160,480,160C400,160,320,160,240,160C160,160,80,160,40,160L0,160Z" />
        </svg>
      </div>
    </section>
  );
}
