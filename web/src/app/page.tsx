import { AgenticStudio } from "@/components/AgenticStudio";

export default function Home() {
  return (
    <main className="relative mx-auto w-full">
      <div className="absolute inset-x-0 top-[-300px] h-[600px] bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.14),_transparent_70%)] blur-3xl" />
      <AgenticStudio />
    </main>
  );
}
