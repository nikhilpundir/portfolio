// --- INTERACTIVE LOGIC START ---

// 1. CONFETTI EXPLOSION LOGIC
const colors = ['#FF9933', '#E91E63', '#1A237E', '#009688', '#FFC107', '#FFF'];

function createShape(x, y) {
    const el = document.createElement('div');
    const size = Math.random() * 20 + 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shapeType = Math.floor(Math.random() * 3); // 0: circle, 1: square, 2: triangle

    el.classList.add('confetti-part');
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = color;

    if (shapeType === 0) el.style.borderRadius = '50%'; // Circle
    else if (shapeType === 2) { // Triangle using clip-path
        el.style.backgroundColor = color; 
        el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
    } else {
        el.style.border = '2px solid black'; // Pop-art outline for squares
    }

    document.body.appendChild(el);

    // GSAP Physics Animation
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 150 + 50;
    
    gsap.to(el, {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 200, // Gravity effect
        rotation: Math.random() * 360,
        scale: 0,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => el.remove()
    });
}

// Global Click Listener for Explosion
document.addEventListener('click', (e) => {
    // Don't trigger if clicking a button or link
    if (e.target.closest('button') || e.target.closest('a')) return;
    
    // Spawn 10 shapes
    for(let i=0; i<10; i++) {
        createShape(e.clientX, e.clientY);
    }
});

// Function specifically for elements to trigger explosion
function explode(e) {
    e.stopPropagation();
    for(let i=0; i<15; i++) {
        createShape(e.clientX, e.clientY);
    }
}

// Custom Cursor Logic (Only update on desktop if needed)
document.addEventListener('mousemove', (e) => {
    const cursor = document.getElementById('cursor');
    // Only update if cursor is visible (desktop)
    if(window.getComputedStyle(cursor).display !== 'none') {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }
});

// --- RESPONSIVE SCROLL LOGIC ---
const scrollContainer = document.getElementById('scroll-container');

// Only hijack scroll wheel on DESKTOP (screen width > 768px)
scrollContainer.addEventListener("wheel", (evt) => {
    // Check if we're scrolling inside the projects container
    const projectsScroll = evt.target.closest('.projects-scroll');
    if (projectsScroll) {
        // Allow natural vertical scrolling in projects section
        return;
    }
    
    if(window.innerWidth > 768) {
        evt.preventDefault();
        scrollContainer.scrollLeft += evt.deltaY;
    }
    // On mobile, let default vertical scroll happen
});

// Navigation function based on screen size
function scrollToSection(index) {
    const sections = document.querySelectorAll('section');
    if (window.innerWidth > 768) {
        // Desktop: Horizontal Scroll
        const width = window.innerWidth;
        scrollContainer.scrollTo({ left: width * index, behavior: 'smooth' });
    } else {
        // Mobile: Vertical Scroll
        sections[index].scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollNext() {
    if (window.innerWidth > 768) {
        const width = window.innerWidth;
        const currentSection = Math.round(scrollContainer.scrollLeft / width);
        if (currentSection < 4) scrollToSection(currentSection + 1);
    }
}

function scrollPrev() {
    if (window.innerWidth > 768) {
        const width = window.innerWidth;
        const currentSection = Math.round(scrollContainer.scrollLeft / width);
        if (currentSection > 0) scrollToSection(currentSection - 1);
    }
}

// --- PROJECT DATA MANAGEMENT ---
let projectsData = [];

// Load projects from JSON
async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const data = await response.json();
        projectsData = data.projects;
        renderProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Render projects dynamically
function renderProjects() {
    const projectsContainer = document.querySelector('#work .flex.flex-col.md\\:grid');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = '';
    
    projectsData.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'w-full group relative cursor-pointer gsap-reveal-project';
        projectCard.onclick = () => openProjectById(project.id);
        
        projectCard.innerHTML = `
            <div class="h-[350px] md:h-[400px] bg-gray-900 border-4 border-black solid-shadow-white relative overflow-hidden flex items-center justify-center">
                <div class="text-white text-center p-6">
                    <h3 class="text-3xl font-display font-bold mb-2">${project.title}</h3>
                    <p class="font-sans text-sm opacity-80">${project.shortDescription}</p>
                </div>
                <div class="absolute inset-0 bg-${project.color}/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center flex-col">
                    <h3 class="text-3xl font-display font-bold text-white mb-2">${project.title}</h3>
                    <button class="px-6 py-2 bg-white text-black font-bold uppercase border-2 border-black solid-shadow">View Details</button>
                </div>
            </div>
        `;
        
        projectsContainer.appendChild(projectCard);
    });
}

// --- MODAL LOGIC ---
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
    
    // Handle project images (support both 'images' array and legacy 'image' field)
    const images = project.images || (project.image ? [project.image] : []);
    renderImageGallery(images);
    
    // Render technologies
    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = '';
    project.technologies.forEach(tech => {
        const span = document.createElement('span');
        span.className = 'bg-gray-200 px-4 py-2 font-sans font-bold text-sm border-2 border-black';
        span.innerText = tech;
        techContainer.appendChild(span);
    });
    
    // Render features
    const featuresList = modal.querySelector('ul');
    if (featuresList && project.features) {
        featuresList.innerHTML = '';
        project.features.forEach(feature => {
            const li = document.createElement('li');
            li.innerText = feature;
            featuresList.appendChild(li);
        });
    }
    
    // Update button links
    const liveDemoBtn = document.getElementById('live-demo-btn');
    const githubBtn = document.getElementById('github-btn');
    
    if (project.liveUrl) {
        liveDemoBtn.onclick = () => window.open(project.liveUrl, '_blank');
        liveDemoBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        liveDemoBtn.onclick = null;
        liveDemoBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    if (project.githubUrl) {
        githubBtn.onclick = () => window.open(project.githubUrl, '_blank');
        githubBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        githubBtn.onclick = null;
        githubBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    modal.classList.remove('hidden', 'closed');
    modal.classList.add('open');
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

function renderImageGallery(images) {
    const modalImage = document.getElementById('modal-image');
    const modalPlaceholder = document.getElementById('modal-image-placeholder');
    const prevBtn = document.getElementById('prev-image');
    const nextBtn = document.getElementById('next-image');
    const indicators = document.getElementById('image-indicators');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    
    if (!images || images.length === 0) {
        // No images - show placeholder
        modalImage.classList.add('hidden');
        modalPlaceholder.classList.remove('hidden');
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        indicators.classList.add('hidden');
        thumbnailGallery.classList.add('hidden');
        return;
    }
    
    // Show first image
    modalImage.src = images[currentImageIndex];
    modalImage.classList.remove('hidden');
    modalPlaceholder.classList.add('hidden');
    
    // Show/hide navigation based on image count
    if (images.length > 1) {
        prevBtn.classList.remove('hidden');
        prevBtn.classList.add('flex');
        nextBtn.classList.remove('hidden');
        nextBtn.classList.add('flex');
        indicators.classList.remove('hidden');
        indicators.classList.add('flex');
        thumbnailGallery.classList.remove('hidden');
        thumbnailGallery.classList.add('grid');
        
        // Setup navigation
        prevBtn.onclick = () => navigateImage(-1);
        nextBtn.onclick = () => navigateImage(1);
        
        // Render indicators
        renderImageIndicators(images.length);
        
        // Render thumbnails
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
    
    const modalImage = document.getElementById('modal-image');
    modalImage.src = images[currentImageIndex];
    
    updateImageIndicators();
    updateThumbnailSelection();
}

function renderImageIndicators(count) {
    const indicators = document.getElementById('image-indicators');
    indicators.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = `w-3 h-3 rounded-full border-2 border-black transition-all ${i === 0 ? 'bg-white' : 'bg-white/50'}`;
        dot.onclick = () => goToImage(i);
        indicators.appendChild(dot);
    }
}

function updateImageIndicators() {
    const indicators = document.getElementById('image-indicators');
    const dots = indicators.querySelectorAll('button');
    dots.forEach((dot, index) => {
        if (index === currentImageIndex) {
            dot.className = 'w-3 h-3 rounded-full border-2 border-black bg-white transition-all';
        } else {
            dot.className = 'w-3 h-3 rounded-full border-2 border-black bg-white/50 transition-all';
        }
    });
}

function renderThumbnails(images) {
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    thumbnailGallery.innerHTML = '';
    
    images.forEach((img, index) => {
        const thumb = document.createElement('div');
        thumb.className = `cursor-pointer border-4 transition-all ${index === 0 ? 'border-black' : 'border-gray-300'} hover:border-black overflow-hidden h-20`;
        thumb.onclick = () => goToImage(index);
        
        if (img) {
            thumb.innerHTML = `<img src="${img}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover">`;
        } else {
            thumb.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-image text-gray-400"></i></div>`;
        }
        
        thumbnailGallery.appendChild(thumb);
    });
}

function updateThumbnailSelection() {
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    const thumbs = thumbnailGallery.querySelectorAll('div');
    thumbs.forEach((thumb, index) => {
        if (index === currentImageIndex) {
            thumb.className = thumb.className.replace('border-gray-300', 'border-black');
        } else {
            thumb.className = thumb.className.replace('border-black', 'border-gray-300');
        }
    });
}

function goToImage(index) {
    if (!currentProject || !currentProject.images) return;
    
    currentImageIndex = index;
    const modalImage = document.getElementById('modal-image');
    modalImage.src = currentProject.images[currentImageIndex];
    
    updateImageIndicators();
    updateThumbnailSelection();
}

function openProject(title, desc, tech, img, tag) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;
    document.getElementById('modal-tag').innerText = tag;
    
    // Handle project image
    const modalImage = document.getElementById('modal-image');
    const modalPlaceholder = document.getElementById('modal-image-placeholder');
    if (img && img !== '') {
        modalImage.src = img;
        modalImage.classList.remove('hidden');
        modalPlaceholder.classList.add('hidden');
    } else {
        modalImage.classList.add('hidden');
        modalPlaceholder.classList.remove('hidden');
    }
    
    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = '';
    const tags = tech.split(', ');
    tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'bg-gray-200 px-4 py-2 font-sans font-bold text-sm border-2 border-black';
        span.innerText = t;
        techContainer.appendChild(span);
    });

    modal.classList.remove('hidden', 'closed');
    modal.classList.add('open');
    
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

// Initialize projects on page load
document.addEventListener('DOMContentLoaded', loadProjects);

function closeProject() {
    modal.classList.remove('open');
    modal.classList.add('closed');
    
    // Restore scrolling
    document.body.style.overflow = ''; 
     // Re-apply specific overflow rules based on media query manually if needed, 
     // but usually removing the inline style falls back to CSS.
     if(window.innerWidth > 768) {
         document.body.style.overflow = 'hidden'; // Lock for desktop
     } else {
         document.body.style.overflow = 'auto'; // Allow for mobile
     }
}

// Progress Bar Logic (Responsive)
function updateProgressBar() {
    let progress = 0;
    if(window.innerWidth > 768) {
        // Horizontal Calculation
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        progress = (scrollLeft / scrollWidth) * 100;
    } else {
        // Vertical Calculation (Window Scroll)
        const scrollTop = scrollContainer.scrollTop || document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight || document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    }
    document.getElementById('progressBar').style.width = `${progress}%`;
}

// Listen to both scroll events to be safe
scrollContainer.addEventListener('scroll', updateProgressBar);
window.addEventListener('scroll', updateProgressBar);

// --- GSAP OBSERVER ---
const observerOptions = { root: null, threshold: 0.3 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            if(id === 'home') {
                gsap.fromTo(".gsap-reveal-home", { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 1 });
                gsap.fromTo(".gsap-reveal-home-img", { scale: 0.8, opacity: 0, rotation: -10 }, { scale: 1, opacity: 1, rotation: 3, duration: 1.2, delay: 0.3 });
            }
            if(id === 'about') {
                gsap.fromTo(".gsap-reveal-about-left", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
                gsap.fromTo(".gsap-reveal-about-right li", { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.2 });
            }
            if(id === 'skills') {
                gsap.fromTo(".gsap-reveal-skill", { y: 50, opacity: 0, rotation: 5 }, { y: 0, opacity: 1, rotation: 0, duration: 0.8, stagger: 0.2 });
            }
            if(id === 'contact') {
                gsap.fromTo(".gsap-reveal-contact", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.7)" });
            }
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => { observer.observe(section); });
