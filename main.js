/* main.js - unified script
 Features:
  - background canvas particles + glow grid
  - splash (entry animation)
  - theme toggle (light/dark) with storage
  - tilt effect (mouse)
  - page transitions (catch links with data-link)
  - sidebar open/close
  - intersection observer for fade-up
  - profile image fallback
  - footer year fill
*/

/* ---------- Canvas background (particles + subtle grid) ---------- */
(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  let width = innerWidth, height = innerHeight;

  function resize(){
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize();
  window.addEventListener('resize', resize);

  // create particles
  const particles = [];
  const targetCount = Math.max(18, Math.floor((width*height)/100000));
  function rand(a,b){return Math.random()*(b-a)+a}
  for(let i=0;i<targetCount;i++){
    particles.push({
      x: rand(0,width), y: rand(0,height),
      r: rand(1.2,4.5), ang: rand(0,Math.PI*2),
      vx: rand(-0.3,0.3), vy: rand(-0.15,0.15),
      hue: rand(250,300), alpha: rand(0.15,0.8)
    });
  }

  function drawGrid(){
    const step = 120;
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#ffffff';
    for(let x=0;x<width;x+=step){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke();
    }
    for(let y=0;y<height;y+=step){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke();
    }
    ctx.restore();
  }

  function frame(){
    ctx.clearRect(0,0,width,height);

    // gentle gradient overlay
    const g = ctx.createLinearGradient(0,0,width,height);
    g.addColorStop(0, 'rgba(75,0,130,0.12)');
    g.addColorStop(1, 'rgba(138,43,226,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);

    // draw grid (subtle)
    drawGrid();

    // particles
    const t = Date.now();
    for(const p of particles){
      p.x += p.vx + Math.sin(t/2000 + p.x/300) * 0.12;
      p.y += p.vy + Math.cos(t/1500 + p.y/400) * 0.08;

      if(p.x < -50) p.x = width + 50;
      if(p.x > width + 50) p.x = -50;
      if(p.y < -50) p.y = height + 50;
      if(p.y > height + 50) p.y = -50;

      // radial glow
      const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*8);
      rg.addColorStop(0, `hsla(${p.hue},80%,60%,${p.alpha})`);
      rg.addColorStop(0.4, `hsla(${p.hue},70%,50%,${p.alpha*0.25})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*8, 0, Math.PI*2);
      ctx.fill();

      // core
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue+20},90%,65%,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  frame();
})();

/* ---------- Splash handling ---------- */
(function(){
  const splash = document.getElementById('splash');
  if(!splash) return;
  // hide after animation (2s)
  window.addEventListener('load', ()=>{
    setTimeout(()=> {
      splash.style.opacity = 0;
      splash.style.pointerEvents = 'none';
      setTimeout(()=> splash.remove(), 600);
    }, 900);
  });
})();

/* ---------- Theme toggle (dark/light) ---------- */
(function(){
  const body = document.body;
  const toggles = document.querySelectorAll('#themeToggle, #themeToggleTop');
  const saved = localStorage.getItem('site-theme');
  if(saved === 'light') body.classList.add('light');
  toggles.forEach(btn => {
    btn.addEventListener('click', ()=>{
      body.classList.toggle('light');
      const mode = body.classList.contains('light') ? 'light' : 'dark';
      localStorage.setItem('site-theme', mode);
      // update icons
      document.querySelectorAll('#themeToggle, #themeToggleTop').forEach(x=>{
        const i = x.querySelector('i');
        if(i) i.className = mode === 'light' ? 'fa fa-sun' : 'fa fa-moon';
      });
    });
    // set initial icon
    const icon = btn.querySelector('i');
    if(icon) icon.className = body.classList.contains('light') ? 'fa fa-sun' : 'fa fa-moon';
  });
})();

/* ---------- Intersection observer for fade-up ---------- */
(function(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting) en.target.classList.add('visible');
    });
  }, {threshold:0.12});
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
})();

/* ---------- Simple tilt effect for elements with data-tilt ---------- */
(function(){
  const tiltEls = document.querySelectorAll('[data-tilt]');
  tiltEls.forEach(el=>{
    el.addEventListener('mousemove', (e)=>{
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (py - 0.5) * 10; // rotateX
      const ry = (px - 0.5) * -10; // rotateY
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;
    });
    el.addEventListener('mouseleave', ()=> {
      el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
    });
  });
})();

/* ---------- Page transitions (catch links with data-link or any internal link) ---------- */
(function(){
  function navigateWithTransition(url){
    document.body.style.transition = 'opacity .32s ease';
    document.body.style.opacity = '0';
    setTimeout(()=> location.href = url, 320);
  }

  // intercept links marked data-link (primary buttons)
  document.querySelectorAll('a[data-link]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const href = a.getAttribute('href');
      if(!href) return;
      navigateWithTransition(href);
    });
  });

  // also intercept nav links (internal)
  document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(!href) return;
    a.addEventListener('click', (e)=>{
      // allow external targets
      if(a.target === '_blank') return;
      e.preventDefault();
      navigateWithTransition(href);
    });
  });

  // fade in on load
  window.addEventListener('pageshow', ()=> {
    document.body.style.opacity = '1';
  });
})();

/* ---------- Sidebar open / close ---------- */
(function(){
  const open = document.getElementById('openSidebar');
  const close = document.getElementById('closeSidebar');
  const side = document.getElementById('sidebar');
  if(open && side){
    open.addEventListener('click', ()=> { side.classList.add('open'); side.setAttribute('aria-hidden','false'); });
  }
  if(close && side){
    close.addEventListener('click', ()=> { side.classList.remove('open'); side.setAttribute('aria-hidden','true'); });
  }
  // close when clicking outside
  document.addEventListener('click', (e)=>{
    if(!side) return;
    if(!side.contains(e.target) && e.target !== open) side.classList.remove('open');
  });
})();

/* ---------- Footer years ---------- */
(function(){
  const y = new Date().getFullYear();
  ['year_main','year_info','year_ch','year_gr','year_bt'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = y;
  });
})();

/* ---------- profile image fallback ---------- */
(function(){
  document.querySelectorAll('img.profile-img').forEach(img=>{
    img.addEventListener('error', ()=> {
      img.src = 'https://via.placeholder.com/400x400.png?text=Profile';
    });
  });
})();
