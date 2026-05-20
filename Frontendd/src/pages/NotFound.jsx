import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(192,15,102,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-10" />
        <div className="bg-primary/10 absolute -left-24 top-16 h-72 w-72 rounded-full blur-3xl" />
        <div className="bg-primary/15 absolute -right-24 bottom-16 h-80 w-80 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <div className="bg-background/70 border-border/40 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur">
            Lost Route
          </div>

          <h1 className="font-instrument-serif text-primary text-7xl font-semibold leading-none sm:text-8xl md:text-9xl">
            404
          </h1>
          <p className="mt-4 text-2xl font-semibold sm:text-3xl">
            This page doesn&apos;t exist.
          </p>
          <p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg">
            The link you followed might be broken or the page may have been
            removed. Head back to the homepage or explore what&apos;s happening
            next.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg shadow-primary/30 transition-all"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              to="/features"
              className="border-border/50 bg-background/70 hover:border-primary/40 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold backdrop-blur transition-all"
            >
              Explore Features
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="text-muted-foreground/80 mt-10 text-xs uppercase tracking-[0.2em]">
            EventOne · Route not found
          </div>
        </div>
      </main>
    </div>
  );
}
