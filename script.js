/**
 * Portfolio Interactive Script
 * Based on TemplateMo 603 Nexaverse
 * Optimized and organized for better performance
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        loadingDelay: 1000,
        transitionDuration: 550,
        animationStagger: 50,
        menuFadeDelay: 80
    };

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    let isTransitioning = false;
    let menuItems = [];
    let menuGrid = null;
    let mainHeader = null;
    let mainFooter = null;

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    function setup() {
        // Cache DOM elements
        menuItems = Array.from(document.querySelectorAll('.menu-item'));
        menuGrid = document.getElementById('menuGrid');
        mainHeader = document.getElementById('mainHeader');
        mainFooter = document.getElementById('mainFooter');

        // Initialize features
        initLoadingScreen();
        initMenuHandlers();
        initSmoothScroll();
        initAnimations();
    }

    // ============================================
    // LOADING SCREEN
    // ============================================
    function initLoadingScreen() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loadingScreen');
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
            }, CONFIG.loadingDelay);
        });
    }

    // ============================================
    // MENU HANDLERS
    // ============================================
    function initMenuHandlers() {
        menuItems.forEach(item => {
            item.addEventListener('click', handleMenuClick);
        });
    }

    function handleMenuClick(e) {
        if (isTransitioning) return;

        const sectionId = e.currentTarget.dataset.section;
        if (sectionId) {
            showSection(sectionId);
        }
    }

    function showSection(sectionId) {
        if (!sectionId) return;
        
        isTransitioning = true;

        // Prepare menu items for transition
        prepareMenuItemsForTransition();

        // Hide menu items with stagger
        hideMenuItems();

        // Hide header and footer
        hideHeaderFooter();

        // Show content section
        setTimeout(() => {
            displaySection(sectionId);
            isTransitioning = false;
        }, CONFIG.transitionDuration);
    }

    function prepareMenuItemsForTransition() {
        menuItems.forEach((item) => {
            item.classList.remove('initial-load');
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
            item.style.animation = 'none';
        });

        if (menuGrid) void menuGrid.offsetWidth;
    }

    function hideMenuItems() {
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transition = 'all 0.4s ease-out';
                item.style.opacity = '0';
                item.style.transform = 'translateY(40px) scale(0.9)';
            }, index * CONFIG.animationStagger);
        });
    }

    function hideHeaderFooter() {
        if (mainHeader) {
            mainHeader.style.animation = 'none';
            mainHeader.style.opacity = '1';
            void mainHeader.offsetWidth;
            mainHeader.style.transition = 'opacity 0.4s ease';
            mainHeader.style.opacity = '0';
        }
        
        if (mainFooter) {
            mainFooter.style.animation = 'none';
            mainFooter.style.opacity = '1';
            mainFooter.style.transition = 'opacity 0.4s ease';
            mainFooter.style.opacity = '0';
        }
    }

    function displaySection(sectionId) {
        // Hide menu elements
        if (menuGrid) menuGrid.style.display = 'none';
        if (mainHeader) mainHeader.style.display = 'none';
        if (mainFooter) mainFooter.style.display = 'none';

        // Reset menu item styles
        resetMenuItems();

        // Show target section
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');

            // Animate stats if introduction section
            if (sectionId === 'introduction') {
                setTimeout(animateStats, 500);
            }
        }
    }

    function resetMenuItems() {
        menuItems.forEach(item => {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
            item.classList.remove('exit-up', 'visible');
        });
    }

    function backToMenu() {
        if (isTransitioning) return;
        isTransitioning = true;

        const activeSection = document.querySelector('.content-section.active');
        if (!activeSection) {
            isTransitioning = false;
            return;
        }

        fadeOutSection(activeSection);
    }

    function fadeOutSection(activeSection) {
        const sectionHeaderSmall = activeSection.querySelector('.section-header-small');
        const backBtn = activeSection.querySelector('.back-btn');

        // Cancel animation and prepare for fade out
        activeSection.style.animation = 'none';
        activeSection.style.opacity = '1';
        void activeSection.offsetWidth;

        // Apply fade out
        activeSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        activeSection.style.opacity = '0';
        activeSection.style.transform = 'translateY(-20px)';

        if (sectionHeaderSmall) {
            sectionHeaderSmall.style.transition = 'opacity 0.5s ease';
            sectionHeaderSmall.style.opacity = '0';
        }
        if (backBtn) {
            backBtn.style.transition = 'opacity 0.5s ease';
            backBtn.style.opacity = '0';
        }

        // Complete fade out and show menu
        setTimeout(() => {
            cleanupSection(activeSection, sectionHeaderSmall, backBtn);
            showMenu();
        }, CONFIG.transitionDuration);
    }

    function cleanupSection(activeSection, sectionHeaderSmall, backBtn) {
        activeSection.classList.remove('active');
        activeSection.style.animation = '';
        activeSection.style.opacity = '';
        activeSection.style.transform = '';
        activeSection.style.transition = '';

        if (sectionHeaderSmall) {
            sectionHeaderSmall.style.opacity = '';
            sectionHeaderSmall.style.transition = '';
        }
        if (backBtn) {
            backBtn.style.opacity = '';
            backBtn.style.transition = '';
        }
    }

    function showMenu() {
        // Prepare menu elements
        if (menuGrid) menuGrid.style.display = 'grid';
        if (mainHeader) {
            mainHeader.style.display = 'block';
            mainHeader.style.animation = 'none';
            mainHeader.style.opacity = '0';
            mainHeader.style.transform = 'translateY(20px)';
        }
        if (mainFooter) {
            mainFooter.style.display = 'block';
            mainFooter.style.animation = 'none';
            mainFooter.style.opacity = '0';
        }

        menuItems.forEach(item => {
            item.classList.remove('exit-up', 'initial-load', 'return', 'visible');
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px) scale(0.9)';
        });

        // Fade in menu
        setTimeout(() => {
            fadeInMenu();
        }, 150);
    }

    function fadeInMenu() {
        // Fade in header
        if (mainHeader) {
            mainHeader.style.transition = 'all 0.5s ease';
            mainHeader.style.opacity = '1';
            mainHeader.style.transform = 'translateY(0)';
        }

        // Fade in footer
        if (mainFooter) {
            mainFooter.style.transition = 'all 0.5s ease';
            mainFooter.style.opacity = '1';
        }

        // Staggered fade in for menu items
        menuItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0) scale(1)';
            }, index * CONFIG.menuFadeDelay);
        });

        // Cleanup after animations
        setTimeout(() => {
            finalizeMenuTransition();
        }, 600);
    }

    function finalizeMenuTransition() {
        if (mainHeader) {
            mainHeader.style.transition = '';
            mainHeader.style.transform = '';
        }
        if (mainFooter) {
            mainFooter.style.transition = '';
        }

        menuItems.forEach(item => {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
            item.classList.add('visible');
        });

        isTransitioning = false;
    }

    // ============================================
    // STATS ANIMATION
    // ============================================
    function animateStats() {
        const metricValues = document.querySelectorAll('.metric-value[data-target]');
        if (metricValues.length === 0) return;

        metricValues.forEach((el, index) => {
            setTimeout(() => {
                const target = parseInt(el.dataset.target);
                if (isNaN(target)) return;

                let current = 0;
                const increment = target / 40;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = Math.floor(current);
                }, 30);
            }, index * 200);
        });
    }

    // ============================================
    // TAB SWITCHING
    // ============================================
    function switchTab(btn, tabId) {
        if (!btn || !tabId) return;

        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Hide all panes and show target
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        const targetPane = document.getElementById(tabId);
        if (targetPane) {
            targetPane.classList.add('active');
        }
    }

    // ============================================
    // GALLERY FILTER
    // ============================================
    function filterGallery(category, btn) {
        if (!btn) return;

        // Update active button
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Filter items
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
                item.style.animation = 'tabFade 0.4s ease-out';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // ============================================
    // SMOOTH SCROLL
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (!href || href === '#' || href === '#home') {
                    // Scroll to top for home
                    if (href === '#home' || href === '#') {
                        e.preventDefault();
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                        
                        // Update active nav after scroll completes
                        setTimeout(() => {
                            updateActiveNav();
                        }, 600);
                    }
                    return;
                }

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const navHeight = document.querySelector('nav')?.offsetHeight || 80;
                    const offsetTop = target.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: Math.max(0, offsetTop),
                        behavior: 'smooth'
                    });

                    // Update active nav after scroll completes
                    setTimeout(() => {
                        updateActiveNav();
                    }, 600);
                }
            });
        });
    }

    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    function initAnimations() {
        // Intersection Observer for fade-in animations
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            // Observe project cards and skill categories
            document.querySelectorAll('.project-card, .skill-category, .cert-card').forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
    }

    // ============================================
    // NAVIGATION ACTIVE STATE
    // ============================================
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('nav a[href^="#"]');

        if (sections.length === 0 || navLinks.length === 0) return;

        const navHeight = document.querySelector('nav')?.offsetHeight || 80;
        const scrollPos = window.scrollY + navHeight + 50;
        let currentSection = '';

        // Find home section first
        const homeSection = document.getElementById('home');
        if (homeSection) {
            const homeTop = homeSection.offsetTop;
            const homeBottom = homeTop + homeSection.offsetHeight;

            // If scroll position is within home section bounds, set home as active
            if (window.scrollY >= 0 && window.scrollY < homeBottom - navHeight - 50) {
                currentSection = 'home';
            } else {
                // Otherwise, find which section is currently visible
                sections.forEach(section => {
                    const top = section.offsetTop;
                    const bottom = top + section.offsetHeight;
                    const id = section.getAttribute('id');

                    if (scrollPos >= top && scrollPos < bottom) {
                        currentSection = id;
                    }
                });
            }
        } else {
            // Fallback: find which section is currently visible
            sections.forEach(section => {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < bottom) {
                    currentSection = id;
                }
            });
        }

        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${currentSection}` || (currentSection === 'home' && (href === '#home' || href === '#'))) {
                link.classList.add('active');
            }
        });
    }

    // Throttle scroll event for performance
    let scrollTimeout;
    function handleScroll() {
        if (scrollTimeout) {
            cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = requestAnimationFrame(updateActiveNav);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial call
    updateActiveNav();

    // ============================================
    // EXPOSE FUNCTIONS GLOBALLY
    // ============================================
    window.showSection = showSection;
    window.backToMenu = backToMenu;
    window.switchTab = switchTab;
    window.filterGallery = filterGallery;
    window.animateStats = animateStats;

    // ============================================
    // START INITIALIZATION
    // ============================================
    init();

})();
