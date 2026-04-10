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
              <a class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors text-white" href="#" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors text-white" href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors text-white" href="#" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
              </a>
              <a class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-primary transition-colors text-white" href="#" aria-label="Pinterest">
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M12 0a12 12 0 0 0-4.373 23.178c-.105-.949-.2-2.406.042-3.442.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
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
          <div class="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
            <div class="flex flex-wrap gap-2 justify-center items-center">
              <!-- AMEX -->
              <div class="h-7 w-11 rounded bg-[#1F72CD] flex items-center justify-center shadow-sm">
                <span class="text-white text-[8px] font-black tracking-tight leading-none">AMEX</span>
              </div>
              <!-- Apple Pay -->
              <div class="h-7 w-11 rounded bg-black flex items-center justify-center gap-0.5 shadow-sm">
                <svg viewBox="0 0 170 170" class="w-2.5 h-2.5 text-white" fill="currentColor"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.2-2.12-9.98-3.17-14.35-3.17-4.58 0-9.5 1.05-14.76 3.17-5.27 2.13-9.51 3.24-12.75 3.35-4.93.21-9.84-1.96-14.76-6.52-3.13-2.73-7.05-7.41-11.75-14.04-5.04-7.08-9.18-15.29-12.43-24.65-3.48-10.11-5.23-19.9-5.23-29.37 0-10.85 2.34-20.21 7.04-28.06 3.69-6.31 8.6-11.28 14.76-14.93 6.16-3.65 12.81-5.51 19.98-5.63 3.91 0 9.04 1.21 15.42 3.59 6.36 2.39 10.44 3.6 12.21 3.6 1.32 0 5.85-1.42 13.53-4.24 7.26-2.62 13.39-3.71 18.42-3.28 13.63 1.1 23.87 6.48 30.68 16.17-12.19 7.39-18.22 17.74-18.1 31.02.11 10.34 3.86 18.95 11.23 25.8 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.1-2.96 15.66-8.86 22.67-7.12 8.33-15.73 13.14-25.07 12.38-.12-.97-.19-1.99-.19-3.06 0-7.77 3.39-16.1 9.41-22.91 3.01-3.45 6.84-6.32 11.48-8.61 4.63-2.25 9.01-3.5 13.12-3.71.12 1.08.17 2.16.17 3.24z"/></svg>
                <span class="text-white text-[8px] font-semibold leading-none">Pay</span>
              </div>
              <!-- Bancontact -->
              <div class="h-7 w-11 rounded bg-white flex items-center justify-center gap-0.5 shadow-sm">
                <div class="w-2 h-2 rounded-full bg-[#005498]"></div>
                <div class="w-2 h-2 rounded-full bg-[#FFD200]"></div>
              </div>
              <!-- Google Pay -->
              <div class="h-7 w-11 rounded bg-white flex items-center justify-center gap-0.5 shadow-sm">
                <svg viewBox="0 0 24 24" class="w-3 h-3"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span class="text-[8px] font-bold text-[#5F6368] leading-none">Pay</span>
              </div>
              <!-- Mastercard -->
              <div class="h-7 w-11 rounded bg-white flex items-center justify-center shadow-sm">
                <div class="flex -space-x-1">
                  <div class="w-3 h-3 rounded-full bg-[#EB001B]"></div>
                  <div class="w-3 h-3 rounded-full bg-[#F79E1B] mix-blend-multiply"></div>
                </div>
              </div>
              <!-- Maestro -->
              <div class="h-7 w-11 rounded bg-white flex items-center justify-center shadow-sm">
                <div class="flex -space-x-1">
                  <div class="w-3 h-3 rounded-full bg-[#0099DF]"></div>
                  <div class="w-3 h-3 rounded-full bg-[#ED0006] mix-blend-multiply"></div>
                </div>
              </div>
              <!-- Shop Pay -->
              <div class="h-7 w-11 rounded bg-[#5A31F4] flex items-center justify-center shadow-sm">
                <span class="text-white text-[8px] font-black tracking-tight leading-none">shop</span>
              </div>
              <!-- UnionPay -->
              <div class="h-7 w-11 rounded bg-white flex items-center justify-center shadow-sm">
                <span class="text-[6px] font-black leading-[1]">
                  <span class="text-[#D10429]">Union</span><span class="text-[#00447C]">Pay</span>
                </span>
              </div>
              <!-- VISA -->
              <div class="h-7 w-11 rounded bg-white flex items-center justify-center shadow-sm">
                <span class="text-[#1A1F71] text-[9px] font-black italic tracking-tight leading-none">VISA</span>
              </div>
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
