import type { RouteRecord } from "@dotmix/router";
import IndexPage from "./pages/index.tix";
import NotFoundPage from "./pages/404.tix";

/** Site routes. `mix dev` and `mix preview` serve index.html for every path, so deep links work. */
export const routes: RouteRecord[] = [
  { path: "/", component: IndexPage },
  { path: "*", component: NotFoundPage },
];
