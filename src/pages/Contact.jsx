import React from 'react';
import SEO from '../components/SEO';
import ContactBlock from "../components/mvpblocks/contact-us-1";

const Contact = () => {
    return (
        <div className="pt-20">
            <SEO 
                title="Contact Us"
                description="Get in touch with the eventone team. We're here to help with any questions about our event management platform."
                url="/contact"
            />
            <ContactBlock />
        </div>
    );
};

export default Contact;
