// import Image from "next/image";
import { MeshGradient } from '@paper-design/shaders-react';

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <MeshGradient
        width={1280}
        height={1280}
        colors={['#e0eaff', '#241d9a', '#f75092', '#9f50d3']}
        distortion={0.8}
        swirl={0.1}
        grainMixer={0}
        grainOverlay={0}
        speed={1}
      />
    </div>
  );
}
