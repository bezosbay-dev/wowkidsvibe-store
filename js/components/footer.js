function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/account/') || path.includes('/pages/')) return '../';
  return '';
}

export function initFooter() {
  const el = document.querySelector('[data-component="footer"]');
  if (!el) return;
  el.innerHTML = renderFooter();
}

function renderFooter() {
  const b = getBasePath();
  return `
    <footer class="w-full bg-[#0D0D0D] text-white pt-24 pb-12 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-20">
          <!-- Left Column: Logo & Socials -->
          <div class="md:col-span-4 space-y-8">
            <a href="${b}index.html" class="text-2xl font-extrabold tracking-tighter font-headline text-white hover:text-[#FF4D6D] transition-colors">
              WowKidsVibe
            </a>
            <p class="text-zinc-400 text-sm leading-relaxed max-w-xs font-body">
              Elevating the childhood experience through high-energy, curated design and kinetic innovation.
            </p>
            <div class="flex gap-3">
              <a class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors" href="#" aria-label="YouTube">
                <span class="material-symbols-outlined text-sm text-white">play_arrow</span>
              </a>
              <a class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors" href="#" aria-label="Instagram">
                <span class="material-symbols-outlined text-sm text-white">camera_alt</span>
              </a>
              <a class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors" href="#" aria-label="TikTok">
                <span class="material-symbols-outlined text-sm text-white">music_note</span>
              </a>
              <a class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors" href="#" aria-label="Pinterest">
                <span class="material-symbols-outlined text-sm text-white">push_pin</span>
              </a>
            </div>
          </div>

          <!-- Explore -->
          <div class="md:col-span-2 space-y-6">
            <h4 class="text-xs font-label uppercase tracking-[0.2em] text-zinc-500 font-bold">Explore</h4>
            <ul class="space-y-4">
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}collection.html?handle=all">Shop All</a></li>
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}collection.html?handle=new-arrivals">New Arrivals</a></li>
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}collection.html?handle=best-sellers">Best Sellers</a></li>
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}about.html">About Us</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div class="md:col-span-2 space-y-6">
            <h4 class="text-xs font-label uppercase tracking-[0.2em] text-zinc-500 font-bold">Support</h4>
            <ul class="space-y-4">
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}contact.html">Contact Us</a></li>
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}pages/returns-refunds.html">Shipping & Returns</a></li>
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}order-tracking.html">Track Order</a></li>
              <li><a class="text-sm text-zinc-400 hover:text-white transition-colors font-body" href="${b}contact.html#faq">FAQs</a></li>
            </ul>
          </div>

          <!-- Newsletter -->
          <div class="md:col-span-4 space-y-6">
            <h4 class="text-xs font-label uppercase tracking-[0.2em] text-zinc-500 font-bold">Newsletter</h4>
            <p class="text-sm text-zinc-400">Get early access to new drops and kinetic play ideas.</p>
            <form class="relative group" onsubmit="event.preventDefault();">
              <input class="w-full bg-transparent border-b border-zinc-800 py-3 pr-10 focus:outline-none focus:border-primary transition-colors text-sm font-body text-white placeholder-zinc-500" placeholder="Email address" type="email" />
              <button type="submit" class="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                <span class="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
          <p class="text-[10px] font-label uppercase tracking-[0.2em] text-zinc-500">
            &copy; ${new Date().getFullYear()} WOWKIDSVIBE. CURATING KINETIC CHILDHOODS.
          </p>
          <div class="flex gap-4 items-center">
            <div class="flex gap-3 opacity-40 grayscale">
              <span class="material-symbols-outlined text-xl">credit_card</span>
              <span class="material-symbols-outlined text-xl">payments</span>
              <span class="material-symbols-outlined text-xl">account_balance_wallet</span>
              <span class="material-symbols-outlined text-xl">contactless</span>
            </div>
            <div class="flex gap-6 text-xs text-zinc-500">
              <a class="hover:text-white transition-colors" href="${b}pages/privacy-policy.html">Privacy Policy</a>
              <a class="hover:text-white transition-colors" href="${b}pages/terms-conditions.html">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `;
}
