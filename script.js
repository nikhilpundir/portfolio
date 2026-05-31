// --- ACCESSIBILITY & REDUCED MOTION ---
const htmlEl = document.documentElement;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotionEnabled = motionQuery.matches;

function updateMotionState() {
    const heroVideo = document.getElementById('hero-video');
    if (reducedMotionEnabled) {
        htmlEl.classList.add('reduced-motion');
        if (heroVideo) heroVideo.pause();
    } else {
        htmlEl.classList.remove('reduced-motion');
        if (heroVideo) heroVideo.play().catch(err => console.log('Autoplay initialized:', err));
    }
}

// Watch for changes in OS settings
motionQuery.addEventListener('change', (e) => {
    reducedMotionEnabled = e.matches;
    updateMotionState();
});

// Init motion check
updateMotionState();

// --- THEME TOGGLE LOGIC ---
const themeToggleBtn = document.getElementById('theme-toggle');

function toggleTheme() {
    htmlEl.classList.toggle('dark');
    const isDark = htmlEl.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateCanvasColors();
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    htmlEl.classList.remove('dark');
} else {
    htmlEl.classList.add('dark');
}

themeToggleBtn.addEventListener('click', toggleTheme);


// --- FLOATING CAPSULE NAVIGATION (Dynamic Island Collapse) ---
const navCapsule = document.getElementById('nav-capsule');
const navLinksContainer = document.getElementById('nav-links');
const navTrigger = document.getElementById('nav-trigger');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    // 1. Dynamic active link highlight
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 180;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    // Desktop Nav Link highlight
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick').includes(current)) {
            link.classList.add('active');
        }
    });
    
    // Mobile Bottom Nav Link highlight
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    mobileNavBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(current)) {
            btn.classList.add('active');
        }
    });
    
    // 2. Collapse capsule on scroll
    if (window.scrollY > 80) {
        navCapsule.classList.add('collapsed');
    } else {
        navCapsule.classList.remove('collapsed');
    }
});

// Expand capsule on hover when collapsed
navCapsule.addEventListener('mouseenter', () => {
    if (navCapsule.classList.contains('collapsed')) {
        navCapsule.classList.remove('collapsed');
        navCapsule.dataset.wasCollapsed = "true";
    }
});

navCapsule.addEventListener('mouseleave', () => {
    if (navCapsule.dataset.wasCollapsed === "true" && window.scrollY > 80) {
        navCapsule.classList.add('collapsed');
        navCapsule.dataset.wasCollapsed = "false";
    }
});

// Smooth Scroll Anchor Trigger
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}


// --- DUST PARTICLES BACKGROUND CANVAS (Organic Fluid Motion) ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let ripples = [];
let dotColor = 'rgba(28, 28, 30, 0.08)';

let mouse = { x: null, y: null };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

function updateCanvasColors() {
    const isDark = htmlEl.classList.contains('dark');
    if (isDark) {
        dotColor = 'rgba(255, 255, 255, 0.08)';
    } else {
        dotColor = 'rgba(27, 67, 50, 0.08)';
    }
}

class DustParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.16; // Very slow natural drift
        this.vy = (Math.random() - 0.5) * 0.16;
        this.size = Math.random() * 1.5 + 1.0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundaries wrapping
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
        // Pointer viscous displacement push
        if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const forceRadius = 140;
            
            if (dist < forceRadius) {
                const force = (forceRadius - dist) / forceRadius;
                const push = force * 0.9;
                this.x += (dx / dist) * push;
                this.y += (dy / dist) * push;
            }
        }
    }
    
    draw() {
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 160;
        this.speed = 2.8;
        this.opacity = 0.5;
    }

    update() {
        this.radius += this.speed;
        this.opacity = 0.5 * (1 - this.radius / this.maxRadius);
    }

    draw() {
        ctx.strokeStyle = htmlEl.classList.contains('dark') 
            ? `rgba(59, 130, 246, ${this.opacity})` 
            : `rgba(37, 99, 235, ${this.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Global click handler to spawn ripples
window.addEventListener('click', (e) => {
    if (reducedMotionEnabled || !canvas) return;
    
    // Ignore interactive tags
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA'];
    if (interactiveTags.includes(e.target.tagName) || e.target.closest('#profile-shell') || e.target.closest('nav')) {
        return;
    }
    
    ripples.push(new Ripple(e.clientX, e.clientY));
});

function initCanvas() {
    if (!canvas || !ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particles = [];
    ripples = [];
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 120);
    for (let i = 0; i < count; i++) {
        particles.push(new DustParticle());
    }
    updateCanvasColors();
}

function animateCanvas() {
    if (!canvas || !ctx) return;
    
    if (reducedMotionEnabled) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        requestAnimationFrame(animateCanvas);
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dust Particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }

    // Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update();
        if (ripples[i].radius >= ripples[i].maxRadius) {
            ripples.splice(i, 1);
        } else {
            ripples[i].draw();
        }
    }
    
    requestAnimationFrame(animateCanvas);
}

window.addEventListener('resize', initCanvas);
initCanvas();
animateCanvas();


// --- AMBIENT SUNBEAM CURSOR SPRINGS ---
const sunbeam = document.getElementById('sunbeam');
let beamTargetX = -200, beamTargetY = -200;
let beamCurrentX = -200, beamCurrentY = -200;

window.addEventListener('mousemove', (e) => {
    // Set targets centered relative to sunbeam size
    beamTargetX = e.clientX - window.innerWidth * 0.4;
    beamTargetY = e.clientY - window.innerHeight * 0.4;
});

function updateSunbeamPosition() {
    if (!reducedMotionEnabled && sunbeam) {
        const ease = 0.025; // Organic slow spring inertia
        beamCurrentX += (beamTargetX - beamCurrentX) * ease;
        beamCurrentY += (beamTargetY - beamCurrentY) * ease;
        sunbeam.style.transform = `translate3d(${beamCurrentX}px, ${beamCurrentY}px, 0)`;
    }
    requestAnimationFrame(updateSunbeamPosition);
}
updateSunbeamPosition();


// --- PROJECT SHOWCASE HOVER PANELS & INJECTIONS ---
let projectsData = [];

async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const data = await response.json();
        projectsData = data.projects;
        renderProjectsList();
    } catch (e) {
        console.error('Error fetching projects.json:', e);
    }
}

const hoverPanel = document.getElementById('project-hover-panel');
const hoverImg = document.getElementById('project-hover-img');
let panelTargetX = 0, panelTargetY = 0;
let panelCurrentX = 0, panelCurrentY = 0;

window.addEventListener('mousemove', (e) => {
    panelTargetX = e.clientX + 20; // Offset panel from cursor
    panelTargetY = e.clientY + 20;
});

function updateHoverPanelPosition() {
    if (hoverPanel && hoverPanel.style.opacity === '1') {
        if (!reducedMotionEnabled) {
            const ease = 0.12; // Snappy tracking inertia
            panelCurrentX += (panelTargetX - panelCurrentX) * ease;
            panelCurrentY += (panelTargetY - panelCurrentY) * ease;
            hoverPanel.style.transform = `translate3d(${panelCurrentX}px, ${panelCurrentY}px, 0)`;
        } else {
            panelCurrentX = panelTargetX;
            panelCurrentY = panelTargetY;
            hoverPanel.style.transform = `translate3d(${panelCurrentX}px, ${panelCurrentY}px, 0)`;
        }
    }
    requestAnimationFrame(updateHoverPanelPosition);
}
updateHoverPanelPosition();

function renderProjectsList() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    projectsData.forEach((project) => {
        const row = document.createElement('article');
        row.className = 'project-row group';
        row.onclick = () => openProjectById(project.id);
        
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="text-[10px] font-bold text-accent uppercase tracking-widest mb-1.5">${project.tag}</span>
                <h3 class="project-title-serif">${project.title}</h3>
            </div>
            <div class="flex items-center gap-6">
                <span class="text-xs font-semibold text-gray-400 dark:text-neutral-500 hidden md:inline-block">${project.technologies.slice(0, 3).join(' • ')}</span>
                <i class="fa-solid fa-arrow-right text-gray-300 dark:text-neutral-700 group-hover:text-accent group-hover:translate-x-2 transition-all"></i>
            </div>
        `;
        
        // Show floating image on hover
        row.addEventListener('mouseenter', () => {
            const imgUrl = project.images ? project.images[0] : (project.image || '');
            if (imgUrl) {
                hoverImg.src = imgUrl;
                // Snapping coordinates to prevent visual top-left corner jump
                panelCurrentX = panelTargetX;
                panelCurrentY = panelTargetY;
                hoverPanel.style.opacity = '1';
                hoverPanel.style.transform = `translate3d(${panelCurrentX}px, ${panelCurrentY}px, 0) scale(1)`;
            }
        });
        
        row.addEventListener('mouseleave', () => {
            hoverPanel.style.opacity = '0';
            hoverPanel.style.transform = `translate3d(${panelCurrentX}px, ${panelCurrentY}px, 0) scale(0.9)`;
        });
        
        container.appendChild(row);
    });
}

// --- PROJECT CASE MODAL CONTROLS ---
const modal = document.getElementById('project-modal');
let currentProject = null;
let currentImageIndex = 0;

function openProjectById(id) {
    const project = projectsData.find(p => p.id === id);
    if (!project) return;
    
    currentProject = project;
    currentImageIndex = 0;
    
    document.getElementById('modal-title').innerText = project.title;
    document.getElementById('modal-desc').innerText = project.fullDescription;
    document.getElementById('modal-tag').innerText = project.tag;
    
    const images = project.images || (project.image ? [project.image] : []);
    renderImageGallery(images);
    
    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = '';
    project.technologies.forEach(tech => {
        const span = document.createElement('span');
        span.className = 'px-2.5 py-1 rounded bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 text-[10px] font-semibold';
        span.innerText = tech;
        techContainer.appendChild(span);
    });
    
    const featuresList = document.getElementById('modal-features');
    if (featuresList && project.features) {
        featuresList.innerHTML = '';
        project.features.forEach(feature => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2';
            li.innerHTML = `<i class="fa-solid fa-circle text-[4px] text-accent mt-2"></i> <span>${feature}</span>`;
            featuresList.appendChild(li);
        });
    }
    
    const liveDemoBtn = document.getElementById('live-demo-btn');
    const githubBtn = document.getElementById('github-btn');
    
    if (project.liveUrl) {
        liveDemoBtn.onclick = () => window.open(project.liveUrl, '_blank');
        liveDemoBtn.classList.remove('hidden');
    } else {
        liveDemoBtn.classList.add('hidden');
    }
    
    if (project.githubUrl) {
        githubBtn.onclick = () => window.open(project.githubUrl, '_blank');
        githubBtn.classList.remove('hidden');
    } else {
        githubBtn.classList.add('hidden');
    }
    
    modal.classList.remove('closed');
    modal.classList.add('open');
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
}

function closeProject() {
    modal.classList.remove('open');
    modal.classList.add('closed');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    document.body.style.overflow = 'auto';
}

function renderImageGallery(images) {
    const modalImage = document.getElementById('modal-image');
    const modalPlaceholder = document.getElementById('modal-image-placeholder');
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    const indicators = document.getElementById('image-indicators');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    
    if (!images || images.length === 0) {
        modalImage.classList.add('hidden');
        modalPlaceholder.classList.remove('hidden');
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        indicators.classList.add('hidden');
        thumbnailGallery.classList.add('hidden');
        return;
    }
    
    modalImage.src = images[currentImageIndex];
    modalImage.classList.remove('hidden');
    modalPlaceholder.classList.add('hidden');
    
    if (images.length > 1) {
        prevBtn.classList.remove('hidden');
        prevBtn.classList.add('flex');
        nextBtn.classList.remove('hidden');
        nextBtn.classList.add('flex');
        indicators.classList.remove('hidden');
        indicators.classList.add('flex');
        thumbnailGallery.classList.remove('hidden');
        thumbnailGallery.classList.add('grid');
        
        prevBtn.onclick = () => navigateImage(-1);
        nextBtn.onclick = () => navigateImage(1);
        
        renderImageIndicators(images.length);
        renderThumbnails(images);
    } else {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        indicators.classList.add('hidden');
        thumbnailGallery.classList.add('hidden');
    }
}

function navigateImage(direction) {
    if (!currentProject || !currentProject.images) return;
    const images = currentProject.images;
    currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
    document.getElementById('modal-image').src = images[currentImageIndex];
    updateImageIndicators();
    updateThumbnailSelection();
}

function renderImageIndicators(count) {
    const indicators = document.getElementById('image-indicators');
    indicators.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = `w-1.5 h-1.5 rounded-full transition-all ${i === 0 ? 'bg-accent w-4' : 'bg-gray-300 dark:bg-neutral-700'}`;
        dot.onclick = () => goToImage(i);
        indicators.appendChild(dot);
    }
}

function updateImageIndicators() {
    const indicators = document.getElementById('image-indicators');
    const dots = indicators.querySelectorAll('button');
    dots.forEach((dot, index) => {
        dot.className = `w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-accent w-4' : 'bg-gray-300 dark:bg-neutral-700'}`;
    });
}

function renderThumbnails(images) {
    const gallery = document.getElementById('thumbnail-gallery');
    gallery.innerHTML = '';
    images.forEach((img, index) => {
        const thumb = document.createElement('div');
        thumb.className = `cursor-pointer rounded-lg overflow-hidden h-14 border transition-all shadow-sm ${index === 0 ? 'border-accent opacity-100 scale-102' : 'border-transparent opacity-60 hover:opacity-100'}`;
        thumb.onclick = () => goToImage(index);
        thumb.innerHTML = `<img src="${img}" alt="Thumbnail" class="w-full h-full object-cover">`;
        gallery.appendChild(thumb);
    });
}

function updateThumbnailSelection() {
    const thumbs = document.getElementById('thumbnail-gallery').querySelectorAll('div');
    thumbs.forEach((thumb, index) => {
        thumb.className = `cursor-pointer rounded-lg overflow-hidden h-14 border transition-all shadow-sm ${index === currentImageIndex ? 'border-accent opacity-100 scale-102' : 'border-transparent opacity-60 hover:opacity-100'}`;
    });
}

function goToImage(index) {
    if (!currentProject || !currentProject.images) return;
    currentImageIndex = index;
    document.getElementById('modal-image').src = currentProject.images[currentImageIndex];
    updateImageIndicators();
    updateThumbnailSelection();
}


// --- INTERACTIVE MINIMAL TERMINAL SHELL ---
const terminalInput = document.getElementById('terminal-input');
const terminalHistory = document.getElementById('terminal-history');
const terminalBody = document.getElementById('terminal-body');
const profileShell = document.getElementById('profile-shell');
const terminalBackdrop = document.getElementById('terminal-backdrop');

function focusTerminal() {
    if (terminalInput) {
        terminalInput.focus();
    }
}

function handleTerminalClick(e) {
    const btnIds = ['terminal-btn-red', 'terminal-btn-yellow', 'terminal-btn-green'];
    if (btnIds.includes(e.target.id)) {
        return;
    }
    focusTerminal();
}

function toggleTerminalExpand() {
    if (!profileShell) return;
    const isExpanded = profileShell.classList.contains('is-expanded');
    
    if (isExpanded) {
        profileShell.classList.remove('is-expanded');
        if (terminalBackdrop) terminalBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    } else {
        profileShell.classList.remove('is-minimized');
        profileShell.classList.add('is-expanded');
        if (terminalBackdrop) terminalBackdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
        focusTerminal();
    }
}

// Window control button actions
window.handleTerminalBtn = function(action, e) {
    if (e) e.stopPropagation();
    
    if (action === 'red') {
        // Red: Close expanded state, or clear history
        if (profileShell && profileShell.classList.contains('is-expanded')) {
            toggleTerminalExpand(); 
        } else if (terminalHistory) {
            terminalHistory.innerHTML = '';
            const line = document.createElement('div');
            line.innerHTML = `Welcome to profile shell. Type "help" to start.`;
            terminalHistory.appendChild(line);
        }
    } else if (action === 'yellow') {
        // Yellow: Minimize/Collapse
        if (profileShell) {
            if (profileShell.classList.contains('is-expanded')) {
                toggleTerminalExpand(); // revert to normal before minimizing
            }
            profileShell.classList.toggle('is-minimized');
            if (profileShell.classList.contains('is-minimized') && terminalInput) {
                terminalInput.blur();
            }
        }
    } else if (action === 'green') {
        // Green: Maximize/Expand
        if (profileShell) {
            if (profileShell.classList.contains('is-minimized')) {
                profileShell.classList.remove('is-minimized');
            }
            toggleTerminalExpand();
        }
    }
};

if (terminalBackdrop) {
    terminalBackdrop.addEventListener('click', () => {
        if (profileShell && profileShell.classList.contains('is-expanded')) {
            toggleTerminalExpand();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (profileShell && profileShell.classList.contains('is-expanded')) {
            toggleTerminalExpand();
        }
    }
});

if (terminalInput) {
    terminalInput.addEventListener('blur', () => {
        document.getElementById('terminal-cursor').classList.add('opacity-40');
        if (profileShell) {
            profileShell.classList.remove('is-focused');
        }
    });
    terminalInput.addEventListener('focus', () => {
        document.getElementById('terminal-cursor').classList.remove('opacity-40');
        if (profileShell) {
            profileShell.classList.remove('is-minimized'); // auto restore height when focused
            profileShell.classList.add('is-focused');
        }
    });
}

const commands = {
    help: () => `Available profile commands:
  about      - Biographical description
  skills     - Expanded tech stacks
  works      - List featured works
  contact    - Connect channels & links
  exit       - Close or minimize shell
  clear      - Reset terminal outputs`,
    
    about: () => `I am Nikhil Pundir. MCA-qualified Full Stack Developer with 1.5+ years of engineering experience. I design clean microservices in Java/Spring Boot and minimal frontends in React & Next.js.`,
    
    skills: () => `TECHNICAL SKILLSET MATRIX:
  - Java, Spring Boot, Microservices
  - Node.js, Express, PostgreSQL, MongoDB
  - React.js, Next.js, Flutter, Electron
  - Docker, GitHub Actions, Linux Systems`,

    works: () => `SELECTED CASE STUDIES:
  1. Restaurant POS (SPI integration)
  2. Campaign Discovery Portal (Spring Boot)
  3. Green Farm Halal E-commerce
  4. Driver Desktop App (Electron)
  5. Habitish Tracker (Next.js)`,

    contact: () => `CONNECT INFORMATION:
  - Email:    nikhilp190902@gmail.com
  - LinkedIn: linkedin.com/in/nikhil-pundir
  - GitHub:   github.com/nikhilpundir`,

    exit: () => `Exiting profile session...`
};

function appendToTerminalHistory(cmd, output) {
    if (!terminalHistory) return;
    
    const cmdLine = document.createElement('div');
    cmdLine.className = 'mt-1';
    cmdLine.innerHTML = `<span class="text-accent font-bold">nikhil ~ $</span> <span>${cmd}</span>`;
    terminalHistory.appendChild(cmdLine);
    
    const outputLine = document.createElement('div');
    outputLine.className = 'text-gray-500 dark:text-neutral-400 whitespace-pre-wrap ml-2 mt-1 leading-relaxed';
    outputLine.innerHTML = output;
    terminalHistory.appendChild(outputLine);
    
    if (terminalBody) {
        setTimeout(() => {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 10);
    }
}

async function runBootSequence() {
    if (!terminalHistory) return;
    
    const line = document.createElement('div');
    line.innerHTML = `Welcome to profile shell. Type "help" to start.`;
    terminalHistory.appendChild(line);
}

const terminalInputDisplay = document.getElementById('terminal-input-display');
if (terminalInput) {
    terminalInput.addEventListener('input', (e) => {
        if (terminalInputDisplay) {
            terminalInputDisplay.textContent = e.target.value;
        }
    });

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const inputVal = terminalInput.value.trim();
            if (inputVal === '') return;
            
            const lowerInput = inputVal.toLowerCase();
            let outputText = '';
            
            if (lowerInput === 'clear') {
                terminalHistory.innerHTML = '';
            } else if (lowerInput === 'exit') {
                outputText = commands.exit();
                appendToTerminalHistory(inputVal, outputText);
                setTimeout(() => {
                    if (profileShell && profileShell.classList.contains('is-expanded')) {
                        toggleTerminalExpand();
                    } else if (profileShell) {
                        profileShell.classList.add('is-minimized');
                    }
                }, 500);
            } else if (commands[lowerInput]) {
                outputText = commands[lowerInput]();
                appendToTerminalHistory(inputVal, outputText);
            } else {
                outputText = `shell: command not found: ${inputVal}. Type "help" for a list of commands.`;
                appendToTerminalHistory(inputVal, outputText);
            }
            
            terminalInput.value = '';
            if (terminalInputDisplay) {
                terminalInputDisplay.textContent = '';
            }
        }
    });
}


// --- GSAP TEXT TRANSITIONS ---
function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    if (reducedMotionEnabled) return; // Skip GSAP animations for reduced motion

    // Fade up sections
    gsap.utils.toArray("section > div").forEach(elem => {
        gsap.fromTo(elem, 
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 1.0, ease: "power3.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // Custom profile shell scroll entry
    const pShell = document.getElementById('profile-shell');
    if (pShell) {
        // Removed perspective/rotationX to prevent position:fixed containment bugs
        gsap.fromTo(pShell,
            { scale: 0.95, opacity: 0, y: 40 },
            {
                scale: 1, opacity: 1, y: 0,
                duration: 1.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: pShell,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    // Custom background video parallax scroll (GPU accelerated & effortless)
    const hVideo = document.getElementById('hero-video');
    if (hVideo) {
        gsap.to(hVideo, {
            yPercent: 20, // Gentle parallax drift
            ease: "none",
            scrollTrigger: {
                trigger: "#home",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }
}

// --- HERO VIDEO OBSERVERS & CONTROLS ---
function initHeroVideo() {
    const heroVideo = document.getElementById('hero-video');
    if (!heroVideo) return;

    if (!reducedMotionEnabled) {
        heroVideo.play().catch(err => console.log('Autoplay initialized:', err));
    }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    initHeroVideo();
    setTimeout(runBootSequence, 300);
    setTimeout(initGSAP, 600);
});

// --- GLOBAL LOADER ---
window.addEventListener('load', () => {
    const loader = document.getElementById('global-loader');
    if (loader) {
        // Short minimum delay to ensure smooth entry
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
            document.body.classList.remove('overflow-hidden');
            
            setTimeout(() => {
                loader.style.display = 'none';
            }, 700);
        }, 500);
    } else {
        document.body.classList.remove('overflow-hidden');
    }
});

