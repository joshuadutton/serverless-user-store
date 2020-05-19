export default interface User {
  id: string;
  [key: string]: any;
}

import { Action } from "./lib/DataStore";

export function rootReducer(state: User, action: Action): any {
  return state;
}
