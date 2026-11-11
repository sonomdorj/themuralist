/* The Muralist — scroll motion, loops, index. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body;
  var RM = root.classList.contains('rm');
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function clamp(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  var hasIO = 'IntersectionObserver' in window;

  /* Poster: show a marked slot if the file is not in place yet */
  var posterFig = $('#poster'), posterImg = posterFig && $('img', posterFig);
  function posterMissing() { posterFig.classList.add('missing'); }
  if (posterImg) {
    if (posterImg.complete && !posterImg.naturalWidth) posterMissing();
    else posterImg.addEventListener('error', posterMissing);
  }

  /* Index (nav) */
  var chipBtn = $('#indexBtn'), index = $('#index'), closeBtn = $('#indexClose'), where = $('#where');
  $$('.index-list li').forEach(function (li, i) { li.style.setProperty('--i', i); });
  function openIndex() {
    index.hidden = false;
    chipBtn.setAttribute('aria-expanded', 'true');
    root.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { index.classList.add('open'); }); });
    closeBtn.focus();
  }
  function closeIndex(refocus) {
    index.classList.remove('open');
    index.hidden = true;
    chipBtn.setAttribute('aria-expanded', 'false');
    root.style.overflow = '';
    if (refocus) chipBtn.focus();
  }
  chipBtn.addEventListener('click', openIndex);
  closeBtn.addEventListener('click', function () { closeIndex(true); });
  $$('a', index).forEach(function (a) { a.addEventListener('click', function () { closeIndex(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !index.hidden) closeIndex(true); });

  /* Type that builds: split into words (skipped when motion is reduced) */
  var builds = [];
  if (!RM) {
    $$('[data-build]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      var spans = words.map(function (w, i) {
        var s = d.createElement('span');
        s.className = 'w';
        s.textContent = w;
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(d.createTextNode(' '));
        return s;
      });
      builds.push({ el: el, spans: spans, k: -1 });
    });
  }

  /* Sequenced reveals */
  var reveals = $$('[data-reveal]');
  reveals.forEach(function (el) {
    var sibs = $$(':scope > [data-reveal]', el.parentNode);
    el.style.setProperty('--d', Math.min(Math.max(sibs.indexOf(el), 0), 5) % 3);
  });
  var spots = $$('[data-spot]');
  if (RM || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('in'); });
    spots.forEach(function (el) { el.classList.add('on'); });
  } else {
    var revIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { revIO.observe(el); });
    var spotIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); spotIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -36% 0px', threshold: 0 });
    spots.forEach(function (el) { spotIO.observe(el); });
  }

  /* The light changes as the page moves: wall by day, night for the screen */
  if (hasIO) {
    var themeIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        body.setAttribute('data-theme', e.target.getAttribute('data-theme'));
        var n = e.target.getAttribute('data-name');
        where.textContent = n && n !== 'Film' ? '— ' + n : '';
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    $$('main [data-theme]').forEach(function (el) { themeIO.observe(el); });
  }

  /* Loops: autoplay muted; paused when out of view. With reduced motion the poster still stays. */
  var heroVideo = $('#heroVideo');
  function play(v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if (RM) $$('video.loop').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  if (!RM && hasIO) {
    var loopIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio >= 0.2) play(v);
        else if (!v.paused) v.pause();
      });
    }, { threshold: [0, 0.2, 0.6] });
    $$('video.loop').forEach(function (v) { if (v !== heroVideo) loopIO.observe(v); });
  }

  /* Scroll-driven passages */
  var hero = $('.hero'), heroPin = $('.hero-pin'), strip = $('#strip'), track = $('#stripTrack');
  var vh = window.innerHeight, overflow = 0, pinned = false, ticking = false, heroPlaying = true;
  var mq = window.matchMedia('(min-width: 900px) and (min-height: 560px)');

  function measure() {
    vh = window.innerHeight;
    pinned = !RM && mq.matches;
    if (pinned) {
      track.style.setProperty('--tx', '0px');
      overflow = Math.max(0, track.offsetWidth - root.clientWidth);
      strip.style.setProperty('--strip-h', (vh + overflow) + 'px');
    } else {
      strip.style.removeProperty('--strip-h');
      track.style.removeProperty('--tx');
    }
    update();
  }

  function update() {
    ticking = false;
    var r;
    if (!RM) {
      r = hero.getBoundingClientRect();
      var total = Math.max(1, r.height - vh);
      var e = smooth(clamp((-r.top / total) / 0.72));
      heroPin.style.setProperty('--e', e.toFixed(4));
      var want = e > 0.06 && r.bottom > 0;
      if (want && !heroPlaying) { play(heroVideo); heroPlaying = true; }
      else if (!want && heroPlaying) { heroVideo.pause(); heroPlaying = false; }
    }
    if (pinned) {
      r = strip.getBoundingClientRect();
      var p = clamp(-r.top / Math.max(1, r.height - vh));
      track.style.setProperty('--tx', (-p * overflow).toFixed(1) + 'px');
    }
    for (var i = 0; i < builds.length; i++) {
      var b = builds[i];
      r = b.el.getBoundingClientRect();
      if (r.top > vh) continue;
      var bp = clamp((vh * 0.9 - r.top) / (vh * 0.5 + r.height * 0.7));
      var k = Math.round(bp * b.spans.length * 1.04);
      if (k === b.k) continue;
      b.k = k;
      for (var j = 0; j < b.spans.length; j++) b.spans[j].classList.toggle('on', j < k);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (mq.addEventListener) mq.addEventListener('change', measure);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(measure);
  measure();
})();
