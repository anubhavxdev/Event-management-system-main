import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const Inquiry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedPlan = searchParams.get("plan") || "creative";

  const plans = {
    creative: {
      name: "Creative",
      price: "₹999/event",
    },
    professional: {
      name: "Professional",
      price: "₹1999/event",
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom Pricing",
    },
  };

  const currentPlan = plans[selectedPlan] || plans.creative;

  const [formData, setFormData] = useState({
    organizerName: "",
    email: "",
    phone: "",
    organizationName: "",
    eventType: "",
    attendees: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log({
      plan: currentPlan.name,
      ...formData,
    });

    toast.success("Inquiry submitted successfully!");

    navigate("/thank-you");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-15 pointer-events-none"></div>

      <div className="relative flex-1 flex items-center justify-center py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <div
            className="bg-white/40 border border-white/50 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition-all"
            >
              ✕
            </button>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Event Inquiry
              </h1>
              <p className="text-gray-600 mt-2">
                Tell us about your event and we'll get in touch.
              </p>
            </div>

            {/* Selected Plan */}
            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/10 p-5">
              <p className="text-sm text-gray-600 mb-1">Selected Plan</p>

              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {currentPlan.name}
                </h2>

                <span className="font-bold text-primary">
                  {currentPlan.price}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Organizer Name
                </label>

                <input
                  type="text"
                  name="organizerName"
                  required
                  value={formData.organizerName}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Organization Name
                </label>

                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ABC Events"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Event Type
                </label>

                <input
                  type="text"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Concert, Seminar, Workshop..."
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Expected Attendees
                </label>

                <input
                  type="number"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-600">
                  Additional Details
                </label>

                <textarea
                  rows="4"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full mt-2 bg-white/50 border border-white/50 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tell us more about your event..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg transition-all hover:opacity-90"
              >
                Submit Inquiry
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Inquiry;