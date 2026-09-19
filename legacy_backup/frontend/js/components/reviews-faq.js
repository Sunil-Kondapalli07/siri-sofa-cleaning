/**
 * Reviews, Service Areas & FAQ Component with Floating WhatsApp Action
 */

const ReviewsFaqComponent = {
  render() {
    return `
      <!-- Service Areas Banner -->
      <section class="py-12 bg-white border-b border-slate-100">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-8">
            <span class="text-xs font-bold uppercase tracking-wider text-teal-700">Hyderabad Service Zones</span>
            <h3 class="text-2xl font-black text-slate-900 mt-1">Available Across All Hyderabad & Secunderabad Zones</h3>
            <p class="text-xs text-slate-500 mt-1">Our certified technicians are stationed across 4 zones for prompt 30-min doorstep arrival.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-colors">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div class="font-black text-slate-900 text-sm">Zone 1 — Cyberabad / West</div>
              </div>
              <div class="text-xs font-semibold text-teal-800 mb-1">Hitec City, Madhapur, Gachibowli</div>
              <div class="text-[11px] text-slate-500 leading-relaxed">Kondapur, Manikonda, Financial District, Tellapur, Nallagandla, Kokapet</div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-colors">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div class="font-black text-slate-900 text-sm">Zone 2 — Central Hyderabad</div>
              </div>
              <div class="text-xs font-semibold text-teal-800 mb-1">Banjara Hills, Jubilee Hills</div>
              <div class="text-[11px] text-slate-500 leading-relaxed">Somajiguda, Begumpet, Panjagutta, Khairatabad, Ameerpet, SR Nagar</div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-colors">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div class="font-black text-slate-900 text-sm">Zone 3 — North & Secunderabad</div>
              </div>
              <div class="text-xs font-semibold text-teal-800 mb-1">Kukatpally, Miyapur, Nizampet</div>
              <div class="text-[11px] text-slate-500 leading-relaxed">Secunderabad Cantt, Bowenpally, Trimulgherry, Sainikpuri, Alwal, AS Rao Nagar</div>
            </div>

            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-colors">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <div class="font-black text-slate-900 text-sm">Zone 4 — South & East</div>
              </div>
              <div class="text-xs font-semibold text-teal-800 mb-1">Dilsukhnagar, LB Nagar, Uppal</div>
              <div class="text-[11px] text-slate-500 leading-relaxed">Mehdipatnam, Attapur, Himayatnagar, Narayanaguda, Tarnaka, Habsiguda</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Customer Reviews & Wall of Love -->
      <section class="py-16 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <span class="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Real Client Experiences
            </span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-3">
              Loved by Homeowners & Offices
            </h2>
            <p class="text-slate-600 text-sm sm:text-base">
              Over 15,000 satisfied furniture revivals across South India.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-1 text-amber-400 mb-3">
                  ★★★★★
                </div>
                <p class="text-slate-700 text-sm italic leading-relaxed">
                  "The 3-stage extraction removed coffee stains from our 3-seater velvet sofa that had been there for a year. The technician showed the dirty water chamber — unbelievable how much dust was inside!"
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                  AR
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">Ananya Reddy</div>
                  <div class="text-[10px] text-slate-400">Jubilee Hills, Hyderabad • Verified Booking</div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-1 text-amber-400 mb-3">
                  ★★★★★
                </div>
                <p class="text-slate-700 text-sm italic leading-relaxed">
                  "Technician Raj Kumar was extremely courteous. He placed protective floor mats, explained each stage of the 6-step hygiene process, and our dining chairs look brand new."
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                  VR
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">Vikram R.</div>
                  <div class="text-[10px] text-slate-400">Banjara Hills, Hyderabad • Verified Booking</div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-1 text-amber-400 mb-3">
                  ★★★★★
                </div>
                <p class="text-slate-700 text-sm italic leading-relaxed">
                  "The 3D sofa selector made choosing the seat configuration and checking the price so effortless! No surprise price shocks when the team arrived. Absolutely transparent."
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                  SK
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">Sunil Kumar</div>
                  <div class="text-[10px] text-slate-400">Gachibowli, Hyderabad • Verified Booking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Accordion -->
      <section class="py-16 bg-white border-t border-slate-100">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="text-center mb-12">
            <span class="text-xs font-bold uppercase tracking-wider text-teal-700">Got Questions?</span>
            <h3 class="text-3xl font-black text-slate-900 mt-1">Frequently Asked Questions</h3>
          </div>

          <div class="space-y-4">
            <details class="bg-slate-50 rounded-2xl p-5 border border-slate-200 transition-all cursor-pointer group" open>
              <summary class="font-bold text-slate-900 text-base flex justify-between items-center list-none">
                <span>How long does it take for the sofa to dry completely?</span>
                <span class="text-teal-600 font-bold group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 leading-relaxed">
                Our industrial high-power extraction machinery sucks out 90% to 95% of the moisture immediately during cleaning. In a room with normal ventilation or a ceiling fan running, your sofa will be dry and ready for use in just <strong>2 to 3 hours</strong>.
              </p>
            </details>

            <details class="bg-slate-50 rounded-2xl p-5 border border-slate-200 transition-all cursor-pointer group">
              <summary class="font-bold text-slate-900 text-base flex justify-between items-center list-none">
                <span>Are the cleaning chemicals safe for babies and pets?</span>
                <span class="text-teal-600 font-bold group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 leading-relaxed">
                Yes, 100%! We exclusively use pH-neutral, non-hazardous biodegradable botanical enzyme shampoo formulations. They leave zero toxic residues, have a mild natural aroma, and are completely safe for toddlers and pets.
              </p>
            </details>

            <details class="bg-slate-50 rounded-2xl p-5 border border-slate-200 transition-all cursor-pointer group">
              <summary class="font-bold text-slate-900 text-base flex justify-between items-center list-none">
                <span>Can you clean leather, suede, and velvet sofas?</span>
                <span class="text-teal-600 font-bold group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 leading-relaxed">
                Absolutely. Our technician performs a fabric test (Step 01: Inspection) upon arrival. For genuine leather or faux leather, we use specialized organic conditioning creams and gentle buffer pads instead of heavy water immersion.
              </p>
            </details>

            <details class="bg-slate-50 rounded-2xl p-5 border border-slate-200 transition-all cursor-pointer group">
              <summary class="font-bold text-slate-900 text-base flex justify-between items-center list-none">
                <span>What happens if I need to cancel or reschedule?</span>
                <span class="text-teal-600 font-bold group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p class="text-xs text-slate-600 mt-3 leading-relaxed">
                Rescheduling is completely free anytime up to 2 hours before your service slot! You can reschedule directly through the <strong>Track Booking</strong> tab using your Booking ID without needing to call anyone.
              </p>
            </details>
          </div>
        </div>
      </section>

      <!-- Floating WhatsApp & Support Widget -->
      <aside aria-label="Support contacts" class="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <a href="https://wa.me/919800000000?text=Hi%20Siri%20Sofa%20Services%2C%20I%20would%20like%20to%20inquire%20about%20cleaning%20services" target="_blank" class="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-110 transition-all group" title="Chat on WhatsApp">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        </a>
      </aside>
    `;
  }
};

window.ReviewsFaqComponent = ReviewsFaqComponent;
