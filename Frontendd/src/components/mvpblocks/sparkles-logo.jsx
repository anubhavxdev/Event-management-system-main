import { SparklesCore } from "../ui/sparkles";
import aws from "../../assets/logos/aws.png";
import codingblocks from "../../assets/logos/codingblocks.png";
import codingninja from "../../assets/logos/codingninja.png";
import d4 from "../../assets/logos/d4.jpg";
import encrypted from "../../assets/logos/encrypted.jpg";
import gdg from "../../assets/logos/gdg.jpg";

export default function SparklesLogo() {
  return (
    <div className="w-full overflow-hidden bg-white pt-32 pb-16">
      <div className="relative z-20 mx-auto w-full max-w-4xl px-4">
        <div className="text-center text-4xl md:text-5xl font-bold text-black">
          <span className="text-rose-600">Trusted by experts.</span>
          <br className="md:hidden" />
          <span className="md:ml-3">Used by the leaders.</span>
          <br />
          <br />
        </div>

        <div className="mt-14 grid grid-cols-3 gap-8 md:grid-cols-6 items-center opacity-100">
          <img
            src={aws}
            alt="AWS"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
          />
          <img
            src={codingblocks}
            alt="Coding Blocks"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
          />
          <img
            src={codingninja}
            alt="Coding Ninja"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
          />
          <img
            src={d4}
            alt="D4"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
          />
          <img
            src={encrypted}
            alt="Encrypted"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
          />
          <img
            src={gdg}
            alt="GDG"
            className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
          />
        </div>
      </div>

      <div className="relative z-10 -mt-40 h-[32rem] md:h-[40rem] w-full overflow-hidden [mask-image:radial-gradient(circle,white,transparent)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom,#e60a64,transparent_70%)] before:opacity-40 after:absolute after:top-1/2 after:-left-1/2 after:aspect-[1/0.7] after:w-[200%] after:rounded-[100%] after:border-t after:border-[#c5769066] after:bg-white">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          particleDensity={300}
          particleColor="hsl(var(--foreground))"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(circle,white,transparent_85%)]"
        />
      </div>
    </div>
  );
}
