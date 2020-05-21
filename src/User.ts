export default interface User {
  id: string;
  [key: string]: any;
}

import { Action } from "./lib/ObjectStore";

export function rootReducer(state: User, action: Action): any {
  return state;
}
