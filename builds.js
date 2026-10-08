/* builds.js: Builds hub renderer.
   Reads data/site.json, hero.json, projects.json, page.json. Every new field is optional,
   so old JSON still renders. Needs site.js first (loadJSON, applyOrgChrome, renderOrgPage,
   mountSectionMedia, setText). No server, no build step. */
(function () {
  const $ = (id) => document.getElementById(id);
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
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

  function linkRow(links, cls) {
    const row = mk("div", cls || "b-links");
    (links || []).filter((l) => l && l.url).forEach((l) => {
      const demo = l.kind === "demo";
      const a = mk("a", "b-link" + (demo ? " demo" : ""), (l.label || "Link") + (demo ? " ↗" : " →"));
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
  function cardNode(p, i, ctl) {
    const body = p.body || {};
    const steps = STEPS.filter(([, k]) => body[k]);
    const card = mk("article", "b-card" + (i % 2 ? " flip" : "")); card.id = "build-" + p.id;
    const num = String(i + 1).padStart(2, "0");

    // compact head: small thumbnail + copy
    const head = mk("div", "b-head");
    if (p.visual) {
      const th = mk("button", "b-thumb"); th.type = "button";
      th.setAttribute("aria-label", "Enlarge: " + (p.visualAlt || p.title));
      th.appendChild(imgNode(p.visual, p.visualAlt || p.title));
      th.appendChild(mk("span", "b-num", num));
      th.addEventListener("click", () => lightbox(p.visual, p.visualAlt || p.title));
      head.appendChild(th);
    } else head.classList.add("no-thumb");

    const copy = mk("div", "b-copy");
    const meta = mk("div", "b-meta");
    meta.appendChild(mk("span", "", p.metric || ""));
    meta.appendChild(mk("span", "b-badge", p.status === "live" ? "Live" : "Building"));
    copy.appendChild(meta);
    copy.appendChild(mk("h3", "b-title", p.title || ""));
    if (p.hook) copy.appendChild(mk("p", "b-hook", p.hook));
    if (p.tools && p.tools.length) { const t = mk("div", "b-chips"); p.tools.forEach((x) => t.appendChild(mk("span", "b-chip", x))); copy.appendChild(t); }
    const foot = mk("div", "b-foot");
    foot.appendChild(linkRow(p.links));
    let btn = null;
    if (steps.length) {
      btn = mk("button", "b-btn"); btn.type = "button";
      btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "walk-" + p.id);
      btn.innerHTML = "<span>How it works</span><i>+</i>";
      btn.addEventListener("click", () => ctl.toggle(card));
      foot.appendChild(btn);
    }
    copy.appendChild(foot);
    head.appendChild(copy);
    card.appendChild(head);
    if (!steps.length) return card;

    // walkthrough: built on first open
    const walk = mk("div", "b-walk"); walk.id = "walk-" + p.id;
    let built = false, step = 0, media, vis, dia, cap, counter, h, txt, endLinks, dots, back, next;
    function build() {
      if (built) return; built = true;
      media = mk("button", "b-media"); media.type = "button";
      if (p.visual) { vis = imgNode(p.visual, p.visualAlt || p.title, "b-vis"); media.appendChild(vis); }
      if (p.diagram) { dia = imgNode(p.diagram, p.diagramAlt || p.title + " diagram", "b-dia"); media.appendChild(dia); }
      media.appendChild(mk("span", "b-zoom", "Enlarge ⤢"));
      media.addEventListener("click", () => { const cur = dia && dia.classList.contains("on") ? dia : vis; if (cur) lightbox(cur.src, cur.alt); });
      const fig = mk("div", "b-fig"); if (p.visual || p.diagram) { fig.appendChild(media); cap = mk("p", "b-cap"); fig.appendChild(cap); walk.appendChild(fig); }
      else walk.classList.add("no-media");

      const panel = mk("div", "b-panel");
      const top = mk("div", "b-ptop");
      counter = mk("span", "b-mono"); top.appendChild(counter);
      const x = mk("button", "b-x", "+"); x.type = "button"; x.setAttribute("aria-label", "Close");
      x.addEventListener("click", () => ctl.toggle(card)); top.appendChild(x);
      panel.appendChild(top);
      h = mk("h4", "b-step-h"); txt = mk("p", "b-step-t");
      panel.appendChild(h); panel.appendChild(txt);
      endLinks = linkRow(p.links, "b-links b-end"); panel.appendChild(endLinks);
      const nav = mk("div", "b-nav");
      back = mk("button", "b-back", "← Back"); back.type = "button"; back.addEventListener("click", () => go(step - 1));
      dots = mk("div", "b-dots");
      steps.forEach(([k], j) => { const d = mk("button", "b-dot"); d.type = "button"; d.setAttribute("aria-label", k); d.addEventListener("click", () => go(j)); dots.appendChild(d); });
      next = mk("button", "b-next"); next.type = "button"; next.addEventListener("click", () => (step === steps.length - 1 ? ctl.toggle(card) : go(step + 1)));
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
      [...dots.children].forEach((d, j) => d.classList.toggle("on", j === step));
      const showDia = !!dia && step >= 1;
      if (dia) dia.classList.toggle("on", showDia);
      if (vis) vis.classList.toggle("off", showDia);
      if (cap) cap.textContent = showDia ? (p.diagramAlt || "") : (p.visualAlt || "");
      txt.classList.remove("b-in"); void txt.offsetWidth; if (!reduce) txt.classList.add("b-in");
    }
    card.appendChild(walk);

    card._set = (open) => {
      card.classList.toggle("open", open);
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
      setText("proto-label", page && page.prototypingLabel);
      mountSectionMedia("top", hero);
      setText("hero-eyebrow", hero.eyebrow); setText("hero-headline", hero.headline); setText("hero-lede", hero.lede);

      const live = (data.projects || []).filter((p) => p.status === "live");

      // nav: one link per build + back link
      const navLinks = document.querySelector(".nav-links");
      if (navLinks && live.length) {
        const home = navLinks.querySelector('[data-nav="main"]');
        live.forEach((p) => { const a = mk("a", "b-navlink", String(p.title || "").replace(/^The /, "")); a.href = "#build-" + p.id; navLinks.insertBefore(a, home); });
      }

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
        if (e.target.closest && e.target.closest("input, textarea, select")) return;
        if (e.key === "Escape") ctl.toggle(openCard);
        else if (e.key === "ArrowRight") { e.preventDefault(); openCard._step(1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); openCard._step(-1); }
      });

      const grid = $("builds-grid");
      if (grid) {
        grid.innerHTML = ""; grid.className = "b-list";
        live.forEach((p, i) => grid.appendChild(cardNode(p, i, ctl)));
      }
      if (data.prototyping) {
        $("proto-line").style.display = "grid";
        setText("proto-text", data.prototyping);
      }
    })
    .catch(() => { setText("hero-headline", "Content couldn't load — try refreshing."); });
})();
