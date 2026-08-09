/* ============================================================
   YANGWANG U9 Xtreme — 交互 v3
   滚动叙事 · 进度系统 · 折叠目录 · tilt · 视差 · 灯箱
   ============================================================ */
(function () {
  "use strict";
  var doc = document, win = window;
  var reduced = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = win.matchMedia && win.matchMedia("(pointer:fine)").matches;
  function qs(s, c) { return (c || doc).querySelector(s); }
  function qsa(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  var scrollY = function () { return win.scrollY || doc.documentElement.scrollTop; };

  /* ============ 章节注册 ============ */
  var sections = qsa("section[data-num], section.hero");
  var nav = qs(".nav");
  var navBar = qs("#navBar");
  var sgBar = qs(".sg__bar");
  var sgNum = qs(".sg__num");
  var menuOverlay = qs("#menuOverlay");
  var menuBtn = qs("#menuBtn");
  var menuClose = qs("#menuClose");
  var heroContent = qs(".hero__content");

  /* ============ 滚动状态 ============ */
  function onScroll() {
    var y = scrollY();
    var ph = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) - win.innerHeight;
    var p = ph > 0 ? y / ph : 0;
    if (nav) nav.classList.toggle("scrolled", y > 60);
    if (navBar) navBar.style.width = (p * 100).toFixed(2) + "%";
    if (sgBar) sgBar.style.strokeDashoffset = (119.4 * (1 - p)).toFixed(1);
    if (sgNum) sgNum.textContent = String(Math.round(p * 100)).padStart(2, "0");

    /* 当前章节高亮 */
    var cur = 0;
    sections.forEach(function (s, i) {
      if (s.getBoundingClientRect().top <= win.innerHeight * 0.45) cur = i;
    });
    var curId = sections[cur] ? sections[cur].id : "";
    if (menuOverlay) qsa("a", menuOverlay).forEach(function (a) {
      a.classList.toggle("on", a.getAttribute("href") === "#" + curId);
    });
    var now = qs("#navNow");
    if (now) {
      var t = qs('.menu-overlay__nav a[href="#' + curId + '"]');
      if (t) {
        var idx = qs(".idx", t);
        var nm = idx ? t.textContent.replace(idx.textContent, "").trim() : t.textContent.trim();
        now.textContent = (idx ? idx.textContent + " · " : "") + nm;
        now.style.opacity = y > 60 ? "1" : "0";
      }
    }

    /* hero 渐隐 */
    if (heroContent) heroContent.classList.toggle("fade", y > 90);

    /* 视差 */
    parallax();
  }
  win.addEventListener("scroll", onScroll, { passive: true });

  /* ============ 视差（仅大图；视频保持静止如参考站） ============ */
  var pxImgs = qsa(".media-hero img");
  function parallax() {
    if (reduced || !pxImgs.length) return;
    var vh = win.innerHeight;
    pxImgs.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) return;
      var c = r.top + r.height / 2 - vh / 2;
      var off = Math.max(-30, Math.min(30, c * -0.1));
      el.style.transform = "translateY(" + off.toFixed(1) + "px)";
    });
  }
  if (reduced) { pxImgs.forEach(function (el) { el.style.transform = "none"; }); }

  /* ============ 目录点击 ============ */
  function bindScroll(a) {
    a.addEventListener("click", function (e) {
      var t = doc.getElementById(a.getAttribute("href").slice(1));
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        closeMenu();
      }
    });
  }
  if (menuOverlay) qsa("a", menuOverlay).forEach(bindScroll);
  if (menuBtn) menuBtn.addEventListener("click", function () {
    var open = menuOverlay.classList.toggle("open");
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  if (menuClose) menuClose.addEventListener("click", closeMenu);
  function closeMenu() {
    if (menuOverlay) menuOverlay.classList.remove("open");
    if (menuBtn) menuBtn.classList.remove("open");
  }
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ============ reveal ============ */
  var reveals = qsa(".reveal, .reveal-l, .reveal-r");
  if ("IntersectionObserver" in win) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add("in"); }); }

  /* ============ 数字滚动 ============ */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-to"));
    if (isNaN(target)) return;
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var dur = parseInt(el.getAttribute("data-dur") || "2000", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null;
    function fmt(v) { return prefix + v.toFixed(dec) + suffix; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = fmt(target * easeOut(p));
      if (p < 1) win.requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    win.requestAnimationFrame(step);
  }
  var counts = qsa(".count[data-to]");
  if ("IntersectionObserver" in win) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (!reduced) countUp(e.target);
          else e.target.textContent = (e.target.getAttribute("data-prefix") || "") + e.target.getAttribute("data-to") + (e.target.getAttribute("data-suffix") || "");
          co.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counts.forEach(function (el) { co.observe(el); });
  }

  /* ============ 秒表 ============ */
  var laps = qsa("[data-laptime]");
  function lapRun(el) {
    var target = parseFloat(el.getAttribute("data-laptime"));
    var mm = qs(".lap-mm", el), ss = qs(".lap-ss", el), ms = qs(".lap-ms", el);
    var start = null;
    function fmt(v) {
      var m = Math.floor(v / 60), s = Math.floor(v % 60), mi = Math.round((v - Math.floor(v)) * 1000) % 1000;
      if (mm) mm.textContent = String(m).padStart(2, "0");
      if (ss) ss.textContent = String(s).padStart(2, "0");
      if (ms) ms.textContent = String(mi).padStart(3, "0");
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 3200, 1);
      fmt(target * easeOut(p));
      if (p < 1) win.requestAnimationFrame(step); else fmt(target);
    }
    win.requestAnimationFrame(step);
  }
  if (laps.length && "IntersectionObserver" in win) {
    var lo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (!reduced) lapRun(e.target);
          lo.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    laps.forEach(function (el) { lo.observe(el); });
  }

  /* ============ tilt ============ */
  if (fine && !reduced) {
    qsa(".ps-grid figure, .tech-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ============ 灯箱 ============ */
  var lb = qs(".lightbox");
  if (lb) {
    var lbImg = qs(".lightbox img"), lbCap = qs(".lightbox .lb-cap");
    function closeLb() { lb.classList.remove("open"); }
    qs(".lb-close", lb).addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
    qsa("[data-lb]").forEach(function (el) {
      el.addEventListener("click", function () {
        lbImg.src = el.getAttribute("data-lb");
        if (lbCap) lbCap.textContent = el.getAttribute("data-cap") || "";
        lb.classList.add("open");
      });
    });
  }

  /* ============ 自定义光标（v3.2：rAF 节流 + transform 定位，消除逐帧 layout） ============ */
  var cursor = qs(".cursor");
  if (cursor && fine) {
    var curX = 0, curY = 0, curTick = false;
    var CUR_SMALL = 12, CUR_HOVER = 40; /* 与 CSS .cursor / .is-hover 尺寸一致 */
    function renderCursor() {
      curTick = false;
      var s = cursor.classList.contains("is-hover") ? CUR_HOVER : CUR_SMALL;
      /* translate3d 走合成器线程；减 s/2 承担原 CSS translate(-50%,-50%) 的居中 */
      cursor.style.transform = "translate3d(" + (curX - s / 2).toFixed(1) + "px," + (curY - s / 2).toFixed(1) + "px,0)";
    }
    doc.addEventListener("mousemove", function (e) {
      curX = e.clientX; curY = e.clientY;
      if (curTick) return;
      curTick = true;
      win.requestAnimationFrame(renderCursor);
    });
    doc.addEventListener("mouseover", function (e) {
      cursor.classList.toggle("is-hover", !!e.target.closest("a,button,.dcard,.gallery figure,[data-lb]"));
    });
  }

  /* ============ 视频背景：立即播放 + 进视口重试 ============ */
  var bgVideos = qsa("video[data-bg]");
  function tryPlay(v) {
    try {
      v.muted = true;
      v.defaultMuted = true;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } catch (err) {}
  }
  bgVideos.forEach(function (v) {
    v.addEventListener("loadeddata", function () { if (v.paused) tryPlay(v); });
    v.addEventListener("canplay", function () { if (v.paused) tryPlay(v); });
    tryPlay(v); /* 立即尝试（muted autoplay） */
  });
  if (bgVideos.length && "IntersectionObserver" in win) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.paused) tryPlay(v);
        } else {
          try { v.pause(); } catch (err) {}
        }
      });
    }, { threshold: 0.12 });
    bgVideos.forEach(function (v) { vo.observe(v); });
  }
  /* 滚动时兜底：若应播放却暂停则重试 */
  win.addEventListener("scroll", function () {
    bgVideos.forEach(function (v) {
      var r = v.getBoundingClientRect();
      if (r.bottom > 0 && r.top < win.innerHeight && v.paused) tryPlay(v);
    });
  }, { passive: true });

  /* ============ 初始 ============ */
  onScroll();
})();

/* ============================================================
   v3.1 增量（纯追加）：hero 滚动叙事 + 页内锚点平滑滚动
   ============================================================ */
(function () {
  "use strict";
  var doc = document, win = window;
  var reduced = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hero = doc.querySelector(".hero__content");
  var END = 0.9;   /* 视口高度 90% 处叙事结束（终态与 .fade 对齐） */
  var TY = 46;     /* 终态位移 = .fade 的 translateY(46px) */
  var SC = 0.97;   /* 终态缩放 = .fade 的 scale(.97) */

  function heroStory() {
    if (!hero) return;
    var y = win.scrollY || doc.documentElement.scrollTop;
    if (y > win.innerHeight) {
      /* 离开 hero：交还 class 控制（值一致，无跳变） */
      hero.style.transition = "";
      hero.style.opacity = "";
      hero.style.transform = "";
      return;
    }
    var p = Math.min(y / (win.innerHeight * END), 1);
    hero.style.transition = "none"; /* 每帧直接落值，避免过渡拖尾 */
    hero.style.opacity = String(1 - p);
    hero.style.transform = "translateY(" + (TY * p).toFixed(2) + "px) scale(" + (1 - (1 - SC) * p).toFixed(4) + ")";
  }

  if (hero && !reduced) {
    var ticking = false;
    win.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      win.requestAnimationFrame(function () { heroStory(); ticking = false; });
    }, { passive: true });
    heroStory();
  }

  /* 页内锚点平滑滚动（.nav__brand → #hero；menuOverlay 链接由既有逻辑处理） */
  doc.querySelectorAll('.nav__brand[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = doc.getElementById(a.getAttribute("href").slice(1));
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    });
  });
})();
