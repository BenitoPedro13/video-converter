import { createTV } from 'tailwind-variants';

import { cn } from '@/utils/cn';

export type { VariantProps, ClassValue } from 'tailwind-variants';

export const tv = createTV({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  twMerge: cn as any,
});
