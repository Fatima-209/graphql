import { getToken } from "./services/auth.js";
import { renderLogin } from "./pages/login.js";
import { renderProfile } from "./pages/profile.js";

const app = document.getElementById("app");

function init() {
  const token = getToken();
  if (token) {
    renderProfile(app);
  } else {
    renderLogin(app);
  }
}

init();
