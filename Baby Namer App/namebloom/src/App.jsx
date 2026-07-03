import { useEffect, useState, useCallback } from "react";
import { store, DEMO } from "./lib/api.js";
import { loadNames } from "./lib/names.js";
import Auth from "./screens/Auth.jsx";
import Partner from "./screens/Partner.jsx";
import Projects from "./screens/Projects.jsx";
import ProjectSetup from "./screens/ProjectSetup.jsx";
import Swiping from "./screens/Swiping.jsx";
import Matches from "./screens/Matches.jsx";
import DemoSwitcher from "./components/DemoSwitcher.jsx";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [data, setData] = useState(null);
  const [route, setRoute] = useState("projects");
  const [activeProjectId, setActiveProjectId] = useState(null);

  const refreshUser = useCallback(async () => {
    const u = await store.getCurrentUser();
    setUser(u || null);
  }, []);

  useEffect(() => {
    loadNames().then(setData).catch((e) => console.error(e));
    refreshUser();
    const off = store.onChange(refreshUser);
    return off;
  }, [refreshUser]);

  // Route guards
  useEffect(() => {
    if (user === undefined) return;
    if (!user) setRoute("auth");
    else if (route === "auth") setRoute("projects");
  }, [user]); // eslint-disable-line

  const go = (r, projectId = activeProjectId) => {
    setActiveProjectId(projectId);
    setRoute(r);
  };

  if (user === undefined || !data) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="brand"><span className="mark">Name<em>Bloom</em></span></div>
        <p className="muted" style={{ marginTop: 10 }}>Warming up…</p>
      </div>
    );
  }

  return (
    <div className={`app-shell app-shell--${route}`}>
      <Header
        user={user}
        route={route}
        onHome={() => go("projects")}
        onSignOut={async () => { await store.signOut(); }}
      />

      <main style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {route === "auth" && <Auth onDone={refreshUser} />}
        {route === "partner" && <Partner user={user} onDone={() => { refreshUser(); go("projects"); }} />}
        {route === "projects" && (
          <Projects
            user={user}
            data={data}
            onOpen={(id) => go("swipe", id)}
            onNew={() => go("setup", null)}
            onNeedPartner={() => go("partner")}
          />
        )}
        {route === "setup" && (
          <ProjectSetup
            data={data}
            projectId={activeProjectId}
            onCreated={(id) => go("swipe", id)}
            onCancel={() => go("projects")}
          />
        )}
        {route === "swipe" && (
          <Swiping
            data={data}
            user={user}
            projectId={activeProjectId}
            onMatches={() => go("matches")}
            onSettings={() => go("setup", activeProjectId)}
          />
        )}
        {route === "matches" && (
          <Matches
            data={data}
            user={user}
            projectId={activeProjectId}
            onBack={() => go("swipe")}
          />
        )}
      </main>

      {DEMO && user && <DemoSwitcher />}
    </div>
  );
}

function Header({ user, route, onHome, onSignOut }) {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <button className="brand" onClick={onHome} aria-label="Home">
        <span className="mark">Name<em>Bloom</em></span>
      </button>
      {user && route !== "auth" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
          <button className="chip" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </header>
  );
}
