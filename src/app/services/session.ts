import { effect, inject, untracked } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * For per-user stores: runs `load` whenever a user signs in (or a different user does) and
 * `clear` when they sign out, so no account ever sees another's data. Call from a constructor.
 */
export function whenSignedIn(load: () => void, clear: () => void) {
  const auth = inject(AuthService);
  effect(() => {
    const signedIn = auth.user()?.id;
    untracked(() => {
      clear();
      if (signedIn !== undefined) load();
    });
  }, { allowSignalWrites: true });
}
