import SolarSystem from "@/components/canvas/SolarSystem";
import { SupabaseTest } from "@/components/debug/SupabaseTest";

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold text-holo-cyan font-display drop-shadow-lg">
          RWR <span className="text-xs text-white font-mono font-normal opacity-70">v1.1</span>
        </h1>
      </div>

      <div className="w-full h-full">
        <SolarSystem />
      </div>

      {/* Supabase Connection Test */}
      <SupabaseTest />

      {/* UI Overlay placeholder */}
      <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none opacity-70">
        <p className="text-xs text-white font-display tracking-widest uppercase">Relationship War Room</p>
        <p className="text-[10px] text-holo-cyan font-mono mt-1">System: Active // Monitoring</p>
      </div>
    </main>
  );
}
