"use client";

import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export const ReviewsFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const reviews = [
    {
      name: "Lakshmi Narayana",
      locality: "Jubilee Hills, Hyderabad",
      rating: 5,
      date: "3 days ago",
      text: "Booked a 5-seater velvet sofa cleaning. The team arrived right on time with professional machines. The amount of dust extracted was shocking! Sofa looks brand new and dried in 2 hours.",
    },
    {
      name: "Siddharth Verma",
      locality: "Gachibowli, Hyderabad",
      rating: 5,
      date: "1 week ago",
      text: "Excellent service! We had tough coffee stains on our cream fabric sofa from months ago. The technician did spot treatment and completely removed the stains. Highly recommend Siri Sofa Services.",
    },
    {
      name: "Ananya Reddy",
      locality: "Madhapur, Hyderabad",
      rating: 5,
      date: "2 weeks ago",
      text: "Very polite staff and no mess in the living room. Cleaned our dining chairs and L-shape sectional. Zero chemical smell afterwards, very clean and fresh.",
    },
  ];

  const faqs = [
    {
      q: "How long will my sofa take to dry completely?",
      a: "Thanks to our high-suction 12-bar moisture extraction, 90% of moisture is extracted immediately. Your sofa will be completely dry and ready for use in just 2 to 3 hours with normal ceiling fan circulation.",
    },
    {
      q: "Do you clean leather and faux leather seating as well as fabric?",
      a: "Yes. We clean all upholstery materials including linen, cotton, velvet, suede, microfiber, leatherette, and genuine leather. For leather, we use pH-balanced conditioner to restore suppleness and prevent cracking.",
    },
    {
      q: "Can old pet stains and food grease be completely removed?",
      a: "Our certified technicians apply specialized bio-enzyme spot lifters for protein, tannin, and oil-based stains before steam extraction. Over 95% of stubborn stains are completely removed.",
    },
    {
      q: "What do I need to arrange before the technician arrives?",
      a: "Nothing complicated! We bring all machines, hoses, and eco-friendly shampoos. We only require access to a normal electrical power socket and regular domestic tap water.",
    },
    {
      q: "When and how do I pay?",
      a: "Payment is collected only AFTER the service is completed and you have inspected your furniture with the technician. We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and cash.",
    },
  ];

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-[#FAF9F6] border-t border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Reviews Section */}
        <div className="mb-20">
          <ScrollReveal direction="up">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
                Real Feedback
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#121820] mt-3 tracking-tight">
                Verified Hyderabad Reviews
              </h2>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-sm text-[#121820]">4.9 out of 5</span>
                <span className="text-xs text-[#8490A0]">• 1,200+ Verified Customer Ratings</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 100}>
                <div className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs flex flex-col justify-between h-full">
                  <div>
                    <div className="flex text-amber-400 mb-3">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#525D6C] leading-relaxed italic mb-4">
                      &quot;{r.text}&quot;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#121820]">{r.name}</h4>
                      <span className="text-[11px] text-[#8490A0]">{r.locality}</span>
                    </div>
                    <span className="text-[10px] font-medium text-[#8490A0]">{r.date}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C4A34] bg-[#EBF5F0] px-4 py-1.5 rounded-full border border-[#C2E2D3]">
                Common Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#121820] mt-3 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqs.map((f, idx) => {
              const isOpen = openFaq === idx;
              return (
                <ScrollReveal key={idx} direction="up" delay={idx * 60}>
                  <div className="bg-white rounded-2xl border border-black/8 overflow-hidden transition-all shadow-xs">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-base text-[#121820] hover:text-[#0C4A34] transition-colors"
                    >
                      <span>{f.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#0C4A34] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8490A0] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#525D6C] leading-relaxed border-t border-black/5 pt-3">
                        {f.a}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
