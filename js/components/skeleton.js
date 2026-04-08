export function productCardSkeleton(count = 4) {
  return Array(count).fill(`
    <div class="animate-pulse">
      <div class="aspect-square rounded-2xl skeleton mb-4"></div>
      <div class="skeleton h-5 w-3/4 mb-2"></div>
      <div class="skeleton h-4 w-1/2 mb-3"></div>
      <div class="skeleton h-6 w-1/3"></div>
    </div>
  `).join('');
}

export function collectionCardSkeleton(count = 6) {
  return Array(count).fill(`
    <div class="animate-pulse">
      <div class="bg-surface-container-low rounded-2xl overflow-hidden">
        <div class="aspect-square skeleton"></div>
        <div class="p-5 space-y-3">
          <div class="skeleton h-4 w-20"></div>
          <div class="skeleton h-6 w-3/4"></div>
          <div class="flex justify-between">
            <div class="skeleton h-6 w-16"></div>
            <div class="skeleton w-12 h-12 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

export function productDetailSkeleton() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      <div class="lg:col-span-6 space-y-4">
        <div class="aspect-square skeleton rounded-2xl"></div>
        <div class="grid grid-cols-4 gap-4">
          <div class="aspect-square skeleton rounded-xl"></div>
          <div class="aspect-square skeleton rounded-xl"></div>
          <div class="aspect-square skeleton rounded-xl"></div>
          <div class="aspect-square skeleton rounded-xl"></div>
        </div>
      </div>
      <div class="lg:col-span-6 space-y-6">
        <div class="skeleton h-12 w-3/4"></div>
        <div class="skeleton h-6 w-1/2"></div>
        <div class="skeleton h-24 w-full rounded-2xl"></div>
        <div class="skeleton h-16 w-full rounded-2xl"></div>
        <div class="skeleton h-16 w-full rounded-full"></div>
      </div>
    </div>
  `;
}

export function cartItemSkeleton(count = 2) {
  return Array(count).fill(`
    <div class="flex gap-6 p-6 bg-surface-container-lowest rounded-lg animate-pulse">
      <div class="skeleton w-40 h-40 rounded-lg flex-shrink-0"></div>
      <div class="flex-grow space-y-3">
        <div class="skeleton h-6 w-3/4"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <div class="skeleton h-10 w-32 rounded-full mt-4"></div>
      </div>
    </div>
  `).join('');
}

export function textBlockSkeleton(lines = 3) {
  return Array(lines).fill(0).map((_, i) => `
    <div class="skeleton h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'} mb-3"></div>
  `).join('');
}
