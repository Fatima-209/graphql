import { getToken } from "./services/auth.js";
import { renderLogin } from "./pages/login.js";
import { renderProfile } from "./pages/profile.js";

const app = document.getElementById("app");
// this just decide to show the page after login or not based on the token
function init() {
  const token = getToken();
  if (token) {
    renderProfile(app);
  } else {
    renderLogin(app);
  }
}

init();
