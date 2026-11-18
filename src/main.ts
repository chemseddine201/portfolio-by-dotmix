import "./styles/style.css";
import "./styles/heroes.css";
import { mount } from "@dotmix/runtime";
import { createBrowserRouter } from "@dotmix/router";
import App from "./App.tix";
import { routes } from "./routes.js";

const container = document.getElementById("app");
if (container === null) {
  throw new Error("Missing #app container in index.html");
}

mount(App, container, { router: createBrowserRouter(routes) });
