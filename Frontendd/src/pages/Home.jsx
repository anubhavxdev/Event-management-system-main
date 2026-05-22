import React from 'react';
import SEO from '../components/SEO';
import Hero from "../components/mvpblocks/gradient-hero";
import Features from "../components/mvpblocks/feature-2";
import TestimonialsCarousel from "../components/mvpblocks/testimonials-carousel";
import FAQ from "../components/mvpblocks/faq-3";
import Sparkles from "../components/mvpblocks/sparkles-logo";

const Home = () => {
    return (
        <>
            <SEO 
                title="Discover & Manage Events"
                description="eventone - The ultimate platform to discover, create, and manage events. Connect with organizers, register for events, and stay updated on what's happening around you."
                url="/"
            />
            <Hero />
            <Features />
            <TestimonialsCarousel />
            <FAQ />
            <Sparkles />
        </>
    );
};

export default Home;
