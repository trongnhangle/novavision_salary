/**
 * NOVA VISION - Advanced Cursor Effects
 * Custom cursor với hiệu ứng đẹp mắt cho ứng dụng tính lương
 */

class AdvancedCursor {
    constructor() {
        this.cursor = null;
        this.cursorInner = null;
        this.cursorOuter = null;
        this.isActive = false;
        this.currentEffect = 'default';
        
        this.init();
    }

    init() {
        // Kiểm tra nếu không phải thiết bị cảm ứng
        if (this.isTouchDevice()) {
            return;
        }

        this.createCursor();
        this.bindEvents();
        this.startAnimation();
    }

    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    createCursor() {
        // Tạo cursor container
        this.cursor = document.createElement('div');
        this.cursor.className = 'nova-cursor';
        this.cursor.innerHTML = `
            <div class="nova-cursor-outer">
                <div class="nova-cursor-trail"></div>
            </div>
            <div class="nova-cursor-inner">
                <div class="nova-cursor-dot"></div>
            </div>
            <div class="nova-cursor-text"></div>
        `;
        
        document.body.appendChild(this.cursor);
        
        this.cursorOuter = this.cursor.querySelector('.nova-cursor-outer');
        this.cursorInner = this.cursor.querySelector('.nova-cursor-inner');
        this.cursorText = this.cursor.querySelector('.nova-cursor-text');
    }

    bindEvents() {
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            this.updatePosition(e.clientX, e.clientY);
        });

        // Mouse enter/leave
        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
            this.isActive = true;
        });

        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
            this.isActive = false;
        });

        // Click effect
        document.addEventListener('mousedown', () => {
            this.addClickEffect();
        });

        // Hover effects cho các elements
        this.bindHoverEffects();
    }

    updatePosition(x, y) {
        if (!this.isActive) return;
        
        this.cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    addClickEffect() {
        this.cursorOuter.style.animation = 'none';
        this.cursorOuter.offsetHeight; // Trigger reflow
        this.cursorOuter.style.animation = 'novaCursorClick 0.3s ease-out';
        
        // Tạo ripple effect
        this.createRipple();
    }

    createRipple() {
        const ripple = document.createElement('div');
        ripple.className = 'nova-cursor-ripple';
        this.cursor.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    bindHoverEffects() {
        // Buttons
        const buttons = document.querySelectorAll('.neo-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                this.setEffect('button');
                this.setCursorText('CLICK');
            });
            button.addEventListener('mouseleave', () => {
                this.setEffect('default');
                this.setCursorText('');
            });
        });

        // Input fields
        const inputs = document.querySelectorAll('.neo-input');
        inputs.forEach(input => {
            input.addEventListener('mouseenter', () => {
                this.setEffect('input');
                this.setCursorText('TYPE');
            });
            input.addEventListener('mouseleave', () => {
                this.setEffect('default');
                this.setCursorText('');
            });
        });

        // Links và close buttons
        const links = document.querySelectorAll('a, .neo-close-btn');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                this.setEffect('link');
                this.setCursorText('GO');
            });
            link.addEventListener('mouseleave', () => {
                this.setEffect('default');
                this.setCursorText('');
            });
        });

        // Special areas
        const header = document.querySelector('.neo-header');
        if (header) {
            header.addEventListener('mouseenter', () => {
                this.setEffect('header');
            });
            header.addEventListener('mouseleave', () => {
                this.setEffect('default');
            });
        }

        // Results section
        const results = document.querySelector('.neo-results-section');
        if (results) {
            results.addEventListener('mouseenter', () => {
                this.setEffect('results');
                this.setCursorText('💰');
            });
            results.addEventListener('mouseleave', () => {
                this.setEffect('default');
                this.setCursorText('');
            });
        }
    }

    setEffect(effectType) {
        // Remove all effect classes
        this.cursor.className = 'nova-cursor';
        
        // Add new effect class
        this.cursor.classList.add(`nova-cursor--${effectType}`);
        this.currentEffect = effectType;
    }

    setCursorText(text) {
        this.cursorText.textContent = text;
        this.cursorText.style.opacity = text ? '1' : '0';
    }

    startAnimation() {
        // Tạo hiệu ứng breathing cho cursor
        setInterval(() => {
            if (this.currentEffect === 'default' && this.isActive) {
                this.cursorOuter.style.animation = 'novaCursorBreathe 2s ease-in-out infinite';
            }
        }, 100);
    }

    // Particle effects
    createParticles(x, y) {
        const colors = ['#FFFF00', '#FF0000', '#0066FF', '#00FF00', '#FF00FF'];
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'nova-cursor-particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }
}

// CSS Styles cho Advanced Cursor
const cursorStyles = `
.nova-cursor {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 99999;
    transition: opacity 0.3s ease;
    transform-origin: center;
}

.nova-cursor-outer {
    width: 40px;
    height: 40px;
    border: 4px solid #000;
    border-radius: 50%;
    background: transparent;
    position: absolute;
    top: -20px;
    left: -20px;
    transition: all 0.15s ease;
    box-shadow: 3px 3px 0px #000;
}

.nova-cursor-inner {
    width: 8px;
    height: 8px;
    background: #FFFF00;
    border: 2px solid #000;
    border-radius: 50%;
    position: absolute;
    top: -4px;
    left: -4px;
    transition: all 0.1s ease;
}

.nova-cursor-text {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: #000;
    color: #FFFF00;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.2s ease;
    white-space: nowrap;
    font-family: 'Space Grotesk', sans-serif;
}

.nova-cursor-dot {
    width: 4px;
    height: 4px;
    background: #000;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.nova-cursor-trail {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 255, 0, 0.1);
    position: absolute;
    animation: novaCursorTrail 1s infinite ease-out;
}

.nova-cursor-ripple {
    position: absolute;
    top: -20px;
    left: -20px;
    width: 40px;
    height: 40px;
    border: 2px solid #FF0000;
    border-radius: 50%;
    animation: novaCursorRipple 0.6s ease-out;
}

.nova-cursor-particle {
    position: fixed;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 99998;
    animation: novaCursorParticle 1s ease-out forwards;
}

/* Effects for different elements */
.nova-cursor--button .nova-cursor-outer {
    width: 60px;
    height: 60px;
    top: -30px;
    left: -30px;
    border-color: #FF0000;
    background: rgba(255, 0, 0, 0.1);
    transform: rotate(45deg);
}

.nova-cursor--button .nova-cursor-inner {
    background: #FF0000;
    width: 12px;
    height: 12px;
    top: -6px;
    left: -6px;
}

.nova-cursor--input .nova-cursor-outer {
    width: 50px;
    height: 20px;
    border-radius: 10px;
    border-color: #0066FF;
    background: rgba(0, 102, 255, 0.1);
    top: -10px;
    left: -25px;
}

.nova-cursor--input .nova-cursor-inner {
    background: #0066FF;
    width: 2px;
    height: 16px;
    border-radius: 1px;
    top: -8px;
    left: -1px;
}

.nova-cursor--link .nova-cursor-outer {
    border-color: #FF00FF;
    background: rgba(255, 0, 255, 0.1);
    transform: scale(1.2);
}

.nova-cursor--link .nova-cursor-inner {
    background: #FF00FF;
    transform: scale(1.5);
}

.nova-cursor--header .nova-cursor-outer {
    border-color: #FF6600;
    background: rgba(255, 102, 0, 0.1);
    box-shadow: 6px 6px 0px #000;
}

.nova-cursor--results .nova-cursor-outer {
    border-color: #00FF00;
    background: rgba(0, 255, 0, 0.1);
    transform: scale(1.3);
}

/* Animations */
@keyframes novaCursorClick {
    0% { transform: scale(1); }
    50% { transform: scale(0.7); border-width: 8px; }
    100% { transform: scale(1); border-width: 4px; }
}

@keyframes novaCursorBreathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes novaCursorTrail {
    0% { opacity: 0.5; transform: scale(0.5); }
    100% { opacity: 0; transform: scale(2); }
}

@keyframes novaCursorRipple {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(3); }
}

@keyframes novaCursorParticle {
    0% { 
        opacity: 1; 
        transform: translate(0, 0) scale(1); 
    }
    100% { 
        opacity: 0; 
        transform: translate(var(--random-x, 20px), var(--random-y, -20px)) scale(0); 
    }
}

/* Hide on mobile */
@media (max-width: 768px), (hover: none) {
    .nova-cursor { display: none !important; }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = cursorStyles;
document.head.appendChild(styleSheet);

// Initialize cursor when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdvancedCursor();
    });
} else {
    new AdvancedCursor();
} 