import React from 'react';
import SEO from '../components/SEO';
import Feature2 from "../components/mvpblocks/feature-2";
import Feature3 from "../components/mvpblocks/feature-3";

const Features = () => {
    return (
        <div className="pt-20">
            <SEO 
                title="Features"
                description="Explore the powerful features of eventone - event creation, registration management, real-time notifications, analytics, and more."
                url="/features"
            />
            <Feature2 />
            <Feature3 />
        </div>
    );
};

export default Features;
