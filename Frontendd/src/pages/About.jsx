import React from 'react';
import SEO from '../components/SEO';
import AboutBlock from "../components/mvpblocks/about-us-1";

const About = () => {
    return (
        <div className="pt-20">
            <SEO 
                title="About Us"
                description="Learn about eventone's mission to revolutionize event management. Discover how we're empowering organizers and event enthusiasts worldwide."
                url="/about-us"
            />
            <AboutBlock />
        </div>
    );
};

export default About;
