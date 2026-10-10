/* builds.js: Builds hub renderer (redesign thread 4, Oct 2026).
   Same layout as before: one compact card per row (thumbnail + copy) and a
   How it works walkthrough inside the card. Look comes from main shared.css
   (ds- labels and buttons) and builds.css (b- classes).
   Reads data/site.json, hero.json, projects.json, page.json.
   Every card field except id, title and status is optional: a card with no
   picture, metric, links or body still renders. Only status "live" shows.
   Card element ids are card-<id> (Home's Deep dive links to #card-<id>).
   page.json: nowCard.hidden hides the side card, showPrototyping shows the
   prototyping line. Needs site.js first (loadJSON, applyOrgChrome,
   renderOrgPage, mountSectionMedia, setText). No build step. */
(function () {
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const has = (v) => v != null && String(v).trim() !== "";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSvg = (s) => /\.svg(\?|#|$)/i.test(s || "");
  const STEPS = [["The problem", "problem"], ["The approach", "approach"], ["My call", "hers"], ["The result", "result"], ["The lesson", "lesson"]];

  /* ---------- lightbox ---------- */
  function lightbox(src, alt) {
    const lb = mk("div", "b-lightbox");
    lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", alt || "Image");
    const img = document.createElement("img"); img.src = src; img.alt = alt || "";
    lb.appendChild(img);
    if (alt) lb.appendChild(mk("p", "b-lb-cap", alt));
    const close = () => { lb.remove(); document.removeEventListener("keydown", onKey, true); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    lb.addEventListener("click", close); document.addEventListener("keydown", onKey, true);
    document.body.appendChild(lb);
  }

  function linkRow(links, cls, darkDemo) {
    const row = mk("div", cls || "b-links");
    (links || []).filter((l) => l && l.url).forEach((l) => {
      const demo = l.kind === "demo" || l.kind === "video";
      const a = mk("a", "ds-btn " + (demo && darkDemo ? "ds-btn-dark" : "ds-btn-line"), (l.label || "Link") + (demo ? " ↗" : " →"));
      a.href = l.url; a.target = "_blank"; a.rel = "noopener";
      row.appendChild(a);
    });
    return row;
  }

  function imgNode(src, alt, cls) {
    const im = document.createElement("img");
    im.src = src; im.alt = alt || ""; im.loading = "lazy";
    im.className = (cls || "") + (isSvg(src) ? " svg" : "");
    return im;
  }

  /* ---------- one build ---------- */
  function cardNode(p, ctl) {
    const body = p.body || {};
    const steps = STEPS.filter(([, k]) => has(body[k]));
    const card = mk("article", "b-card"); card.id = "card-" + p.id;

    const head = mk("div", "b-head");
    if (p.visual) {
      const th = mk("button", "b-thumb"); th.type = "button";
      th.setAttribute("aria-label", "Enlarge: " + (p.visualAlt || p.title || "picture"));
      th.appendChild(imgNode(p.visual, p.visualAlt || p.title));
      th.addEventListener("click", () => lightbox(p.visual, p.visualAlt || p.title));
      head.appendChild(th);
    } else head.classList.add("no-thumb");

    const copy = mk("div", "b-copy");
    if (has(p.metric)) copy.appendChild(mk("span", "ds-label", p.metric));
    copy.appendChild(mk("h3", "b-title", p.title || ""));
    if (has(p.hook)) copy.appendChild(mk("p", "b-hook", p.hook));
    if (p.tools && p.tools.length) { const t = mk("div", "b-chips"); p.tools.forEach((x) => t.appendChild(mk("span", "b-chip", x))); copy.appendChild(t); }
    const foot = mk("div", "b-foot");
    const links = linkRow(p.links);
    if (links.children.length) foot.appendChild(links);
    let btn = null;
    if (steps.length) {
      btn = mk("button", "ds-btn ds-btn-dark b-btn"); btn.type = "button";
      btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "walk-" + p.id);
      btn.appendChild(mk("span", "", "How it works")); btn.appendChild(mk("i", "", "+"));
      btn.addEventListener("click", () => ctl.toggle(card));
      foot.appendChild(btn);
    }
    if (foot.children.length) copy.appendChild(foot);
    head.appendChild(copy);
    card.appendChild(head);
    if (!steps.length) return card;

    // walkthrough: built on first open
    const walk = mk("div", "b-walk"); walk.id = "walk-" + p.id; walk.hidden = true;
    let built = false, step = 0, vis, dia, cap, counter, h, txt, endLinks, dots, back, next;
    function build() {
      if (built) return; built = true;
      if (p.visual || p.diagram) {
        const media = mk("button", "b-media"); media.type = "button";
        if (p.visual) { vis = imgNode(p.visual, p.visualAlt || p.title, "b-vis"); media.appendChild(vis); }
        if (p.diagram) { dia = imgNode(p.diagram, p.diagramAlt || p.title + " diagram", "b-dia"); media.appendChild(dia); }
        media.appendChild(mk("span", "b-zoom", "Enlarge"));
        media.addEventListener("click", () => { const cur = dia && (dia.classList.contains("on") || !vis) ? dia : vis; if (cur) lightbox(cur.src, cur.alt); });
        const fig = mk("div", "b-fig"); fig.appendChild(media); cap = mk("p", "b-cap"); fig.appendChild(cap); walk.appendChild(fig);
      } else walk.classList.add("no-media");

      const panel = mk("div", "b-panel");
      const top = mk("div", "b-ptop");
      counter = mk("span", "ds-label"); top.appendChild(counter);
      const x = mk("button", "b-x"); x.type = "button"; x.setAttribute("aria-label", "Close");
      x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
      x.addEventListener("click", () => ctl.toggle(card)); top.appendChild(x);
      panel.appendChild(top);
      h = mk("h4", "b-step-h"); txt = mk("p", "b-step-t");
      panel.appendChild(h); panel.appendChild(txt);
      endLinks = linkRow(p.links, "b-links b-end", true);
      if (endLinks.children.length) panel.appendChild(endLinks);
      const nav = mk("div", "b-nav");
      back = mk("button", "b-back", "← Back"); back.type = "button"; back.addEventListener("click", () => go(step - 1));
      dots = mk("div", "b-dots");
      steps.forEach(([k], j) => { const d = mk("button", "b-dot"); d.type = "button"; d.setAttribute("aria-label", k); d.addEventListener("click", () => go(j)); dots.appendChild(d); });
      next = mk("button", "ds-btn ds-btn-dark"); next.type = "button";
      next.addEventListener("click", () => (step === steps.length - 1 ? ctl.toggle(card) : go(step + 1)));
      nav.appendChild(back); nav.appendChild(dots); nav.appendChild(next);
      panel.appendChild(nav);
      panel.setAttribute("aria-live", "polite");
      walk.appendChild(panel);
    }
    function go(n) {
      step = Math.max(0, Math.min(steps.length - 1, n));
      const [k, f] = steps[step], last = step === steps.length - 1;
      counter.textContent = "Step " + (step + 1) + " of " + steps.length;
      h.textContent = k; txt.textContent = body[f];
      endLinks.hidden = !last;
      back.disabled = step === 0;
      next.textContent = last ? "Done" : "Next →";
      [...dots.children].forEach((d, j) => { d.classList.toggle("on", j === step); if (j === step) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current"); });
      const showDia = !!dia && (step >= 1 || !vis);
      if (dia) dia.classList.toggle("on", showDia);
      if (vis) vis.classList.toggle("off", showDia);
      if (cap) cap.textContent = showDia ? (p.diagramAlt || "") : (p.visualAlt || "");
      txt.classList.remove("b-in"); void txt.offsetWidth; if (!reduce) txt.classList.add("b-in");
    }
    card.appendChild(walk);

    card._set = (open) => {
      card.classList.toggle("open", open);
      walk.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.querySelector("span").textContent = open ? "Close" : "How it works";
      if (open) { build(); go(0); }
    };
    card._step = (d) => go(step + d);
    return card;
  }

  /* ---------- page ---------- */
  Promise.all([loadJSON("data/site.json"), loadJSON("data/hero.json"), loadJSON("data/projects.json"), loadJSON("data/page.json").catch(() => null)])
    .then(([site, hero, data, page]) => {
      applyOrgChrome(site);
      renderOrgPage(site, page);
      document.querySelectorAll("#hero-ctas a").forEach((a, i) => { a.className = "ds-btn " + (i === 0 ? "ds-btn-dark" : "ds-btn-line"); });
      const side = document.querySelector(".hero-side");
      const sideOff = !!(page && page.nowCard && page.nowCard.hidden);
      if (side) side.hidden = sideOff;
      const grid0 = document.querySelector(".hero-grid");
      if (grid0) grid0.classList.toggle("no-side", sideOff);
      setText("proto-label", page && page.prototypingLabel);
      mountSectionMedia("top", hero);
      setText("hero-eyebrow", hero.eyebrow); setText("hero-headline", hero.headline); setText("hero-lede", hero.lede);

      const live = (data.projects || []).filter((p) => p && p.id && p.status === "live");

      let openCard = null;
      const ctl = {
        toggle(card) {
          if (openCard && openCard !== card) openCard._set(false);
          const willOpen = openCard !== card;
          card._set(willOpen); openCard = willOpen ? card : null;
          if (willOpen) {
            const top = card.getBoundingClientRect().top;
            if (top < 80 || top > window.innerHeight * 0.6) window.scrollTo({ top: top + window.scrollY - 90, behavior: reduce ? "auto" : "smooth" });
          }
        },
      };
      document.addEventListener("keydown", (e) => {
        if (!openCard || document.querySelector(".b-lightbox")) return;
        if (e.target.closest && e.target.closest("input, textarea, select, [role=dialog]")) return;
        if (e.key === "Escape") ctl.toggle(openCard);
        else if (e.key === "ArrowRight") { e.preventDefault(); openCard._step(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); openCard._step(-1); }
      });

      const grid = $("builds-grid");
      if (grid) {
        grid.innerHTML = ""; grid.className = "b-list";
        live.forEach((p) => grid.appendChild(cardNode(p, ctl)));
      }
      const proto = $("proto-line");
      if (proto) {
        const on = !!(page && page.showPrototyping) && has(data.prototyping);
        proto.style.display = on ? "" : "none";
        if (on) setText("proto-text", data.prototyping);
      }

      // a link to #card-… (Home's Deep dive) or the old #build-… scrolls to that card
      const m = /^#(?:card|build)-(.+)$/.exec(location.hash);
      if (m) { const c = document.getElementById("card-" + m[1]); if (c) setTimeout(() => c.scrollIntoView({ block: "center" }), 60); }

      // section order, hidden sections, looks and builder-added sections (admin page builder)
      if (window.Theme && Theme.applyLayout && page && page.layout) Theme.applyLayout(document.querySelector("main"), { hero: hero, projects: data, page: page || {} }, { site: site, layoutIn: "page" });
    })
    .catch(() => { setText("hero-headline", "Content couldn't load. Try refreshing."); });
})();
