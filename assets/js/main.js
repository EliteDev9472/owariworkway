/* Owari Work Way (OWW) — site behaviour */
(function () {
  "use strict";

  /* Header: add a border once the page scrolls */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile navigation */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 920) setOpen(false);
    });
  }

  /* Highlight the menu item for the section being read */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var navTargets = navLinks.map(function (a) {
    return document.getElementById(a.getAttribute("href").slice(1));
  });
  var spyQueued = false;
  var updateActive = function () {
    spyQueued = false;
    var line = window.innerHeight * 0.35;
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    var current = -1;
    navTargets.forEach(function (target, i) {
      if (target && target.getBoundingClientRect().top <= line) current = i;
    });
    if (atBottom) current = navTargets.length - 1;
    navLinks.forEach(function (a, i) {
      var on = i === current;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };
  var queueActive = function () {
    if (!spyQueued) {
      spyQueued = true;
      window.requestAnimationFrame(updateActive);
    }
  };
  if (navLinks.length) {
    updateActive();
    window.addEventListener("scroll", queueActive, { passive: true });
    window.addEventListener("resize", queueActive);
  }

  /* Reveal sections as they scroll into view */
  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 }
    );
    revealed.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealed.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Booking calendar: load Calendly only when the visitor scrolls near it */
  var calendly = document.getElementById("calendly-embed");
  if (calendly) {
    var calendlyStatus = document.getElementById("calendly-status");
    var calendlyRequested = false;
    var calendlyFailed = function () {
      if (calendlyStatus) {
        calendlyStatus.textContent = "The calendar couldn’t load here. Use the Calendly link below to book.";
      }
    };
    var loadCalendly = function () {
      if (calendlyRequested) return;
      calendlyRequested = true;
      var script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = function () {
        if (!window.Calendly || !window.Calendly.initInlineWidget) {
          calendlyFailed();
          return;
        }
        window.Calendly.initInlineWidget({
          url: calendly.getAttribute("data-url"),
          parentElement: calendly
        });
      };
      script.onerror = calendlyFailed;
      document.head.appendChild(script);
    };

    // Calendly reports its content height; grow the frame to fit so there is no inner scrollbar.
    // While loading it briefly reports tiny heights (26px, 2px), which are ignored so the page doesn't jump.
    window.addEventListener("message", function (e) {
      if (e.origin !== "https://calendly.com" || !e.data || typeof e.data.event !== "string") return;
      if (e.data.event === "calendly.page_height") {
        var h = parseInt(e.data.payload && e.data.payload.height, 10);
        if (h >= 400) calendly.style.height = h + "px";
      } else if (e.data.event.indexOf("calendly.") === 0) {
        calendly.classList.add("is-loaded");
      }
    });

    if ("IntersectionObserver" in window) {
      var calendlyIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          calendlyIO.disconnect();
          loadCalendly();
        }
      }, { rootMargin: "600px 0px" });
      calendlyIO.observe(calendly);
    } else {
      loadCalendly();
    }
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
