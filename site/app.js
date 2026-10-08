/* ReelBill site. Every animation here is the product doing its thing: reels swipe, the
   bubble counts, Billy grows and gets stamped. The page also bills *you* for scrolling it. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const RING = 264; // circumference of the r=42 progress ring
  const hasGsap = typeof gsap !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const setRing = (el, fraction) => { el.style.strokeDashoffset = String(RING * (1 - Math.min(1, fraction))); };
  const hop = (el, big = false) => {
    if (!hasGsap || reduce) return;
    gsap.fromTo(el, { scaleX: big ? 1.35 : 1.2, scaleY: big ? 1.35 : 0.86, y: -8 }, { scaleX: 1, scaleY: 1, y: 0, duration: 0.6, ease: "elastic.out(1, 0.45)" });
    if (big) gsap.fromTo(el, { rotation: -16 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1.2, 0.3)" });
  };

  /* ---------- 1 · Hero: stamped headline, a phone that never stops swiping ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch === " " ? " " : ch;
      s.setAttribute("aria-hidden", "true");
      el.appendChild(s);
    }
    return $$(".char", el);
  }
  const line1 = splitChars($(".line-1"));
  const line2 = splitChars($(".line-2"));

  const palettes = [
    ["#2c1222", "#ff4fa3", "#6b2b4b"], ["#12222c", "#3fb6ff", "#1f4a63"], ["#1e2c12", "#c6f432", "#3b5a12"],
    ["#2c2512", "#ffb547", "#5c4413"], ["#22122c", "#b47cff", "#45226b"], ["#2c1a12", "#ff7a45", "#62301a"],
  ];
  const reels = $("#heroReels");
  const REEL_COUNT = 24;
  for (let i = 0; i < REEL_COUNT; i++) {
    const [bg, a, b] = palettes[i % palettes.length];
    const r = document.createElement("div");
    r.className = "reel";
    r.style.background = bg;
    r.innerHTML =
      `<span class="blob" style="width:70%;aspect-ratio:1;left:${10 + (i * 17) % 30}%;top:${8 + (i * 13) % 26}%;background:${a};opacity:.55"></span>` +
      `<span class="blob" style="width:46%;aspect-ratio:1;left:${(i * 29) % 50}%;top:${44 + (i * 7) % 20}%;background:${b}"></span>` +
      `<span class="avatar" style="background:${a}"></span>` +
      `<span class="side"><b></b><b></b><b></b></span>` +
      `<span class="cap"><i></i><i></i><i></i></span>`;
    reels.appendChild(r);
  }
  const heroBubble = $("#heroBubble");
  const heroCount = $("#heroCount");
  const heroRing = $(".pb-ring", heroBubble);
  const heroSwipe = $("#heroSwipe");
  let heroN = 0;
  function heroTick() {
    // Each swipe moves the strip one reel; counts jump to keep the loop short and the bill
    // arriving within a few seconds.
    const step = heroN < 60 ? 13 : heroN < 90 ? 8 : 4;
    heroN = Math.min(104, heroN + step);
    const index = Math.floor(heroN / 5) % REEL_COUNT;
    if (hasGsap && !reduce) gsap.to(reels, { yPercent: -100 * index, duration: 0.55, ease: "power3.inOut" });
    else reels.style.transform = `translateY(${-100 * index}%)`;
    heroCount.textContent = heroN;
    heroSwipe.textContent = heroN;
    setRing(heroRing, heroN / 100);
    const over = heroN >= 100;
    heroBubble.classList.toggle("over", over);
    hop(heroBubble, over && step !== 0 && heroN - step < 100);
    if (heroN >= 104) {
      setTimeout(() => { heroN = 0; heroCount.textContent = 0; setRing(heroRing, 0); heroBubble.classList.remove("over"); }, 1800);
    }
  }
  if (!reduce) setInterval(heroTick, 1100); else { heroN = 42; heroCount.textContent = 42; setRing(heroRing, 0.42); }

  if (hasGsap && !reduce) {
    const intro = gsap.timeline({ defaults: { ease: "back.out(2.2)" } });
    intro
      .from(".nav", { y: -40, opacity: 0, duration: 0.5, ease: "power2.out" })
      .from(".eyebrow", { opacity: 0, y: 10, duration: 0.4 }, "<0.1")
      .from(line1, { yPercent: 120, rotation: () => gsap.utils.random(-25, 25), scale: 1.6, opacity: 0, duration: 0.7, stagger: 0.05 }, "<0.05")
      .from(line2, { y: 30, opacity: 0, duration: 0.5, stagger: 0.018 }, "-=0.35")
      .from(".hero-sub", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.3")
      .from(".hero-actions .btn", { y: 24, opacity: 0, scale: 0.8, stagger: 0.08 }, "-=0.3")
      .from(".phone", { y: 120, rotation: 12, opacity: 0, duration: 1, ease: "elastic.out(1, 0.6)" }, 0.2)
      .from(".hero-billy", { x: -200, rotation: -60, opacity: 0, duration: 0.9, ease: "back.out(1.6)" }, 0.6)
      .from(".sticker", { scale: 0, rotation: 40, duration: 0.6, stagger: 0.15, ease: "back.out(3)" }, 0.9);

    // The stage leans toward the pointer, and drifts apart as you scroll away.
    const stage = $(".hero-stage");
    window.addEventListener("pointermove", (e) => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      gsap.to(".phone", { x: x * 24, y: y * 18, rotation: -6 + x * 6, duration: 0.8, ease: "power2.out" });
      gsap.to(".hero-billy", { x: x * -36, y: y * -20, duration: 1, ease: "power2.out" });
      gsap.to(".sticker", { x: x * 40, y: y * 30, duration: 1.1, ease: "power2.out" });
    });
    gsap.to(stage, { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-title .line-1", { xPercent: -8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- 2 · Tickers: they speed up when you scroll fast ---------- */
  const tickerTweens = [];
  $$(".ticker-track").forEach((track, i) => {
    const text = track.dataset.text;
    track.textContent = text.repeat(8);
    if (!hasGsap || reduce) return;
    const dir = i % 2 ? 1 : -1;
    gsap.set(track, { xPercent: dir === 1 ? -50 : 0 });
    tickerTweens.push(gsap.to(track, { xPercent: dir === 1 ? 0 : -50, duration: 40, ease: "none", repeat: -1 }));
  });
  if (hasGsap && !reduce) {
    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = 1 + Math.min(6, Math.abs(self.getVelocity()) / 300);
        tickerTweens.forEach((t) => gsap.to(t, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1 }) }));
      },
    });
  }

  /* ---------- 3 · Billy: scroll drives the count, the receipt and his mood ---------- */
  // SVGs are inlined (not <img>) so Billy's printed text uses the page's Fredoka and his
  // TOTAL can be rewritten.
  const poses = $$(".pose");
  Promise.all($$("[data-svg]").map((el) => fetch(el.dataset.svg).then((r) => r.text()).then((svg) => {
    el.innerHTML = svg;
    if (el.dataset.total) $$(".billy-total", el).forEach((t) => (t.textContent = el.dataset.total));
  }).catch(() => {}))).then(setupBilly);

  function setupBilly() {
    const scene = $(".billy-scene");
    const count = $("#sceneCount");
    const tape = $("#tape");
    const steps = $$(".step");
    const totals = $$(".billy-poses .billy-total");
    const stamp = $('.pose-over g[transform^="rotate(-14"]');
    let mood = "chill";

    function render(p) {
      const n = Math.round(p * 104);
      count.textContent = n;
      totals.forEach((t) => (t.textContent = n));
      tape.style.height = `${Math.min(100, p * 105)}%`;
      const next = n >= 100 ? "over" : n >= 75 ? "sus" : "chill";
      const step = n >= 100 ? 3 : n >= 75 ? 2 : n >= 12 ? 1 : 0;
      steps.forEach((s, i) => s.classList.toggle("is-on", i === step));
      if (next !== mood) {
        mood = next;
        poses.forEach((el) => el.classList.toggle("is-on", el.classList.contains(`pose-${mood}`)));
        scene.classList.toggle("is-over", mood === "over");
        if (hasGsap && !reduce) {
          gsap.fromTo($(`.pose-${mood}`), { scaleX: 1.25, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" });
          if (mood === "over" && stamp) {
            gsap.fromTo(stamp, { scale: 2.6, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3)", delay: 0.1 });
            gsap.fromTo(".billy-pin", { x: -10 }, { x: 0, duration: 0.5, ease: "elastic.out(1.4, 0.2)", delay: 0.2 });
          }
        }
      }
    }
    render(0);
    if (hasGsap) {
      ScrollTrigger.create({ trigger: scene, start: "top top", end: "bottom bottom", scrub: true, onUpdate: (self) => render(self.progress) });
    }
  }

  /* ---------- 4 · A bubble you can drag; it snaps to the nearest side ---------- */
  (() => {
    const arena = $("#arena");
    const bubble = $("#dragBubble");
    const label = $("#dragCount");
    let n = 42, dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, lastX = 0, vx = 0;
    const pos = () => ({ x: bubble.offsetLeft + (hasGsap ? gsap.getProperty(bubble, "x") : 0), y: bubble.offsetTop + (hasGsap ? gsap.getProperty(bubble, "y") : 0) });
    bubble.addEventListener("pointerdown", (e) => {
      dragging = true;
      bubble.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      ox = hasGsap ? gsap.getProperty(bubble, "x") : 0;
      oy = hasGsap ? gsap.getProperty(bubble, "y") : 0;
      lastX = e.clientX;
      if (hasGsap) gsap.to(bubble, { scale: 1.12, duration: 0.25, ease: "back.out(3)" });
    });
    bubble.addEventListener("pointermove", (e) => {
      if (!dragging || !hasGsap) return;
      vx = e.clientX - lastX; lastX = e.clientX;
      const maxX = arena.clientWidth - bubble.offsetWidth - bubble.offsetLeft;
      const minX = -bubble.offsetLeft;
      const maxY = arena.clientHeight - bubble.offsetHeight - bubble.offsetTop;
      const minY = -bubble.offsetTop;
      gsap.set(bubble, {
        x: gsap.utils.clamp(minX, maxX, ox + e.clientX - sx),
        y: gsap.utils.clamp(minY, maxY, oy + e.clientY - sy),
        rotation: gsap.utils.clamp(-25, 25, vx * 1.5),
      });
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      if (!hasGsap) return;
      const p = pos();
      const left = p.x + bubble.offsetWidth / 2 < arena.clientWidth / 2;
      const targetX = (left ? 12 : arena.clientWidth - bubble.offsetWidth - 12) - bubble.offsetLeft;
      gsap.to(bubble, { x: targetX, rotation: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.5)" });
      n += 1;
      label.textContent = n;
    };
    bubble.addEventListener("pointerup", release);
    bubble.addEventListener("pointercancel", release);
  })();

  /* ---------- 5 · The feature receipt prints out as you scroll ---------- */
  const now = new Date();
  $("#receiptDate").textContent = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() + " · " +
    now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }).toUpperCase();
  if (hasGsap && !reduce) {
    const receipt = $("#featureReceipt");
    const slot = document.createElement("div");
    slot.className = "printer";
    slot.setAttribute("aria-hidden", "true");
    receipt.before(slot);
    gsap.fromTo(receipt, { clipPath: "inset(0 0 100% 0)", y: -40 }, {
      clipPath: "inset(0 0 0% 0)", y: 0, ease: "none",
      scrollTrigger: { trigger: ".receipt-section", start: "top 70%", end: "bottom 85%", scrub: 0.6 },
    });
    $$(".r-items li", receipt).forEach((li) => {
      gsap.from(li, { x: -14, opacity: 0, duration: 0.4, ease: "steps(4)", scrollTrigger: { trigger: li, start: "top 88%" } });
    });
  }

  /* ---------- 6 · Kick-out takeover ---------- */
  const kickNote = $("#kickNote");
  if (hasGsap && !reduce) {
    const kick = gsap.timeline({ paused: true });
    kick
      .fromTo(".kick-billy", { y: () => -window.innerHeight, rotation: -30 }, { y: 0, rotation: 0, duration: 1, ease: "bounce.out" })
      .from(".kick-title", { scale: 2.4, opacity: 0, duration: 0.45, ease: "back.out(2.5)" }, "-=0.2")
      .from(".kick-sub", { y: 20, opacity: 0, duration: 0.4 }, "-=0.1")
      .from(".kick-actions > *", { y: 30, opacity: 0, stagger: 0.1, duration: 0.5, ease: "back.out(2)" }, "-=0.2");
    ScrollTrigger.create({ trigger: ".kick", start: "top 55%", onEnter: () => kick.play(), onLeaveBack: () => kick.pause(0) });
  }
  $("#kickClose").addEventListener("click", (e) => {
    if (hasGsap) gsap.fromTo(e.currentTarget, { x: -14 }, { x: 0, duration: 0.6, ease: "elastic.out(1.6, 0.2)" });
    kickNote.textContent = "Nice try. Browsers won't let a page close your tab. Billy will settle for a download.";
  });
  $("#kickMore").addEventListener("click", () => {
    kickNote.textContent = "Fine. Five more. He's counting.";
    setTimeout(() => $("#friends").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }), 500);
  });

  /* ---------- 7 · A leaderboard that keeps reshuffling ---------- */
  const people = [
    { name: "Ananya", user: "ananya.k", week: 212, today: 31 },
    { name: "You", user: "you", week: 248, today: 40, me: true },
    { name: "Kabir", user: "kabirrr", week: 301, today: 52 },
    { name: "Meera", user: "meerascrolls", week: 356, today: 61 },
    { name: "Rohan", user: "rohan_77", week: 489, today: 94 },
  ];
  const board = $("#board");
  people.forEach((p) => {
    p.start = { week: p.week, today: p.today };
    const li = document.createElement("li");
    li.className = "board-row" + (p.me ? " me" : "");
    li.innerHTML = `<span class="board-rank"></span><span class="board-name">${p.name}<small>@${p.user}</small></span><span class="board-total"><b>${p.week}</b><small>${p.today} today</small></span>`;
    p.el = li;
    board.appendChild(li);
  });
  function layoutBoard(animate) {
    const before = new Map(people.map((p) => [p, p.el.getBoundingClientRect().top]));
    people.sort((a, b) => a.week - b.week).forEach((p, i) => {
      board.appendChild(p.el);
      $(".board-rank", p.el).textContent = i + 1;
      $(".board-total b", p.el).textContent = p.week;
      $(".board-total small", p.el).textContent = `${p.today} today`;
    });
    if (!animate || !hasGsap || reduce) return;
    people.forEach((p) => {
      const dy = before.get(p) - p.el.getBoundingClientRect().top;
      if (dy) gsap.fromTo(p.el, { y: dy }, { y: 0, duration: 0.8, ease: "elastic.out(1, 0.6)" });
    });
  }
  layoutBoard(false);
  if (!reduce) {
    setInterval(() => {
      // Everyone scrolls a bit; you scroll less (it's your ad, after all). New week: reset.
      if (people.some((p) => p.week > 700)) people.forEach((p) => Object.assign(p, p.start));
      people.forEach((p) => {
        const add = p.me ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 24);
        p.week += add;
        p.today += add;
      });
      layoutBoard(true);
    }, 2600);
  }

  /* ---------- 8 · Privacy numbers roll ---------- */
  $$(".roll").forEach((el) => {
    const to = Number(el.dataset.to);
    const from = Number(el.dataset.from || 0);
    if (!hasGsap || reduce) { el.textContent = to; return; }
    const obj = { v: from };
    gsap.to(obj, {
      v: to, duration: 1.6, ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(obj.v)),
      scrollTrigger: { trigger: el, start: "top 80%" },
    });
  });

  /* ---------- 9 · The page bills you: one reel per screenful ---------- */
  const meter = $("#meter");
  const meterCount = $("#meterCount");
  const meterRing = $(".meter-ring", meter);
  const billReels = $("#billReels");
  const billTime = $("#billTime");
  const billVerdict = $("#billVerdict");
  const started = Date.now();
  let reelsScrolled = 0, deepest = 0, tipped = false;
  const pageReels = () => Math.max(1, Math.floor((document.documentElement.scrollHeight - innerHeight) / (innerHeight * 0.9)));
  function onScroll() {
    if (scrollY <= deepest) return;
    deepest = scrollY;
    const n = Math.floor(deepest / (innerHeight * 0.9));
    if (n <= reelsScrolled) return;
    reelsScrolled = n;
    meterCount.textContent = n;
    billReels.textContent = n;
    const total = pageReels();
    setRing(meterRing, n / total);
    const over = n >= total;
    const crossed = over && !meter.classList.contains("over");
    meter.classList.toggle("over", over);
    hop(meter, crossed);
    if (!tipped) {
      tipped = true;
      meter.classList.add("tip");
      setTimeout(() => meter.classList.remove("tip"), 3200);
    }
    billVerdict.textContent = verdict(n, total);
  }
  function verdict(n, total) {
    if (n >= total) return "You read the whole thing. Respect. That's still scrolling, though.";
    if (n > total * 0.6) return "Nearly there. Billy's pen is hovering.";
    if (n > 3) return "A light snack of a scroll. Tiny bill.";
    return "Barely started. Billy's waiting.";
  }
  addEventListener("scroll", onScroll, { passive: true });
  setInterval(() => {
    const s = Math.floor((Date.now() - started) / 1000);
    billTime.textContent = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }, 1000);
  meter.addEventListener("click", () => $("#download").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

  /* ---------- Magnetic primary buttons ---------- */
  if (hasGsap && !reduce && matchMedia("(pointer: fine)").matches) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: "power2.out" });
      });
      btn.addEventListener("pointerleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" }));
    });
  }

  /* ---------- Sections rise in ---------- */
  if (hasGsap && !reduce) {
    $$(".section-title, .body, .board, .arena, .final .receipt").forEach((el) => {
      if (el.closest(".billy-pin")) return;
      gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  }
})();
