/**
 * FoundrySuite Website - Main JavaScript
 * Optimized and refactored for performance and maintainability
 * Form submission handled by Formspree (no backend required)
 */

// ============================================================================
// SECURITY MODULE - Input Validation & XSS Prevention
// ============================================================================

const Security = {
    /**
     * Sanitize input to prevent XSS attacks
     */
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    /**
     * Validate email format securely
     */
    validateEmailSecure: (email) => {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (email.length > 254) return false;
        if (email.split('@').length !== 2) return false;
        const [localPart, domain] = email.split('@');
        if (localPart.length > 64 || domain.length > 253) return false;
        return emailRegex.test(email);
    },
    
    /**
     * Detect SQL injection patterns
     */
    detectSQLInjection: (input) => {
        if (typeof input !== 'string') return false;
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
            /(--|#|\/\*|\*\/|;|\||&)/g,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi
        ];
        return sqlPatterns.some(pattern => pattern.test(input));
    }
};

// ============================================================================
// DOM ELEMENT CACHE - Cache all frequently used elements
// ============================================================================
const DOM = {
    navbar: document.querySelector('.navbar'),
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    navLinks: document.querySelectorAll('.nav-link'),
    sections: document.querySelectorAll('section[id]'),
    themeToggle: document.getElementById('themeToggle'),
    html: document.documentElement,
    
    // Form elements
    contactForm: document.getElementById('contactForm'),
    countrySelect: document.getElementById('country'),
    phoneCodeSelect: document.getElementById('phoneCode'),
    captchaQuestion: document.getElementById('captchaQuestion'),
    captchaAnswer: document.getElementById('captchaAnswer'),
    captchaRefresh: document.getElementById('captchaRefresh'),
    phoneFlagDisplay: document.getElementById('phoneFlagDisplay'),
    phoneCodeDisplay: document.getElementById('phoneCodeDisplay'),
    phoneInput: document.getElementById('phone'),
    
    // Form fields
    description: document.getElementById('description'),
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    company: document.getElementById('company'),
    relationship: document.getElementById('relationship'),
    
    // Slideshow
    slides: document.querySelectorAll('.solution-slide'),
    indicators: document.querySelectorAll('.slide-indicator'),
    prevBtn: document.querySelector('.prev-btn'),
    nextBtn: document.querySelector('.next-btn'),
    slideshow: document.querySelector('.solution-slideshow'),
    mobileScreens: document.querySelectorAll('.mobile-screen-view'),
    
    // Other
    contactItems: document.querySelectorAll('.contact-item'),
    
    // Success Modal
    successModal: document.getElementById('successModal'),
    successModalOverlay: document.querySelector('.success-modal-overlay'),
    closeSuccessModal: document.getElementById('closeSuccessModal')
};

// ============================================================================
// CONSTANTS
// ============================================================================
const FORM_FIELDS = ['description', 'firstName', 'lastName', 'country', 'phone', 'email', 'company', 'relationship'];
const NAVBAR_SCROLL_THRESHOLD = 100;
const SCROLL_OFFSET = 10;
const SLIDESHOW_INTERVAL = 8000;

const countryToPhoneCode = {
    'AF': '+93', 'AL': '+355', 'DZ': '+213', 'AR': '+54', 'AU': '+61', 'AT': '+43',
    'BH': '+973', 'BD': '+880', 'BE': '+32', 'BR': '+55', 'BN': '+673', 'BG': '+359',
    'CA': '+1', 'CL': '+56', 'CN': '+86', 'CO': '+57', 'CR': '+506', 'HR': '+385',
    'CZ': '+420', 'DK': '+45', 'EG': '+20', 'EE': '+372', 'FI': '+358', 'FR': '+33',
    'DE': '+49', 'GH': '+233', 'GR': '+30', 'HK': '+852', 'HU': '+36', 'IS': '+354',
    'IN': '+91', 'ID': '+62', 'IE': '+353', 'IL': '+972', 'IT': '+39', 'JP': '+81',
    'JO': '+962', 'KE': '+254', 'KW': '+965', 'LV': '+371', 'LB': '+961', 'MY': '+60',
    'MX': '+52', 'MA': '+212', 'NL': '+31', 'NZ': '+64', 'NG': '+234', 'NO': '+47',
    'OM': '+968', 'PK': '+92', 'PH': '+63', 'PL': '+48', 'PT': '+351', 'QA': '+974',
    'RO': '+40', 'RU': '+7', 'SA': '+966', 'SG': '+65', 'ZA': '+27', 'KR': '+82',
    'ES': '+34', 'SE': '+46', 'CH': '+41', 'TW': '+886', 'TH': '+66', 'TR': '+90',
    'UA': '+380', 'AE': '+971', 'GB': '+44', 'US': '+1', 'VN': '+84'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate scroll position for a target element accounting for navbar
 */
const calculateScrollPosition = (target) => {
    const navbarHeight = DOM.navbar ? DOM.navbar.offsetHeight : 100;
    const targetRect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const offsetTop = targetRect.top + scrollTop - navbarHeight - SCROLL_OFFSET;
    return Math.max(0, offsetTop);
};

/**
 * Ensure only one hyphen in phone number
 */
const ensureSingleHyphen = (value) => {
    const hyphenCount = (value.match(/-/g) || []).length;
    if (hyphenCount > 1) {
        const firstHyphenIndex = value.indexOf('-');
        return value.substring(0, firstHyphenIndex + 1) + value.substring(firstHyphenIndex + 1).replace(/-/g, '');
    }
    return value;
};

/**
 * Validate email format securely
 */
const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return 'Please enter valid e-mail address...';
    }
    
    const trimmed = email.trim();
    
    // Use secure email validation
    if (!Security.validateEmailSecure(trimmed)) {
        return 'Please enter valid e-mail address...';
    }
    
    return null;
};

/**
 * Get element by ID safely
 */
const getElement = (id) => document.getElementById(id);

/**
 * Get error element for a field
 */
const getErrorElement = (fieldId) => getElement(fieldId + 'Error');

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Show error message for a field
 */
const showError = (fieldId, message) => {
    const errorElement = getErrorElement(fieldId);
    const inputElement = getElement(fieldId);
    
    if (errorElement) {
        // Set text and show immediately (no animations)
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('show');
    }
    
    if (inputElement) {
        inputElement.classList.add('error');
        if (fieldId === 'phone') {
            const phoneWrapper = inputElement.closest('.phone-input-wrapper');
            if (phoneWrapper) phoneWrapper.classList.add('error');
        }
    }
};

/**
 * Hide error message for a field
 */
const hideError = (fieldId) => {
    const errorElement = getErrorElement(fieldId);
    const inputElement = getElement(fieldId);
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
        if (fieldId === 'phone') {
            const phoneWrapper = inputElement.closest('.phone-input-wrapper');
            if (phoneWrapper) phoneWrapper.classList.remove('error');
        }
    }
};

/**
 * Clear all form errors
 */
const clearAllErrors = () => {
    FORM_FIELDS.forEach(fieldId => hideError(fieldId));
    // Also clear CAPTCHA error
    if (DOM.captchaAnswer) {
        hideError('captchaAnswer');
        DOM.captchaAnswer.classList.remove('error');
    }
};

/**
 * Show success modal
 */
const showSuccessModal = () => {
    if (DOM.successModal) {
        DOM.successModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

/**
 * Hide success modal
 */
const hideSuccessModal = () => {
    if (DOM.successModal) {
        DOM.successModal.classList.remove('show');
        document.body.style.overflow = '';
    }
};

/**
 * Initialize success modal
 */
const initSuccessModal = () => {
    if (!DOM.successModal || !DOM.closeSuccessModal) return;
    
    // Close button click
    DOM.closeSuccessModal.addEventListener('click', hideSuccessModal);
    
    // Close on overlay click
    if (DOM.successModalOverlay) {
        DOM.successModalOverlay.addEventListener('click', (e) => {
            if (e.target === DOM.successModalOverlay) hideSuccessModal();
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.successModal.classList.contains('show')) {
            hideSuccessModal();
        }
    });
};

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Update navbar scroll state
 */
const updateNavbarScroll = () => {
    if (DOM.navbar) {
        DOM.navbar.classList.toggle('scrolled', window.pageYOffset > NAVBAR_SCROLL_THRESHOLD);
    }
};

/**
 * Update active navigation link based on scroll position
 */
const updateActiveNavLink = () => {
    const scrollY = window.pageYOffset;
    
    const setActiveLink = (targetId) => {
        DOM.navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === targetId);
        });
    };
    
    if (scrollY < NAVBAR_SCROLL_THRESHOLD) {
        setActiveLink('#home');
        return;
    }
    
    for (const section of DOM.sections) {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - NAVBAR_SCROLL_THRESHOLD;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            setActiveLink(`#${sectionId}`);
            return;
        }
    }
};

/**
 * Initialize smooth scrolling for navigation links
 */
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const scrollPosition = calculateScrollPosition(target);
                window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
                setTimeout(updateActiveNavLink, 100);
            }
        });
    });
};

/**
 * Initialize mobile navigation
 */
const initMobileNav = () => {
    if (DOM.navToggle && DOM.navMenu) {
        DOM.navToggle.addEventListener('click', () => {
            DOM.navMenu.classList.toggle('active');
            DOM.navToggle.classList.toggle('active');
        });
        
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                DOM.navMenu.classList.remove('active');
                DOM.navToggle.classList.remove('active');
            });
        });
    }
};

/**
 * Handle hash navigation
 */
let savedHash = null;
if (window.location.hash) {
    savedHash = window.location.hash;
    history.replaceState(null, null, window.location.pathname);
}

const handleHashNavigation = (useSmooth = false) => {
    const hash = savedHash || window.location.hash;
    if (hash) {
        if (savedHash && !window.location.hash) {
            history.replaceState(null, null, savedHash);
        }
        
        const target = document.querySelector(hash);
        if (target) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const scrollPosition = calculateScrollPosition(target);
                    window.scrollTo({
                        top: scrollPosition,
                        behavior: useSmooth ? 'smooth' : 'instant'
                    });
                    setTimeout(() => {
                        updateActiveNavLink();
                        updateNavbarScroll();
                    }, useSmooth ? 500 : 100);
                });
            });
        }
    }
};

// ============================================================================
// PHONE NUMBER HANDLING
// ============================================================================

/**
 * Update phone display from option
 */
const updatePhoneDisplayFromOption = (option) => {
    if (DOM.phoneFlagDisplay && DOM.phoneCodeDisplay) {
        const flag = option.getAttribute('data-flag');
        const code = option.getAttribute('data-code');
        if (flag) DOM.phoneFlagDisplay.textContent = flag;
        if (code) DOM.phoneCodeDisplay.textContent = code;
    }
};

/**
 * Find and select phone code option
 */
const findPhoneCodeOption = (selectedCountry, phoneCode) => {
    for (let i = 0; i < DOM.phoneCodeSelect.options.length; i++) {
        const option = DOM.phoneCodeSelect.options[i];
        const optionCountry = option.getAttribute('data-country');
        const alsoFor = option.getAttribute('data-also-for');
        
        if ((optionCountry && optionCountry === selectedCountry) ||
            (alsoFor && alsoFor === selectedCountry) ||
            (!optionCountry && !alsoFor && option.value === phoneCode)) {
            DOM.phoneCodeSelect.selectedIndex = i;
            updatePhoneDisplayFromOption(option);
            return true;
        }
    }
    return false;
};

/**
 * Generate a random math CAPTCHA question
 * Returns an object with { question: string, answer: number }
 */
let currentCaptchaAnswer = null;

const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1; // 1-10
    const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let answer;
    let question;
    
    switch (operation) {
        case '+':
            answer = num1 + num2;
            question = `${num1} + ${num2} = ?`;
            break;
        case '-':
            // Ensure positive result
            const larger = Math.max(num1, num2);
            const smaller = Math.min(num1, num2);
            answer = larger - smaller;
            question = `${larger} - ${smaller} = ?`;
            break;
        case '*':
            answer = num1 * num2;
            question = `${num1} × ${num2} = ?`;
            break;
    }
    
    currentCaptchaAnswer = answer;
    return { question, answer };
};

/**
 * Initialize CAPTCHA
 */
const initCaptcha = () => {
    if (!DOM.captchaQuestion || !DOM.captchaAnswer) return;
    
    // Generate initial CAPTCHA
    const captcha = generateCaptcha();
    DOM.captchaQuestion.textContent = captcha.question;
    DOM.captchaAnswer.value = '';
    
    // Clear error on input
    DOM.captchaAnswer.addEventListener('input', () => {
        hideError('captchaAnswer');
        DOM.captchaAnswer.classList.remove('error');
    });
    
    // Refresh CAPTCHA button
    if (DOM.captchaRefresh) {
        DOM.captchaRefresh.addEventListener('click', () => {
            const captcha = generateCaptcha();
            DOM.captchaQuestion.textContent = captcha.question;
            DOM.captchaAnswer.value = '';
            hideError('captchaAnswer');
            DOM.captchaAnswer.classList.remove('error');
            DOM.captchaAnswer.focus();
        });
    }
};

/**
 * Initialize phone code selection
 */
const initPhoneCodeSelection = () => {
    if (!DOM.countrySelect || !DOM.phoneCodeSelect) return;
    
    // Handle country selection change
    DOM.countrySelect.addEventListener('change', function(e) {
        const selectedCountry = this.value;
        
        // ALWAYS clear error immediately - no conditions
        hideError('country');
        this.setCustomValidity('');
        this.classList.remove('error');
        
        // Update phone code if country is selected
        if (selectedCountry && selectedCountry !== '' && countryToPhoneCode[selectedCountry]) {
            findPhoneCodeOption(selectedCountry, countryToPhoneCode[selectedCountry]);
        }
    });
    
    // Also clear errors on interaction
    ['focus', 'click'].forEach(eventType => {
        DOM.countrySelect.addEventListener(eventType, function() {
            if (this.value && this.value !== '' && this.value !== 'Select Country/Region') {
                hideError('country');
                this.setCustomValidity('');
                this.classList.remove('error');
            }
        });
    });
    
    if (DOM.countrySelect.value === 'IN') {
        const defaultOption = DOM.phoneCodeSelect.querySelector('option[data-country="IN"]');
        if (defaultOption) updatePhoneDisplayFromOption(defaultOption);
    }
};

/**
 * Initialize phone code display
 */
const initPhoneCodeDisplay = () => {
    if (!DOM.phoneCodeSelect || !DOM.phoneFlagDisplay || !DOM.phoneCodeDisplay) return;
    
    const hideSelectText = () => {
        DOM.phoneCodeSelect.style.color = 'transparent';
        DOM.phoneCodeSelect.style.textIndent = '-9999px';
    };
    
    const updatePhoneDisplay = () => {
        const selectedOption = DOM.phoneCodeSelect.options[DOM.phoneCodeSelect.selectedIndex];
        if (selectedOption) updatePhoneDisplayFromOption(selectedOption);
        hideSelectText();
    };
    
    const preventInteraction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.phoneCodeSelect.blur();
        return false;
    };
    
    ['mousedown', 'click', 'keydown'].forEach(event => {
        DOM.phoneCodeSelect.addEventListener(event, preventInteraction);
    });
    
    DOM.phoneCodeSelect.addEventListener('focus', (e) => {
        e.preventDefault();
        DOM.phoneCodeSelect.blur();
    });
    
    hideSelectText();
    updatePhoneDisplay();
    
    const observer = new MutationObserver(hideSelectText);
    observer.observe(DOM.phoneCodeSelect, {
        attributes: true,
        attributeFilter: ['style', 'class']
    });
};

/**
 * Initialize phone input validation
 */
const initPhoneInput = () => {
    if (!DOM.phoneInput) return;
    
    const processPhoneValue = (value) => {
        value = value.replace(/[^0-9\-]/g, '');
        value = ensureSingleHyphen(value);
        const digitCount = value.replace(/-/g, '').length;
        
        if (digitCount > 15) {
            let digitsOnly = value.replace(/-/g, '').slice(0, 15);
            const hyphenIndex = value.indexOf('-');
            if (hyphenIndex !== -1 && hyphenIndex < digitsOnly.length) {
                value = digitsOnly.substring(0, hyphenIndex) + '-' + digitsOnly.substring(hyphenIndex);
            } else {
                value = digitsOnly;
            }
        }
        
        return value.length > 16 ? value.slice(0, 16) : value;
    };
    
    DOM.phoneInput.addEventListener('input', (e) => {
        e.target.value = processPhoneValue(e.target.value);
    });
    
    DOM.phoneInput.addEventListener('keypress', (e) => {
        const char = String.fromCharCode(e.which || e.keyCode);
        const currentValue = e.target.value;
        const hasHyphen = currentValue.includes('-');
        
        if (!/[0-9]/.test(char) && !(char === '-' && !hasHyphen && currentValue.length > 0)) {
            e.preventDefault();
        }
    });
    
    DOM.phoneInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        DOM.phoneInput.value = processPhoneValue(paste);
    });
};

// ============================================================================
// FORM VALIDATION
// ============================================================================

/**
 * Setup alphabetic-only field validation with security
 */
const setupAlphaOnlyField = (input, fieldId) => {
    if (!input) return;
    
    const filterAlphaOnly = (e) => {
        let value = e.target.value;
        
        // Security: Remove potentially dangerous characters
        value = value.replace(/[^A-Za-z\s]/g, '');
        
        e.target.value = value;
        hideError(e.target.id);
    };
    
    input.addEventListener('input', filterAlphaOnly);
    input.addEventListener('keypress', (e) => {
        const char = String.fromCharCode(e.which || e.keyCode);
        if (!/[A-Za-z\s]/.test(char)) {
            e.preventDefault();
        }
    });
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        input.value = paste.replace(/[^A-Za-z\s]/g, '');
        hideError(fieldId);
    });
};

/**
 * Set custom validation messages
 */
const setCustomValidationMessages = () => {
    const fields = {
        description: 'Please provide a description (minimum 5 characters)',
        firstName: 'Please enter your first name (3-15 characters)',
        lastName: 'Please enter your last name (1-15 characters)',
        country: 'Please select your country/region',
        phone: 'Please enter your contact number (7-15 digits, numeric only)',
        email: 'Please enter valid e-mail address...',
        company: 'Please enter your company name (5-50 characters)',
        relationship: 'Please select your relationship to FoundrySuite',
        captchaAnswer: 'Please solve the security check correctly'
    };
    
    Object.entries(fields).forEach(([fieldId, message]) => {
        const field = getElement(fieldId);
        if (field) {
            field.setCustomValidity(message);
            const eventType = (fieldId === 'country' || fieldId === 'relationship') ? 'change' : 'input';
            field.addEventListener(eventType, (e) => e.target.setCustomValidity(''));
        }
    });
};

/**
 * Validate form field with security checks
 */
const validateField = (fieldId, value) => {
    const trimmed = value ? value.trim() : '';
    
    switch (fieldId) {
        case 'description':
            if (!trimmed) return 'Please provide a description';
            if (trimmed.length < 5) return 'Description must be at least 5 characters';
            return null;
            
        case 'firstName':
            if (!trimmed) return 'Please enter your first name';
            if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'First name must contain only alphabetic characters';
            if (trimmed.length < 3) return 'First name must be at least 3 characters';
            if (trimmed.length > 15) return 'First name must not exceed 15 characters';
            return null;
            
        case 'lastName':
            // Security: Check for SQL injection and XSS patterns
            if (Security.detectSQLInjection(trimmed)) {
                return 'Invalid characters detected. Please use only alphanumeric characters and standard punctuation.';
            }
            if (trimmed.includes('<script') || trimmed.includes('javascript:') || trimmed.includes('onerror=')) {
                return 'Invalid characters detected. Please use only alphanumeric characters and standard punctuation.';
            }
            if (!trimmed) return 'Please enter your last name';
            if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'Last name must contain only alphabetic characters';
            if (trimmed.length < 1) return 'Last name must be at least 1 character';
            if (trimmed.length > 15) return 'Last name must not exceed 15 characters';
            return null;
            
        case 'country':
            // Check if value is empty or the default empty option
            // Handle null, undefined, empty string, or default option text
            const countryValue = value ? String(value).trim() : '';
            if (!countryValue || 
                countryValue === '' || 
                countryValue === 'Select Country/Region' || 
                countryValue === 'Please select' ||
                countryValue === '0') {
                return 'Please select your country/region';
            }
            // Any non-empty value that's not the default is valid (like "IN", "US", etc.)
            return null; // Valid country selection
            
        case 'phone':
            if (!trimmed) return 'Please enter your contact number';
            const phoneDigits = trimmed.replace(/[^0-9]/g, '');
            const hasMultipleHyphens = (trimmed.match(/-/g) || []).length > 1;
            if (!/^[0-9]+(-[0-9]+)?$/.test(trimmed)) return 'Phone number must contain only numeric digits with optional hyphen';
            if (hasMultipleHyphens) return 'Phone number can contain only one hyphen to separate area code';
            if (phoneDigits.length < 7) return 'Phone number must contain at least 7 digits';
            if (phoneDigits.length > 15) return 'Phone number must not exceed 15 digits';
            return null;
            
        case 'email':
            if (!trimmed) return 'Please enter valid e-mail address...';
            return validateEmail(trimmed);
            
        case 'company':
            // Security: Check for SQL injection and XSS patterns
            if (Security.detectSQLInjection(trimmed)) {
                return 'Invalid characters detected. Please use only alphanumeric characters and standard punctuation.';
            }
            if (trimmed.includes('<script') || trimmed.includes('javascript:') || trimmed.includes('onerror=')) {
                return 'Invalid characters detected. Please use only alphanumeric characters and standard punctuation.';
            }
            if (!trimmed) return 'Please enter your company name';
            if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'Company name must contain only alphabetic characters';
            if (trimmed.length < 5) return 'Company name must be at least 5 characters';
            if (trimmed.length > 50) return 'Company name must not exceed 50 characters';
            return null;
            
        case 'relationship':
            return !value ? 'Please select your relationship to FoundrySuite' : null;
            
        case 'captchaAnswer':
            if (!trimmed) return 'Please solve the security check correctly';
            // CAPTCHA validation is handled separately in initFormSubmission
            return null;
            
        default:
            return null;
    }
};

/**
 * Initialize form submission
 * Formspree handles spam protection and email sending
 */
const initFormSubmission = () => {
    if (!DOM.contactForm) return;
    
    // Clear errors on input
    FORM_FIELDS.forEach(fieldId => {
        const field = getElement(fieldId);
        if (field) {
            const eventType = (fieldId === 'country' || fieldId === 'relationship') ? 'change' : 'input';
            field.addEventListener(eventType, () => {
                hideError(fieldId);
                // Clear custom validity to prevent native HTML5 validation
                field.setCustomValidity('');
            });
        }
    });
    
    // Setup alphabetic-only fields
    setupAlphaOnlyField(DOM.firstName, 'firstName');
    setupAlphaOnlyField(DOM.lastName, 'lastName');
    setupAlphaOnlyField(DOM.company, 'company');
    
    // Form validation before submission (Formspree will handle the actual submission)
    DOM.contactForm.addEventListener('submit', (e) => {
        // Prevent native HTML5 validation from showing one error at a time
        e.preventDefault();
        e.stopPropagation();
        
        // Clear all previous errors first
        clearAllErrors();
        
        // Clear any native HTML5 validation messages
        FORM_FIELDS.forEach(fieldId => {
            const field = getElement(fieldId);
            if (field) {
                field.setCustomValidity('');
                field.classList.remove('error');
            }
        });
        
        // Also clear CAPTCHA error
        if (DOM.captchaAnswer) {
            DOM.captchaAnswer.setCustomValidity('');
            DOM.captchaAnswer.classList.remove('error');
        }
        
        let hasErrors = false;
        const formDataObj = new FormData(DOM.contactForm);
        const errorsToShow = []; // Collect all errors first
        
        // Validate all fields and collect all errors (don't display yet)
        FORM_FIELDS.forEach(fieldId => {
            const field = getElement(fieldId);
            // Always get value directly from field element to ensure we have the current value
            // This is especially important for select elements like country
            let value = '';
            if (field) {
                // For select elements, always get the value directly from the element
                // Read the actual value from the DOM element
                value = field.value;
                // Handle null/undefined but preserve empty string and '0'
                if (value === null || value === undefined) {
                    value = '';
                }
            } else {
                value = formDataObj.get(fieldId) || '';
            }
            const error = validateField(fieldId, value);
            
            if (error) {
                errorsToShow.push({ fieldId, error, field });
                hasErrors = true;
            } else {
                // Clear custom validity if validation passes
                if (field) {
                    field.setCustomValidity('');
                }
            }
        });
        
        // Validate CAPTCHA separately
        if (DOM.captchaAnswer) {
            const userAnswer = DOM.captchaAnswer.value.trim();
            if (!userAnswer) {
                errorsToShow.push({ 
                    fieldId: 'captchaAnswer', 
                    error: 'Please solve the security check correctly',
                    field: DOM.captchaAnswer
                });
                hasErrors = true;
            } else {
                const answerNum = parseInt(userAnswer, 10);
                if (isNaN(answerNum) || answerNum !== currentCaptchaAnswer) {
                    errorsToShow.push({ 
                        fieldId: 'captchaAnswer', 
                        error: 'Please solve the security check correctly',
                        field: DOM.captchaAnswer
                    });
                    // Generate new CAPTCHA on wrong answer
                    const captcha = generateCaptcha();
                    DOM.captchaQuestion.textContent = captcha.question;
                    DOM.captchaAnswer.value = '';
                    hasErrors = true;
                } else {
                    // CAPTCHA is valid, clear any previous errors
                    hideError('captchaAnswer');
                    DOM.captchaAnswer.setCustomValidity('');
                    DOM.captchaAnswer.classList.remove('error');
                }
            }
        }
        
        // Now display ALL errors at once (synchronously - NO delays)
        if (hasErrors) {
            // First, set all custom validity to prevent any native HTML5 validation
            errorsToShow.forEach(({ fieldId, field }) => {
                if (field) {
                    field.setCustomValidity('Invalid'); // Set to prevent native validation
                }
            });
            
            // Then display all errors immediately in one synchronous batch (no loops with delays)
            errorsToShow.forEach(({ fieldId, error, field }) => {
                showError(fieldId, error);
                // Add error class to input field
                if (field) {
                    field.classList.add('error');
                    // Set custom validity with the actual error message
                    field.setCustomValidity(error);
                }
            });
            
            // Scroll to first error after all errors are displayed (small delay for DOM updates)
            setTimeout(() => {
                const firstErrorField = document.querySelector('.error-message.show');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 10);
            
            return false;
        }
        
        // If no errors, submit the form to Formspree using fetch
        const submitFormData = new FormData(DOM.contactForm);
        
        // CRITICAL: Ensure description field (name="message") is included in submission
        // The field has id="description" but name="message"
        // FormData should get it automatically, but we'll explicitly ensure it's included
        const descriptionField = DOM.contactForm.querySelector('[name="message"]') || 
                                 DOM.contactForm.querySelector('#description') ||
                                 DOM.description;
        
        if (descriptionField) {
            // Get the current value from the field
            const descriptionValue = descriptionField.value || '';
            
            // CRITICAL: Always remove and re-add to ensure it's included
            // FormData might not include it if the field is empty or has issues
            if (submitFormData.has('message')) {
                submitFormData.delete('message');
            }
            
            // Always append message field - even if empty (Formspree needs it)
            submitFormData.append('message', descriptionValue);
        } else {
            // Fallback: Find all textareas and add the one with name="message"
            const allTextareas = DOM.contactForm.querySelectorAll('textarea');
            
            allTextareas.forEach((ta) => {
                // If this textarea has name="message" or id="description", add it
                if (ta.name === 'message' || ta.id === 'description') {
                    const value = ta.value || '';
                    if (submitFormData.has('message')) {
                        submitFormData.delete('message');
                    }
                    submitFormData.append('message', value);
                }
            });
        }
        
        // Add Formspree-specific fields to improve email delivery and reduce spam detection
        submitFormData.append('_subject', 'New Contact Form Submission from FoundrySuite Website');
        submitFormData.append('_format', 'plain'); // Plain text emails are less likely to be marked as spam
        
        // Set reply-to address to the submitter's email
        const emailField = DOM.contactForm.querySelector('[name="email"]');
        if (emailField && emailField.value) {
            submitFormData.append('_replyto', emailField.value);
        }
        
        // Show loading state
        const submitButton = DOM.contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
        }
        
        // FormData is ready for submission
        
        fetch(DOM.contactForm.action, {
            method: 'POST',
            body: submitFormData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            // Check if response is ok
            if (response.ok) {
                // Try to get response data
                return response.json().then(data => {
                    // Success - show modal and reset form
                    showSuccessModal();
                    
                    // Reset form - this should clear all fields
                    DOM.contactForm.reset();
                    
                    // Explicitly clear description field (name="message") FIRST to ensure it's cleared
                    const descriptionField = DOM.contactForm.querySelector('[name="message"]');
                    if (descriptionField) {
                        descriptionField.value = '';
                        descriptionField.textContent = ''; // Also clear textContent for textarea
                    }
                    
                    // Also clear description field by ID as backup
                    if (DOM.description) {
                        DOM.description.value = '';
                        DOM.description.textContent = '';
                    }
                    
                    // Explicitly clear all form fields to ensure they're all reset
                    FORM_FIELDS.forEach(fieldId => {
                        const field = getElement(fieldId);
                        if (field) {
                            if (field.tagName === 'TEXTAREA') {
                                field.value = '';
                                field.textContent = ''; // Clear textContent for textarea
                            } else {
                                field.value = '';
                            }
                            field.classList.remove('error');
                        }
                    });
                    
                    // Clear phone code display if it exists
                    if (DOM.phoneCodeDisplay) {
                        DOM.phoneCodeDisplay.textContent = '';
                    }
                    if (DOM.phoneFlagDisplay) {
                        DOM.phoneFlagDisplay.textContent = '';
                    }
                    
                    clearAllErrors();
                    
                    // Generate new CAPTCHA
                    if (DOM.captchaQuestion && DOM.captchaAnswer) {
                        const captcha = generateCaptcha();
                        DOM.captchaQuestion.textContent = captcha.question;
                        DOM.captchaAnswer.value = '';
                    }
                }).catch(() => {
                    // Still show success if status was OK
                    showSuccessModal();
                    
                    // Reset form - this should clear all fields
                    DOM.contactForm.reset();
                    
                    // Explicitly clear description field (name="message") FIRST to ensure it's cleared
                    const descriptionField = DOM.contactForm.querySelector('[name="message"]');
                    if (descriptionField) {
                        descriptionField.value = '';
                        descriptionField.textContent = ''; // Also clear textContent for textarea
                    }
                    
                    // Also clear description field by ID as backup
                    if (DOM.description) {
                        DOM.description.value = '';
                        DOM.description.textContent = '';
                    }
                    
                    // Explicitly clear all form fields to ensure they're all reset
                    FORM_FIELDS.forEach(fieldId => {
                        const field = getElement(fieldId);
                        if (field) {
                            if (field.tagName === 'TEXTAREA') {
                                field.value = '';
                                field.textContent = ''; // Clear textContent for textarea
                            } else {
                                field.value = '';
                            }
                            field.classList.remove('error');
                        }
                    });
                    
                    // Clear phone code display if it exists
                    if (DOM.phoneCodeDisplay) {
                        DOM.phoneCodeDisplay.textContent = '';
                    }
                    if (DOM.phoneFlagDisplay) {
                        DOM.phoneFlagDisplay.textContent = '';
                    }
                    
                    clearAllErrors();
                    
                    if (DOM.captchaQuestion && DOM.captchaAnswer) {
                        const captcha = generateCaptcha();
                        DOM.captchaQuestion.textContent = captcha.question;
                        DOM.captchaAnswer.value = '';
                    }
                });
            } else {
                // If not ok, try to get error message
                return response.json().then(data => {
                    throw new Error(data.error || data.message || 'Form submission failed');
                }).catch(() => {
                    throw new Error('Form submission failed. Status: ' + response.status);
                });
            }
        })
        .catch(error => {
            alert('There was an error submitting your form. Please check your connection and try again.');
        })
        .finally(() => {
            // Restore button state
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
        
        // If validation passes, let Formspree handle the submission
        // Form will submit normally via POST to Formspree endpoint
    });
};

// ============================================================================
// ANIMATIONS
// ============================================================================

/**
 * Initialize intersection observer animations
 */
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

const initAnimations = () => {
    DOM.contactItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(item);
    });
};


// ============================================================================
// THEME TOGGLE
// ============================================================================

const initThemeToggle = () => {
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            const currentTheme = DOM.html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            DOM.html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
};

// ============================================================================
// SLIDESHOW
// ============================================================================

const initSolutionSlideshow = () => {
    if (DOM.slides.length === 0) return;
    
    let currentSlide = 0;
    let slideInterval = null;
    
    const showSlide = (index) => {
        try {
            DOM.slides.forEach(slide => slide.classList.remove('active'));
            if (DOM.indicators) {
                DOM.indicators.forEach(indicator => indicator.classList.remove('active'));
            }
            
            if (DOM.slides[index]) DOM.slides[index].classList.add('active');
            if (DOM.indicators && DOM.indicators[index]) DOM.indicators[index].classList.add('active');
            
            currentSlide = index;
            
            if (DOM.mobileScreens && DOM.mobileScreens.length > 0) {
                const mobileScreenIndex = index % DOM.mobileScreens.length;
                DOM.mobileScreens.forEach((screen, i) => {
                    screen.classList.toggle('active', i === mobileScreenIndex);
                });
            }
        } catch (e) {
            // Silently handle errors
        }
    };
    
    const nextSlide = () => showSlide((currentSlide + 1) % DOM.slides.length);
    const prevSlide = () => showSlide((currentSlide - 1 + DOM.slides.length) % DOM.slides.length);
    
    const startSlideshow = () => {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, SLIDESHOW_INTERVAL);
    };
    
    const stopSlideshow = () => {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    };
    
    if (DOM.nextBtn) {
        DOM.nextBtn.addEventListener('click', () => {
            stopSlideshow();
            nextSlide();
            startSlideshow();
        });
    }
    
    if (DOM.prevBtn) {
        DOM.prevBtn.addEventListener('click', () => {
            stopSlideshow();
            prevSlide();
            startSlideshow();
        });
    }
    
    DOM.indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            stopSlideshow();
            showSlide(index);
            startSlideshow();
        });
    });
    
    if (DOM.slideshow) {
        DOM.slideshow.addEventListener('mouseenter', stopSlideshow);
        DOM.slideshow.addEventListener('mouseleave', startSlideshow);
    }
    
    startSlideshow();
};

// ============================================================================
// SEASONAL CONTENT
// ============================================================================

const removeSeasonalContent = () => {
    const ENABLE_SEASONAL_REMOVAL = false;
    if (!ENABLE_SEASONAL_REMOVAL) return;
    
    const removalDate = new Date('2030-01-07');
    const currentDate = new Date();
    
    if (currentDate >= removalDate) {
        const elements = [
            '.hero-video-bg',
            '.hero-video-overlay',
            '.login-video-bg',
            '.login-video-overlay',
            '.solution-slide[data-solution="christmas"]',
            '.login-christmas-image'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) element.remove();
        });
    }
};


// ============================================================================
// COPYRIGHT YEAR UPDATE
// ============================================================================

/**
 * Update copyright year automatically
 */
const updateCopyrightYear = () => {
    const currentYear = new Date().getFullYear();
    const copyrightYearElements = document.querySelectorAll('#copyright-year');
    
    copyrightYearElements.forEach(element => {
        element.textContent = currentYear;
    });
};

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

const initPageState = () => {
    updateNavbarScroll();
    updateActiveNavLink();
    
    if (DOM.navMenu && DOM.navToggle) {
        DOM.navMenu.classList.remove('active');
        DOM.navToggle.classList.remove('active');
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    removeSeasonalContent();
    updateCopyrightYear();
    initAnimations();
    initSolutionSlideshow();
    setCustomValidationMessages();
    initFormSubmission();
    initPageState();
    initSmoothScroll();
    initMobileNav();
    initPhoneCodeSelection();
    initPhoneCodeDisplay();
    initPhoneInput();
    initCaptcha();
    initSuccessModal();
    initThemeToggle();
    
    setTimeout(() => {
        updateNavbarScroll();
        updateActiveNavLink();
    }, 50);
});

window.addEventListener('load', () => {
    updateNavbarScroll();
    updateActiveNavLink();
    
    if (savedHash || window.location.hash) {
        setTimeout(() => {
            handleHashNavigation(false);
        }, 300);
    }
});

// Initialize scroll listeners
if (DOM.navbar) {
    updateNavbarScroll();
    window.addEventListener('scroll', updateNavbarScroll);
}

window.addEventListener('scroll', updateActiveNavLink);
