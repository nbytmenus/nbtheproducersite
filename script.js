// --- GOOGLE AUTH LOGIC ---
// Decodes the JWT token Google sends back
function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Handles successful sign-in
window.handleCredentialResponse = function(response) {
    const responsePayload = decodeJwtResponse(response.credential);
    
    // Update the UI
    document.querySelector('.g_id_signin').style.display = 'none';
    document.getElementById('user-profile').style.display = 'flex';
    document.getElementById('user-name').innerText = responsePayload.given_name.toLowerCase();
    document.getElementById('user-avatar').src = responsePayload.picture;

    // Save basic user info to local storage
    localStorage.setItem('nb_user', JSON.stringify({
        name: responsePayload.given_name,
        pic: responsePayload.picture,
        id: responsePayload.sub
    }));
};

// Check if user is already logged in on page load
window.addEventListener('load', function() {
    const savedUser = localStorage.getItem('nb_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        document.querySelector('.g_id_signin').style.display = 'none';
        document.getElementById('user-profile').style.display = 'flex';
        document.getElementById('user-name').innerText = user.name.toLowerCase();
        document.getElementById('user-avatar').src = user.pic;
    }
});

// Sign out logic
document.getElementById('sign-out-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('nb_user'); // Delete saved session
    document.querySelector('.g_id_signin').style.display = 'block'; // Show login button
    document.getElementById('user-profile').style.display = 'none'; // Hide profile
});

// --- ALBUM ACCORDION LOGIC ---
function toggleAlbum(albumId, headerElement) {
    const tracks = document.getElementById(albumId);
    const toggleIcon = headerElement.querySelector('.album-toggle');

    if (tracks.classList.contains('open')) {
        tracks.classList.remove('open');
        toggleIcon.style.transform = 'rotate(0deg)';
        toggleIcon.innerText = '+';
    } else {
        tracks.classList.add('open');
        toggleIcon.style.transform = 'rotate(180deg)';
        toggleIcon.innerText = '-';
    }
}

// --- SNOOPING DETERRENTS ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J') || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
    }
});

// --- System Data & Editor Logic ---
const root = document.documentElement;
let globalDensityDivider = 12000;
let globalSpeedMultiplier = 1;
let globalParticleSize = 1;
let globalLinkDistance = 7;
let globalRepelForce = 120;

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

document.getElementById('ctrl-bg').addEventListener('input', (e) => root.style.setProperty('--bg-color', e.target.value));
document.getElementById('ctrl-accent').addEventListener('input', (e) => {
    root.style.setProperty('--accent-color', e.target.value);
    root.style.setProperty('--accent-rgb', hexToRgb(e.target.value));
});
document.getElementById('ctrl-text').addEventListener('input', (e) => root.style.setProperty('--text-color', e.target.value));
document.getElementById('ctrl-font').addEventListener('change', (e) => root.style.setProperty('--font-family', e.target.value));
document.getElementById('ctrl-grain').addEventListener('input', (e) => root.style.setProperty('--grain-opacity', e.target.value / 100));
document.getElementById('ctrl-density').addEventListener('change', (e) => { globalDensityDivider = 32000 - e.target.value; initParticles(); });
document.getElementById('ctrl-speed').addEventListener('input', (e) => globalSpeedMultiplier = e.target.value / 10);
document.getElementById('ctrl-psize').addEventListener('input', (e) => globalParticleSize = e.target.value / 10);
document.getElementById('ctrl-link').addEventListener('input', (e) => globalLinkDistance = e.target.value);
document.getElementById('ctrl-repel').addEventListener('input', (e) => globalRepelForce = e.target.value);

// --- SECURE DEV PANEL AUTH LOGIC ---
const devAuthModal = document.getElementById('dev-auth-modal');
const devPasscodeInput = document.getElementById('dev-passcode');
const devErrorMsg = document.getElementById('dev-error-msg');
const devPanel = document.getElementById('dev-panel');
const targetHash = "31b63ff0db39c6d85bc0cd723d23d69236e7da20e623c7e5282048eacf72bad6";

async function hashInput(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'h' && e.target.tagName !== 'INPUT' && !devPanel.classList.contains('active')) {
        devAuthModal.classList.add('active');
        setTimeout(() => devPasscodeInput.focus(), 100);
    }
    if (e.key === 'Escape') {
        devAuthModal.classList.remove('active');
        devPanel.classList.remove('active');
        devPasscodeInput.value = '';
        devErrorMsg.style.display = 'none';
    }
});

devPasscodeInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const inputHash = await hashInput(devPasscodeInput.value);
        if (inputHash === targetHash) {
            devAuthModal.classList.remove('active');
            devPasscodeInput.value = '';
            devErrorMsg.style.display = 'none';
            devPanel.classList.add('active');
        } else {
            devErrorMsg.style.display = 'block';
            devPasscodeInput.classList.add('shake');
            setTimeout(() => devPasscodeInput.classList.remove('shake'), 400);
        }
    }
});

document.getElementById('close-dev').addEventListener('click', () => devPanel.classList.remove('active'));

// --- Custom Cursor Logic ---
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;

window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = `${mouseX}px`; cursorDot.style.top = `${mouseY}px`;
    cursorOutline.animate({ left: `${mouseX}px`, top: `${mouseY}px` }, { duration: 500, fill: "forwards" });
});

// Re-run hover logic whenever DOM might change
setInterval(() => {
    document.querySelectorAll('.dev-interactive, a, .album-header, .size-btn, #user-profile, .g_id_signin').forEach((el) => {
        if (!el.dataset.cursorBound) {
            el.dataset.cursorBound = true;
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '60px'; cursorOutline.style.height = '60px';
                cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '40px'; cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        }
    });
}, 1000);

// --- Canvas Particle Logic ---
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

class Particle {
    constructor(x, y, directionX, directionY, baseSize) {
        this.x = x; this.y = y; this.baseDirectionX = directionX; this.baseDirectionY = directionY; this.baseSize = baseSize;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.baseSize * globalParticleSize, 0, Math.PI * 2, false);
        let rgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
        ctx.fillStyle = `rgba(${rgb}, 0.3)`;
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.baseDirectionX = -this.baseDirectionX;
        if (this.y > canvas.height || this.y < 0) this.baseDirectionY = -this.baseDirectionY;
        let dx = mouseX - this.x, dy = mouseY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < globalRepelForce && !devPanel.classList.contains('active')) {
            this.x -= dx * 0.02; this.y -= dy * 0.02;
        }
        this.x += this.baseDirectionX * globalSpeedMultiplier;
        this.y += this.baseDirectionY * globalSpeedMultiplier;
        this.draw();
    }
}

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesArray = [];
    let numberOfParticles = (canvas.width * canvas.height) / globalDensityDivider;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 0.5;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let dirX = (Math.random() * 0.8) - 0.4; let dirY = (Math.random() * 0.8) - 0.4;
        particlesArray.push(new Particle(x, y, dirX, dirY, size));
    }
}

function connectParticles() {
    let rgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
            let maxDist = (canvas.width / globalLinkDistance) * (canvas.height / globalLinkDistance);
            if (distance < maxDist) {
                let opacity = 1 - (distance / maxDist);
                ctx.strokeStyle = `rgba(100, 100, 150, ${opacity * 0.15})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke();
            }
        }
        let mouseDist = ((particlesArray[a].x - mouseX) ** 2) + ((particlesArray[a].y - mouseY) ** 2);
        let maxMouseDist = (globalRepelForce * 2) ** 2;
        if (mouseDist < maxMouseDist && !devPanel.classList.contains('active')) {
            let mouseOpacity = 1 - (mouseDist / maxMouseDist);
            ctx.strokeStyle = `rgba(${rgb}, ${mouseOpacity * 0.4})`; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(mouseX, mouseY); ctx.stroke();
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); }
    connectParticles();
}

window.addEventListener('resize', initParticles);
initParticles();
animate();

// --- PRODUCT PAGE MODAL LOGIC ---
const productModal = document.getElementById('product-page');
const closeProductBtn = document.getElementById('close-product');
const sizesContainer = document.getElementById('pp-sizes-container');

document.querySelectorAll('.open-product').forEach(card => {
    card.addEventListener('click', () => {
        document.getElementById('pp-img').innerText = card.dataset.img;
        document.getElementById('pp-title').innerText = card.dataset.title;
        document.getElementById('pp-price').innerText = card.dataset.price;
        document.getElementById('pp-desc').innerText = card.dataset.desc;

        if (card.dataset.sizes === "true") {
            sizesContainer.style.display = 'block';
            document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        } else {
            sizesContainer.style.display = 'none';
        }

        const buyBtn = document.getElementById('pp-buy-btn');
        if (card.dataset.status === 'sold-out') {
            buyBtn.innerText = 'sold out';
            buyBtn.classList.add('disabled');
        } else {
            buyBtn.innerText = 'add to cart';
            buyBtn.classList.remove('disabled');
        }

        productModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

closeProductBtn.addEventListener('click', () => {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
});
