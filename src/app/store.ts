
import { useEffect, useMemo, useReducer } from 'react';
import { loadLocal, saveLocal } from '@/utils/storage';
import { validate, getInitialConfig } from '@/spec/builder';
import { buildErrorIndex, expandUnknownKeyIssues } from '@/utils/errors';

type Action = { type: 'SET'; payload: any } | { type: 'PATCH'; payload: Partial<any> };

function reducer(state: any, action: Action): any
{
  if (action.type === 'SET') { return action.payload; }
  return { ...state, ...action.payload } as any;
}

export function useStore()
{
  const [state, dispatch] = useReducer(reducer, null, () =>
  {
    const local = loadLocal();
    if (local) { return local; }
    return getInitialConfig();
  });

  const { result, flatIssues, errorIndex } = useMemo(() =>
  {
    const result = validate(state);
    const flatIssues = expandUnknownKeyIssues(result.issues);
    const errorIndex = buildErrorIndex(flatIssues);
    return { result, flatIssues, errorIndex };
  }, [state]);

  useEffect(() => { saveLocal(state); }, [state]);

  const isValid = result.issues.length === 0;

  return { state, dispatch, errorIndex, issues: result.issues, isValid, flatIssues};
}
