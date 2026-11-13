import { DestroyRef, inject, signal } from '@angular/core';

/** Seconds-remaining countdown for "resend code" buttons. Create inside an injection context. */
export function createCooldown() {
  const remaining = signal(0);
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => clearInterval(timer);
  inject(DestroyRef).onDestroy(stop);

  return {
    remaining: remaining.asReadonly(),
    start(seconds: number) {
      stop();
      remaining.set(seconds);
      timer = setInterval(() => {
        remaining.update(s => s - 1);
        if (remaining() <= 0) stop();
      }, 1000);
    }
  };
}
