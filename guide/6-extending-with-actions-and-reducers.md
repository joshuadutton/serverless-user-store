# 6 Extending with Actions and Reducers

This is a chapter in the [Intro to Serverless](README.md) guide.

Action and Reducer interfaces are defined in `/lib/ObjectStore.ts`:

```TypeScript
// /src/lib/ObjectStore.ts

// Follows Flux Standard Actions (see https://github.com/redux-utilities/flux-standard-action)
export interface Action {
  type: string,
  payload?: { [key: string]: any },
  meta?: { [key: string]: any },
  error?: boolean 
}

// pure function that produces new state (see https://redux.js.org/basics/reducers/#handling-actions)
export type Reducer<T> = (state: T, action: Action) => T;

export async function actionHandler<T>(store: ObjectStore<T>, id: string, action: Action, reducer: Reducer<T>): Promise<T> {
  try {
    let state = await store.get(id);
    if (state) {
      state = reducer(state, action);
      return store.put(id, state);
    } else {
      return Promise.reject(`no item found with id ${id}`);
    }
  } catch(error) {
    return Promise.reject(error);
  }
}
```

I have a file stubbed out called User.ts that looks like this:

```TypeScript
// /src/User.ts

// TODO: add your own Actions
import { Action } from "./lib/ObjectStore";

// TODO: add your own fields
export default interface User { 
  id: string;
  [key: string]: any;
}

// TODO: add your own Reducers
// This function is called when a user sends an action to the `/user/self/action`
export function rootReducer(state: User, action: Action): User {
  return state;
}
```

I have had great success using uni-directional dataflow patterns to manage the state of an object. This includes the global state of a mobile or front-end web application, or a single object like a user or an IoT device. My use of it in a back-end framework is a bit unique, and it is not intended for a wide variety of applications, just updating single objects that are stored as a single document. Here is a good article from the React world on its pros and cons: https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367

To implement this pattern to update your user object, here are some tutorials you can follow (note: just follow the action and reducer part of the tutorials):

- Actions and Reducers guides from Redux (ignore the rest):
  - https://redux.js.org/basics/actions
  - https://redux.js.org/basics/reducers
  - https://redux.js.org/recipes/using-object-spread-operator/
  - https://redux.js.org/recipes/structuring-reducers/structuring-reducers
- Pure functions: https://medium.com/@jamesjefferyuk/javascript-what-are-pure-functions-4d4d5392d49c
