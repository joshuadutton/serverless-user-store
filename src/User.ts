import { Action } from "./lib/ObjectStore";

export default interface User {
  id: string;
  [key: string]: any;
}

export function rootReducer(state: User, action: Action): User {
  return state;
}
