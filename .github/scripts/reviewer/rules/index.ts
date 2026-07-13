import { DbImportRule } from './DbImportRule';
import { DirectFetchRule } from './DirectFetchRule';
import { LargeFunctionRule } from './LargeFunctionRule';
import { SignatureChangeRule } from './SignatureChangeRule';
import { ReactHookBugRule } from './ReactHookBugRule';
import { DangerousApiRule } from './DangerousApiRule';
import { SecuritySinkRule } from './SecuritySinkRule';

export const rules = [
  new DbImportRule(),
  new DirectFetchRule(),
  new LargeFunctionRule(),
  new SignatureChangeRule(),
  new ReactHookBugRule(),
  new DangerousApiRule(),
  new SecuritySinkRule()
];
