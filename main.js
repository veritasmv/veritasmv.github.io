(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");

  /* Шапка: тінь при прокручуванні */
  var header = doc.querySelector(".site-header");
  var mbar = doc.querySelector(".mbar");
  function onScroll() { header && header.classList.toggle("scrolled", window.scrollY > 8); mbar && mbar.classList.toggle("show", window.scrollY > 520); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Мобільне меню */
  var burger = doc.querySelector(".burger");
  function setMenu(open) {
    doc.body.classList.toggle("menu-open", open);
    burger && burger.setAttribute("aria-expanded", open ? "true" : "false");
    doc.body.style.overflow = open ? "hidden" : "";
  }
  burger && burger.addEventListener("click", function () { setMenu(!doc.body.classList.contains("menu-open")); });
  doc.querySelectorAll(".mobile-menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1040) setMenu(false); });

  /* Поява блоків при прокручуванні */
  var items = doc.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add("in"); }); }

  /* Рік у підвалі */
  doc.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Фільтр кейсів */
  var filters = doc.querySelectorAll(".filter");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("on"); });
      btn.classList.add("on");
      var f = btn.getAttribute("data-f");
      doc.querySelectorAll(".case").forEach(function (c) {
        c.classList.toggle("hide", f !== "all" && c.getAttribute("data-cat") !== f);
      });
    });
  });

  /* Попередній вибір сфери з ?area=... */
  var area = new URLSearchParams(location.search).get("area");
  if (area) doc.querySelectorAll('select[name="area"]').forEach(function (s) {
    Array.prototype.forEach.call(s.options, function (o) { if (o.value === area) s.value = area; });
  });

  /* Форми заявок */
  var cfg = window.VMV_CONFIG || {};
  doc.querySelectorAll("form[data-lead]").forEach(function (form) {
    var phone = form.querySelector('input[name="phone"]');
    if (phone) phone.addEventListener("input", function () { phone.value = phone.value.replace(/[^\d+()\-\s]/g, ""); });

    function setErr(input, bad) { var f = input.closest(".field") || input.closest(".check"); f && f.classList.toggle("err", bad); }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      form.classList.remove("failed");
      var ok = true;
      var name = form.querySelector('[name="name"]'), ph = form.querySelector('[name="phone"]'), consent = form.querySelector('[name="consent"]'), mail = form.querySelector('[name="email"]');
      var nameBad = !name.value.trim() || name.value.trim().length < 2; setErr(name, nameBad); ok = ok && !nameBad;
      var digits = ph.value.replace(/\D/g, ""); var phBad = digits.length < 9; setErr(ph, phBad); ok = ok && !phBad;
      if (mail) { var mBad = mail.value.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim()); setErr(mail, mBad); ok = ok && !mBad; }
      if (consent) { setErr(consent, !consent.checked); ok = ok && consent.checked; }
      if (!ok) { var first = form.querySelector(".err input, .err select"); first && first.focus(); return; }

      var hp = form.querySelector('[name="website"]'); if (hp && hp.value) return; /* антиспам */

      var data = {}; new FormData(form).forEach(function (v, k) { if (k !== "website") data[k] = v; });
      data.page = location.href; data.sent_at = new Date().toISOString();
      var btn = form.querySelector('button[type="submit"]'); var label = btn.innerHTML; btn.disabled = true; btn.textContent = "Надсилаємо…";

      function done(demo) {
        btn.disabled = false; btn.innerHTML = label;
        form.classList.add("sent");
        var s = form.querySelector(".demo-note"); if (s) s.style.display = demo ? "block" : "none";
        var okBox = form.querySelector(".form-ok"); okBox && okBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      function fail() { btn.disabled = false; btn.innerHTML = label; form.classList.add("failed"); }

      if (!cfg.formEndpoint) { setTimeout(function () { done(true); }, 700); return; }
      if (cfg.web3formsKey) data.access_key = cfg.web3formsKey;
      fetch(cfg.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(false); })
        .catch(fail);
    });
    form.querySelectorAll("input,select,textarea").forEach(function (i) {
      i.addEventListener("input", function () { setErr(i, false); });
      i.addEventListener("change", function () { setErr(i, false); });
    });
  });
})();
