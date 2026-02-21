"use client";

interface IntroSectionProps {
  data: string;
}

export default function IntroSection({ data }: IntroSectionProps) {
  return (
    <div className="rounded-xl p-5 bg-white/70 border border-white/60">
      <p className="text-gray-700 text-[15px] leading-[1.8] max-w-[750px]">{data}</p>
    </div>
  );
}
