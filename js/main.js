(function () {
  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('primary-navigation');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Reusable "hover one, dim the siblings" group highlight ---------- */
  function initGroupHighlight(itemSelector) {
    var items = document.querySelectorAll(itemSelector);
    if (!items.length) return;
    items.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        items.forEach(function (other) {
          if (other !== item) other.classList.add('is-dimmed');
        });
      });
      item.addEventListener('mouseleave', function () {
        items.forEach(function (other) { other.classList.remove('is-dimmed'); });
      });
    });
  }
  initGroupHighlight('.capability-item');
  initGroupHighlight('.contact-card');

  /* ---------- Work spotlight: hovering a project dims the rest of the
     page and reveals its name next to the "Selected Work" eyebrow —
     basement.studio's "trusted by" hover treatment. ---------- */
  function initWorkSpotlight() {
    document.querySelectorAll('.work-spotlight-group').forEach(function (group) {
      var feature = group.querySelector('.work-feature');
      if (!feature) return;

      feature.addEventListener('mouseenter', function () {
        group.classList.add('is-work-active');
        document.querySelectorAll('main > section, .site-header, .site-footer, .marquee').forEach(function (el) {
          if (el !== group && !group.contains(el)) el.classList.add('is-dimmed');
        });
      });
      feature.addEventListener('mouseleave', function () {
        group.classList.remove('is-work-active');
        document.querySelectorAll('.is-dimmed').forEach(function (el) { el.classList.remove('is-dimmed'); });
      });
    });
  }
  initWorkSpotlight();

  /* ---------- Marquee: duplicate content until it always overflows,
     so the translateX(-50%) loop never runs out of content. ---------- */
  function initMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;
    var container = track.parentElement;
    var baseUnit = track.querySelector('.marquee-unit');
    if (!baseUnit) return;

    var resizeTimer;
    function build() {
      track.style.animation = 'none';
      track.innerHTML = '';
      track.appendChild(baseUnit);
      var containerWidth = container.offsetWidth;
      while (track.scrollWidth < containerWidth) {
        track.appendChild(baseUnit.cloneNode(true));
      }
      var lapWidth = track.scrollWidth;
      var currentUnits = Array.prototype.slice.call(track.children);
      currentUnits.forEach(function (u) { track.appendChild(u.cloneNode(true)); });

      var speed = 70; // px per second
      var duration = lapWidth / speed;
      track.style.animation = '';
      track.style.animationName = 'marquee';
      track.style.animationTimingFunction = 'linear';
      track.style.animationIterationCount = 'infinite';
      track.style.animationDuration = duration + 's';
    }
    build();
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });
  }
  initMarquee();

  /* ---------- Grain overlay with drifting ink blotches ---------- */
  /* Fine per-pixel grain everywhere (light, subtle), plus several
     separate, irregularly-sized dark "islands" that slowly drift like
     liquid. Critical fix from the earlier "TV static" mistake: the
     per-pixel random grain VALUES are generated ONCE and never touched
     again — only the blob positions (which modulate each pixel's alpha)
     move each frame. Randomizing the grain itself every frame is what
     reads as static, no matter how slow the shapes underneath move. */
  function initGrain() {
    var scale = 1; // full resolution — the earlier 0.5 downscale was what read as "low-res"
    var canvas = document.createElement('canvas');
    canvas.className = 'grain-overlay';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var w, h, blobs, grainRGB, grainAlphaJitter, imageData;

    function makeBlobs() {
      var count = 6 + Math.floor(Math.random() * 3);
      var list = [];
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 60 + Math.random() * 100; // real px/sec
        list.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (90 + Math.random() * 260) * scale,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed
        });
      }
      return list;
    }

    function resize() {
      w = canvas.width = Math.ceil(window.innerWidth * scale);
      h = canvas.height = Math.ceil(window.innerHeight * scale);
      blobs = makeBlobs();
      var n = w * h;
      grainRGB = new Uint8Array(n);
      grainAlphaJitter = new Float32Array(n);
      for (var p = 0; p < n; p++) {
        grainRGB[p] = Math.random() * 255;
        grainAlphaJitter[p] = Math.random();
      }
      imageData = ctx.createImageData(w, h); // allocated once, reused every draw — avoids
                                              // allocating a multi-MB buffer on every tick
    }
    resize();
    window.addEventListener('resize', resize);

    // On pages with a reading area that needs to stay blotch-free (the
    // case study), a `.grain-safe-zone` element marks that region. Its
    // bounding rect is read fresh every draw() (it's fixed-canvas vs.
    // scrolling content, so it moves as the page scrolls) and blotch
    // contribution is faded out smoothly inside it — same shared canvas,
    // same color/opacity as everywhere else, just locally suppressed
    // with a soft margin instead of a hard cutoff.
    var safeZoneEl = document.querySelector('.grain-safe-zone');
    var safeZoneRect = null;
    var safeZoneMargin = 130;

    function field(x, y) {
      var v = 0;
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var dx = x - b.x, dy = y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var influence = Math.max(0, 1 - dist / b.r);
        influence = influence * influence * (3 - 2 * influence); // smoothstep — soft, organic edge per blob
        v += influence; // sum, not max — this is what makes nearby blobs bulge toward
                         // each other and merge/split like real liquid metaballs, instead
                         // of just looking like independent moving dots
      }
      v = Math.min(1, v);

      if (safeZoneRect) {
        var dxOut = 0, dyOut = 0;
        if (x < safeZoneRect.left) dxOut = safeZoneRect.left - x;
        else if (x > safeZoneRect.right) dxOut = x - safeZoneRect.right;
        if (y < safeZoneRect.top) dyOut = safeZoneRect.top - y;
        else if (y > safeZoneRect.bottom) dyOut = y - safeZoneRect.bottom;
        var distOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut);
        v *= Math.min(1, distOut / safeZoneMargin); // 0 fully inside, ramps to 1 past the margin
      }
      return v;
    }

    var baseGrain = 16; // light sprinkle of grain everywhere
    var blotchStrength = 230; // how dark the ink blotch cores get

    var fieldBlock = 6; // sample the (smooth, soft-edged) blob field once per NxN block — invisible,
                         // since blotches don't need per-pixel precision — but grain itself stays full-res/crisp
    function draw() {
      if (safeZoneEl) {
        var r = safeZoneEl.getBoundingClientRect();
        safeZoneRect = { left: r.left - 60, right: r.right + 60, top: r.top, bottom: r.bottom + 128 };
      }
      var data = imageData.data;
      for (var by = 0; by < h; by += fieldBlock) {
        var maxY = Math.min(by + fieldBlock, h);
        for (var bx = 0; bx < w; bx += fieldBlock) {
          var maxX = Math.min(bx + fieldBlock, w);
          var blotch = field(bx, by);
          var alphaRange = baseGrain + blotch * blotchStrength;
          for (var y = by; y < maxY; y++) {
            var rowOffset = y * w;
            for (var x = bx; x < maxX; x++) {
              var idx = rowOffset + x;
              var i = idx * 4;
              var v = grainRGB[idx]; // fixed — never re-randomized, full-res, crisp
              data[i] = v;
              data[i + 1] = v;
              data[i + 2] = v;
              data[i + 3] = grainAlphaJitter[idx] * alphaRange;
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    var lastTime = performance.now();
    function tick() {
      var now = performance.now();
      var dt = Math.min((now - lastTime) / 1000, 0.2);
      lastTime = now;
      if (!document.hidden) {
        for (var i = 0; i < blobs.length; i++) {
          var b = blobs[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < -b.r) b.x = w + b.r;
          if (b.x > w + b.r) b.x = -b.r;
          if (b.y < -b.r) b.y = h + b.r;
          if (b.y > h + b.r) b.y = -b.r;
        }
        draw();
      }
    }
    tick();
    setInterval(tick, 110);
  }
  initGrain();

  /* ---------- Liquid cursor: one tapered, smooth-edged polygon ---------- */
  /* Lessons from every earlier attempt, combined:
     - Many circles (even solid ones) always show seams once they differ
       in size — a real continuous shape has to BE one path.
     - A single constant-width stroke fixed the seams but can't taper.
     - A straight-edged tapered polygon (the very first "ribbon") tapered
       fine but looked choppy — straight lineTo edges, not tapering
       itself, was the problem.
     - Densely linear-interpolating between raw mouse samples and then
       smoothing that was a dead end: the interpolated points are
       genuinely straight (that's what linear interpolation means), and
       a local smoothing pass only reaches a few points either side of
       each sample boundary — the bulk of every segment stayed
       perfectly straight no matter how much smoothing was applied,
       because there was no curvature in that data to begin with.
     The actual fix: keep the RAW (sparse) mouse samples only, and fit a
     Catmull-Rom spline through them for rendering. A spline uses each
     point's neighbors to determine how the curve bends, so it's
     genuinely curved everywhere — never straight — regardless of how
     far apart two real samples were. */
  function initLiquidCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'cursor-liquid';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    document.documentElement.classList.add('has-custom-cursor');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var baseRadius = 25;
    var scaleFactor = 1;
    var maxAge = 260; // ms — how long the trail is / how fast it retracts at rest
    var rawSpacing = 40; // px — coarse anchor points for the spline's context, NOT fine sub-pixel interpolation
    var samplesPerSegment = 8; // curve points generated between each pair of raw anchors, for render smoothness
    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var raw = [{ x: mouseX, y: mouseY, born: performance.now() }]; // sparse REAL points only; [0]=oldest, [last]=newest

    window.addEventListener('pointermove', function (e) {
      var now = performance.now();
      var last = raw[raw.length - 1];
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var steps = Math.max(1, Math.min(15, Math.round(dist / rawSpacing)));
      for (var i = 1; i <= steps; i++) {
        var t = i / steps;
        raw.push({ x: last.x + dx * t, y: last.y + dy * t, born: now });
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function bindHoverables() {
      document.querySelectorAll('a, button, .btn, [data-cursor-hover]').forEach(function (el) {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = 'true';
        el.addEventListener('mouseenter', function () { scaleFactor = 1.4; });
        el.addEventListener('mouseleave', function () { scaleFactor = 1; });
      });
    }
    bindHoverables();

    function catmullRomPoint(p0, p1, p2, p3, t) {
      var t2 = t * t, t3 = t2 * t;
      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
        born: p1.born + (p2.born - p1.born) * t
      };
    }

    // Turns the sparse raw anchor points into a dense, genuinely curved
    // point sequence for rendering — this replaces both the old linear
    // sub-interpolation AND the moving-average smoothing pass.
    function buildSplinePoints(rawPts, perSegment) {
      var n = rawPts.length;
      if (n < 2) return rawPts.slice();
      var out = [];
      for (var i = 0; i < n - 1; i++) {
        var p0 = rawPts[Math.max(0, i - 1)];
        var p1 = rawPts[i];
        var p2 = rawPts[i + 1];
        var p3 = rawPts[Math.min(n - 1, i + 2)];
        for (var s = 0; s < perSegment; s++) {
          out.push(catmullRomPoint(p0, p1, p2, p3, s / perSegment));
        }
      }
      out.push(rawPts[n - 1]); // exact final point — keeps the head pinned to the true cursor position
      return out;
    }

    // Traces a smooth curve through a sequence of points (quadratic
    // curve through each pair's midpoint) and draws a proper curved
    // final segment into the true last point instead of a straight
    // lineTo. Applied on top of the already-curved spline points mostly
    // just for extra polish at this point.
    function tracePath(pts, continuing) {
      var n = pts.length;
      if (continuing) ctx.lineTo(pts[0].x, pts[0].y);
      else ctx.moveTo(pts[0].x, pts[0].y);
      if (n < 2) return;
      for (var i = 1; i < n - 1; i++) {
        var midX = (pts[i].x + pts[i + 1].x) / 2;
        var midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      var last = pts[n - 1], prev = pts[Math.max(0, n - 2)];
      ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    }

    function tick() {
      var now = performance.now();
      while (raw.length > 1 && now - raw[0].born > maxAge) raw.shift();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';

      if (raw.length < 2) {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, baseRadius * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
        requestAnimationFrame(tick);
        return;
      }

      var pts = buildSplinePoints(raw, samplesPerSegment);
      var n = pts.length;
      var left = [], right = [], halfWidths = [];
      for (var i = 0; i < n; i++) {
        var p = pts[i];
        var prev = pts[Math.max(0, i - 1)];
        var next = pts[Math.min(n - 1, i + 1)];
        var tx = next.x - prev.x, ty = next.y - prev.y;
        var tlen = Math.sqrt(tx * tx + ty * ty) || 1;
        tx /= tlen;
        ty /= tlen;
        var px = -ty, py = tx;

        var ageParam = Math.min(1, (now - p.born) / maxAge); // 0 = fresh (head), 1 = about to expire (tail)
        var widthFactor = Math.max(0.12, Math.pow(1 - ageParam, 0.6)); // eased, small floor so the tip stays a soft round point, not a knife edge
        var hw = baseRadius * scaleFactor * widthFactor;
        halfWidths.push(hw);

        left.push({ x: p.x + px * hw, y: p.y + py * hw });
        right.push({ x: p.x - px * hw, y: p.y - py * hw });
      }

      ctx.beginPath();
      tracePath(left, false);

      // Rounded head cap: sweep an arc around the true head point from the
      // left edge's angle through the forward-facing direction to the
      // right edge's angle, instead of a flat line straight across.
      var headP = pts[n - 1], headPrev = pts[n - 2];
      var hdx = headP.x - headPrev.x, hdy = headP.y - headPrev.y;
      var hlen = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
      var headAngle = Math.atan2(hdy / hlen, hdx / hlen);
      var angleLeft = headAngle + Math.PI / 2;
      var angleRight = headAngle - Math.PI / 2;
      var headHw = halfWidths[n - 1];
      var capSteps = 10;
      for (var s = 1; s <= capSteps; s++) {
        var ang = angleLeft + (s / capSteps) * (angleRight - angleLeft);
        ctx.lineTo(headP.x + headHw * Math.cos(ang), headP.y + headHw * Math.sin(ang));
      }

      tracePath(right.slice().reverse(), true);

      // Rounded tail cap: same idea, swept around the tail point in the
      // backward direction (away from the rest of the trail).
      var tailP = pts[0], tailNext = pts[1];
      var tdx = tailP.x - tailNext.x, tdy = tailP.y - tailNext.y; // points backward, away from the path
      var tlen2 = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
      var tailAngle = Math.atan2(tdy / tlen2, tdx / tlen2);
      var tAngleRight = tailAngle + Math.PI / 2;
      var tAngleLeft = tailAngle - Math.PI / 2;
      var tailHw = halfWidths[0];
      for (s = 1; s <= capSteps; s++) {
        ang = tAngleRight + (s / capSteps) * (tAngleLeft - tAngleRight);
        ctx.lineTo(tailP.x + tailHw * Math.cos(ang), tailP.y + tailHw * Math.sin(ang));
      }

      ctx.closePath();
      ctx.fill();

      requestAnimationFrame(tick);
    }
    tick();
  }
  initLiquidCursor();

  /* ---------- Hero ink-ripple canvas ---------- */
  function initHeroRipples() {
    var canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var ripples = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize(width, height) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(function (entries) {
        var box = entries[0].contentRect;
        resize(box.width, box.height);
      }).observe(canvas);
    } else {
      resize(canvas.offsetWidth, canvas.offsetHeight);
      window.addEventListener('resize', function () {
        resize(canvas.offsetWidth, canvas.offsetHeight);
      });
    }

    function addRipple(x, y, alpha) {
      ripples.push({ x: x, y: y, r: 0, alpha: alpha || 0.6 });
    }

    canvas.addEventListener('pointerdown', function (e) {
      var rect = canvas.getBoundingClientRect();
      addRipple(e.clientX - rect.left, e.clientY - rect.top);
    });

    /* Ambient "raindrop" ripples that appear on their own — same
       visibility as cursor ripples (no custom alpha). Sparse, single
       drops, like the last drizzle right after rain rather than a
       downpour. */
    function scheduleRaindrop() {
      var delay = 930 + Math.random() * 1730; // ~1.5x more frequent than before
      setTimeout(function () {
        if (!document.hidden) {
          addRipple(Math.random() * canvas.offsetWidth, Math.random() * canvas.offsetHeight);
        }
        scheduleRaindrop();
      }, delay);
    }
    scheduleRaindrop();

    /* The tick() loop below runs on requestAnimationFrame, which browsers
       pause entirely while the tab is hidden — but scheduleRaindrop's
       setTimeout chain keeps running (just throttled), so ripples were
       piling up undecayed and all rendering at once on return. Wiping
       the list on hide avoids that backlog. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) ripples = [];
    });

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ripples.forEach(function (r) {
        r.r += 1.1;
        r.alpha *= 0.97;
      });
      ripples = ripples.filter(function (r) { return r.alpha > 0.012; });
      ripples.forEach(function (r) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(185, 75, 42, ' + r.alpha + ')';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });
      requestAnimationFrame(tick);
    }
    tick();
  }
  initHeroRipples();

  /* ---------- Work feature: play preview video on hover ---------- */
  function initWorkPreviewVideos() {
    document.querySelectorAll('.work-feature-media').forEach(function (media) {
      var video = media.querySelector('video');
      var trigger = media.closest('.work-feature');
      if (!video || !trigger) return;

      trigger.addEventListener('mouseenter', function () {
        video.currentTime = 0;
        var playPromise = video.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
      });
      trigger.addEventListener('mouseleave', function () {
        video.pause();
      });
    });
  }
  initWorkPreviewVideos();
})();
