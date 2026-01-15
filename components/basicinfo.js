import { graphqlRequest } from "../services/graphql.js";

export async function renderBasicInfo(container) {
  /* ---------- FETCH USER + AUDIT DATA ---------- */
  const query = `
    {
      user {
        id
        login
        attrs
      }

      audit_up: transaction(
        where: {
          type: { _eq: "up" }
        }
      ) {
        amount
      }

      audit_down: transaction(
        where: {
          type: { _eq: "down" }
        }
      ) {
        amount
      }
    }
  `;

  const data = await graphqlRequest(query);

  if (!data || !data.user || !data.user.length) {
    container.innerHTML = `<p class="muted">Unable to load user info.</p>`;
    return;
  }

  const user = data.user[0];

  /* ---------- CALCULATE AUDIT TOTALS ---------- */
  const auditUp = (data.audit_up || []).reduce((s, a) => s + a.amount, 0);
  const auditDown = (data.audit_down || []).reduce((s, a) => s + a.amount, 0);

  /* ---------- PLATFORM-CORRECT ROUNDING ---------- */
  const rawRatio = auditDown > 0 ? auditUp / auditDown : Infinity;
  const auditRatio =
    rawRatio === Infinity
      ? "∞"
      : (Math.round(rawRatio * 10) / 10).toFixed(1);

  /* ---------- USER DISPLAY NAME ---------- */
  const firstName = user.attrs?.firstName;
  const lastName = user.attrs?.lastName;

  const displayName =
    firstName || lastName
      ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
      : user.login;

  /* ---------- RENDER ---------- */
  container.innerHTML = `
    <section class="hero-card">
      <h2 class="hero-title">
        Welcome to your dashboard, <span>${displayName}</span>
      </h2>

      <div class="hero-stats">
        <div class="stat-item">
          <label>User</label>
          <span>${user.login}</span>
        </div>

        <div class="stat-item">
          <label>ID</label>
          <span>${user.id}</span>
        </div>

        <div class="stat-item">
          <label>Audit Ratio</label>
          <span>${auditRatio}</span>
        </div>
      </div>
    </section>
  `;
}
