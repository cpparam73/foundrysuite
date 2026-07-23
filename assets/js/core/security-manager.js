/**
 * FoundrySuite — Enterprise Website Security Framework
 * --------------------------------------------------------------------------
 * Core platform service for client-side hardening of the static marketing site.
 * Complements (does not replace) server/hosting security headers.
 *
 * Capabilities:
 *  - Clickjacking defense (frame-bust backup)
 *  - External link hardening (noopener noreferrer)
 *  - Mixed-content HTTPS upgrades for same-site assets
 *  - Form input sanitization, length/email/URL validation hooks
 *  - Lightweight bot / abuse throttling + CAPTCHA integration hooks
 *  - Safe DOM helpers (textContent-first, escaped HTML when required)
 *  - User-friendly global error handling (no stack traces in UI)
 *  - Cookie attribute helpers for future authentication
 *
 * Auto-initializes on DOMContentLoaded. Override via:
 *   window.FoundrySecurityConfig = { ... }
 * before this script loads.
 *
 * Server headers (CSP, HSTS, X-Frame-Options, etc.) must be configured
 * at the host — see docs/SECURITY.md.
 */
(function (global) {
    'use strict';

    if (global.__FoundrySecurityInitialized) {
        return;
    }

    // ----------------------------------------------------------------------
    // Configuration
    // ----------------------------------------------------------------------
    const DEFAULT_CONFIG = {
        enableFrameBusting: true,
        hardenExternalLinks: true,
        upgradeMixedContent: true,
        protectForms: true,
        enableBotThrottle: true,
        showSecurityToasts: false,
        maxFieldLength: 5000,
        maxNameLength: 120,
        maxEmailLength: 254,
        maxUrlLength: 2048,
        bot: {
            windowMs: 10000,
            maxEvents: 40,
            maxFormSubmits: 5,
            cooldownMs: 15000
        },
        captcha: {
            enabled: false,
            provider: null, // 'turnstile' | 'hcaptcha' | 'recaptcha' | custom
            verify: null    // async (form) => boolean — set by host app when ready
        },
        trustedFormActions: [
            'https://formspree.io'
        ],
        // Origins that may open in new tabs without stripping target
        sameSiteHosts: [
            'foundrysuite.com',
            'www.foundrysuite.com'
        ]
    };

    const config = Object.assign(
        {},
        DEFAULT_CONFIG,
        global.FoundrySecurityConfig || {},
        {
            bot: Object.assign({}, DEFAULT_CONFIG.bot, (global.FoundrySecurityConfig || {}).bot || {}),
            captcha: Object.assign({}, DEFAULT_CONFIG.captcha, (global.FoundrySecurityConfig || {}).captcha || {})
        }
    );

    global.FoundrySecurityConfig = config;

    // ----------------------------------------------------------------------
    // Utilities
    // ----------------------------------------------------------------------
    const isElement = (node) => node && node.nodeType === 1;

    const escapeHtml = (value) => {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    /**
     * Sanitize plain text for safe insertion (XSS-resistant).
     * Prefer textContent in UI; this returns escaped HTML entities when needed.
     */
    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input == null ? '' : String(input);
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };

    const stripControlChars = (input) => {
        if (typeof input !== 'string') return '';
        // eslint-disable-next-line no-control-regex
        return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    };

    const normalizeWhitespace = (input) => String(input || '').replace(/\s+/g, ' ').trim();

    const validateEmail = (email) => {
        if (!email || typeof email !== 'string') return false;
        const trimmed = email.trim();
        if (trimmed.length > config.maxEmailLength) return false;
        if (trimmed.split('@').length !== 2) return false;
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const [localPart, domain] = trimmed.split('@');
        if (localPart.length > 64 || domain.length > 253) return false;
        return emailRegex.test(trimmed);
    };

    const validateUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim();
        if (trimmed.length > config.maxUrlLength) return false;
        try {
            const parsed = new URL(trimmed, global.location && global.location.href);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch (e) {
            return false;
        }
    };

    const looksLikeScriptInjection = (input) => {
        if (typeof input !== 'string') return false;
        const patterns = [
            /<\s*script\b/i,
            /javascript\s*:/i,
            /on\w+\s*=\s*['"]?/i,
            /<\s*iframe\b/i,
            /<\s*object\b/i,
            /<\s*embed\b/i,
            /data\s*:\s*text\/html/i
        ];
        return patterns.some((re) => re.test(input));
    };

    const detectSqlInjection = (input) => {
        if (typeof input !== 'string') return false;
        // Avoid bare ";" / "#" — common in normal prose; require SQL-like patterns.
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)/gi,
            /(--|\/\*|\*\/)/g,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi
        ];
        return sqlPatterns.some((pattern) => pattern.test(input));
    };

    const setText = (el, text) => {
        if (!isElement(el)) return;
        el.textContent = text == null ? '' : String(text);
    };

    /**
     * Set HTML only after escaping — avoids accidental XSS via innerHTML.
     * For trusted static markup, use dedicated templates instead.
     */
    const setSafeHtml = (el, text) => {
        if (!isElement(el)) return;
        el.innerHTML = escapeHtml(text);
    };

    // ----------------------------------------------------------------------
    // Suspicious activity log (client-side ring buffer — no PII spam)
    // ----------------------------------------------------------------------
    const activityLog = [];
    const MAX_LOG = 50;

    const logSuspicious = (type, detail) => {
        const entry = {
            t: Date.now(),
            type,
            detail: detail ? String(detail).slice(0, 200) : '',
            path: (global.location && global.location.pathname) || ''
        };
        activityLog.push(entry);
        if (activityLog.length > MAX_LOG) activityLog.shift();
        if (global.console && typeof global.console.info === 'function') {
            // Intentionally low-noise; no stack traces
            console.info('[FoundrySecurity]', type);
        }
    };

    // ----------------------------------------------------------------------
    // Bot / abuse throttle
    // ----------------------------------------------------------------------
    const botState = {
        events: [],
        submits: [],
        blockedUntil: 0
    };

    const isThrottled = () => Date.now() < botState.blockedUntil;

    const recordBotEvent = (kind) => {
        if (!config.enableBotThrottle) return { ok: true };

        const now = Date.now();
        if (now < botState.blockedUntil) {
            logSuspicious('throttle-blocked', kind);
            return { ok: false, reason: 'rate_limited' };
        }

        const windowMs = config.bot.windowMs;
        botState.events = botState.events.filter((t) => now - t < windowMs);
        botState.events.push(now);

        if (kind === 'submit') {
            botState.submits = botState.submits.filter((t) => now - t < windowMs);
            botState.submits.push(now);
            if (botState.submits.length > config.bot.maxFormSubmits) {
                botState.blockedUntil = now + config.bot.cooldownMs;
                logSuspicious('form-flood', String(botState.submits.length));
                return { ok: false, reason: 'form_flood' };
            }
        }

        if (botState.events.length > config.bot.maxEvents) {
            botState.blockedUntil = now + config.bot.cooldownMs;
            logSuspicious('event-flood', String(botState.events.length));
            return { ok: false, reason: 'event_flood' };
        }

        return { ok: true };
    };

    /**
     * CAPTCHA hook — returns true when captcha is disabled or verification passes.
     * Host apps can set FoundrySecurityConfig.captcha.verify = async (form) => bool
     */
    const verifyCaptcha = async (form) => {
        if (!config.captcha.enabled) return true;
        if (typeof config.captcha.verify === 'function') {
            try {
                return !!(await config.captcha.verify(form));
            } catch (e) {
                logSuspicious('captcha-error');
                return false;
            }
        }
        // Enabled but not configured — fail closed for submissions
        logSuspicious('captcha-missing');
        return false;
    };

    // ----------------------------------------------------------------------
    // Clickjacking backup (headers remain primary)
    // ----------------------------------------------------------------------
    const initFrameBusting = () => {
        if (!config.enableFrameBusting) return;
        try {
            if (global.top !== global.self) {
                // Allow same-origin framing (admin tools); bust unexpected embeds
                let sameOrigin = false;
                try {
                    sameOrigin = Boolean(global.top.location.hostname === global.location.hostname);
                } catch (e) {
                    sameOrigin = false;
                }
                if (!sameOrigin) {
                    logSuspicious('clickjack-attempt');
                    try {
                        global.top.location = global.location.href;
                    } catch (e2) {
                        document.body.innerHTML = '';
                        setText(document.body, 'This page cannot be displayed in a frame.');
                    }
                }
            }
        } catch (e) {
            /* ignore */
        }
    };

    // ----------------------------------------------------------------------
    // External links
    // ----------------------------------------------------------------------
    const isExternalHref = (href) => {
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }
        try {
            const url = new URL(href, global.location.href);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
            const host = url.hostname.replace(/^www\./, '');
            return !config.sameSiteHosts.some((h) => h.replace(/^www\./, '') === host);
        } catch (e) {
            return false;
        }
    };

    const hardenLink = (anchor) => {
        if (!isElement(anchor) || anchor.tagName !== 'A') return;
        if (anchor.getAttribute('data-sec-link') === '1') return;

        const href = anchor.getAttribute('href') || '';
        const target = (anchor.getAttribute('target') || '').toLowerCase();

        if (target === '_blank' || isExternalHref(href)) {
            const rel = new Set(
                String(anchor.getAttribute('rel') || '')
                    .split(/\s+/)
                    .filter(Boolean)
            );
            rel.add('noopener');
            rel.add('noreferrer');
            anchor.setAttribute('rel', Array.from(rel).join(' '));

            if (isExternalHref(href) && !anchor.getAttribute('target')) {
                // Do not force new tabs; only harden when already external+blank or external
            }
        }

        anchor.setAttribute('data-sec-link', '1');
    };

    const hardenAllLinks = (root) => {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('a[href]').forEach(hardenLink);
        if (isElement(root) && root.tagName === 'A') hardenLink(root);
    };

    // ----------------------------------------------------------------------
    // Mixed content
    // ----------------------------------------------------------------------
    const upgradeMixedContent = () => {
        if (!config.upgradeMixedContent) return;
        if (!global.location || global.location.protocol !== 'https:') return;

        const attrs = [
            ['img', 'src'],
            ['script', 'src'],
            ['link', 'href'],
            ['source', 'src'],
            ['video', 'src'],
            ['audio', 'src'],
            ['iframe', 'src']
        ];

        attrs.forEach(([tag, attr]) => {
            document.querySelectorAll(tag + '[' + attr + '^="http://"]').forEach((el) => {
                const value = el.getAttribute(attr);
                if (!value) return;
                // Only upgrade clear http URLs; leave intentional localhost for local tools
                if (/^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(value)) return;
                el.setAttribute(attr, value.replace(/^http:\/\//i, 'https://'));
                logSuspicious('mixed-content-upgrade', tag);
            });
        });
    };

    // ----------------------------------------------------------------------
    // Forms
    // ----------------------------------------------------------------------
    const sanitizeFormValue = (name, value, field) => {
        let next = stripControlChars(String(value == null ? '' : value));
        const type = ((field && field.type) || '').toLowerCase();
        const max =
            type === 'email' ? config.maxEmailLength
                : type === 'url' ? config.maxUrlLength
                    : /name/i.test(name || '') ? config.maxNameLength
                        : config.maxFieldLength;

        if (next.length > max) {
            next = next.slice(0, max);
        }

        if (type !== 'textarea' && type !== 'password') {
            // Keep intentional newlines only in textareas
            if (type !== 'hidden') {
                next = normalizeWhitespace(next);
            }
        }

        return next;
    };

    const validateField = (field) => {
        if (!field || field.disabled) return { ok: true };
        const type = (field.type || '').toLowerCase();
        const name = field.name || field.id || '';
        const raw = field.value;
        const value = sanitizeFormValue(name, raw, field);

        if (field.required && !String(value).trim()) {
            return { ok: false, message: 'Please complete all required fields.' };
        }

        if (looksLikeScriptInjection(value) || detectSqlInjection(value)) {
            logSuspicious('form-injection', name);
            return { ok: false, message: 'Please remove invalid characters and try again.' };
        }

        if (type === 'email' && value && !validateEmail(value)) {
            return { ok: false, message: 'Please enter a valid email address.' };
        }

        if (type === 'url' && value && !validateUrl(value)) {
            return { ok: false, message: 'Please enter a valid URL.' };
        }

        if (value.length > config.maxFieldLength) {
            return { ok: false, message: 'One or more fields exceed the maximum length.' };
        }

        return { ok: true, value };
    };

    const protectForm = (form) => {
        if (!isElement(form) || form.tagName !== 'FORM') return;
        if (form.getAttribute('data-sec-form') === '1') return;
        form.setAttribute('data-sec-form', '1');

        // Ensure autocomplete hygiene on auth-like forms
        if (/login|signin|auth/i.test(form.id + form.className + (form.getAttribute('action') || ''))) {
            if (!form.getAttribute('autocomplete')) {
                form.setAttribute('autocomplete', 'on');
            }
        }

        form.addEventListener('submit', (event) => {
            // Allow programmatic re-submit after async CAPTCHA passes
            if (form.getAttribute('data-sec-captcha-passed') === '1') {
                form.removeAttribute('data-sec-captcha-passed');
                return;
            }

            const throttle = recordBotEvent('submit');
            if (!throttle.ok) {
                event.preventDefault();
                event.stopPropagation();
                showFriendlyError(form, 'Too many attempts. Please wait a moment and try again.');
                return;
            }

            const fields = form.querySelectorAll('input, textarea, select');
            for (let i = 0; i < fields.length; i += 1) {
                const field = fields[i];
                if (field.type === 'file' || field.type === 'submit' || field.type === 'button' || field.type === 'reset') {
                    continue;
                }
                const result = validateField(field);
                if (!result.ok) {
                    event.preventDefault();
                    event.stopPropagation();
                    showFriendlyError(form, result.message);
                    try { field.focus(); } catch (e) { /* ignore */ }
                    return;
                }
                if (typeof result.value === 'string' && field.type !== 'password') {
                    field.value = result.value;
                }
            }

            // CAPTCHA must preventDefault synchronously — await after submit is too late
            if (!config.captcha.enabled) return;

            event.preventDefault();
            event.stopPropagation();

            verifyCaptcha(form).then((captchaOk) => {
                if (!captchaOk) {
                    showFriendlyError(form, 'Please complete the security check and try again.');
                    return;
                }
                form.setAttribute('data-sec-captcha-passed', '1');
                if (typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                } else {
                    HTMLFormElement.prototype.submit.call(form);
                }
            });
        }, true);
    };

    const protectAllForms = (root) => {
        if (!config.protectForms) return;
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('form').forEach(protectForm);
        if (isElement(root) && root.tagName === 'FORM') protectForm(root);
    };

    const showFriendlyError = (form, message) => {
        // Prefer existing error regions; never dump stack traces
        let banner = form.querySelector('[data-sec-form-error]');
        if (!banner) {
            banner = document.createElement('div');
            banner.setAttribute('data-sec-form-error', '1');
            banner.setAttribute('role', 'alert');
            banner.style.cssText = 'margin:0 0 0.75rem;color:#b91c1c;font-size:0.875rem;';
            form.insertBefore(banner, form.firstChild);
        }
        setText(banner, message || 'Something went wrong. Please try again.');
    };

    // ----------------------------------------------------------------------
    // Cookies (future auth helpers — documentation for server Set-Cookie)
    // ----------------------------------------------------------------------
    const buildSecureCookieString = (name, value, options) => {
        const opts = Object.assign({
            path: '/',
            secure: true,
            sameSite: 'Strict',
            // HttpOnly cannot be set from JavaScript — must be set by the server
            maxAge: null
        }, options || {});

        let cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
        cookie += '; Path=' + (opts.path || '/');
        if (opts.maxAge != null) cookie += '; Max-Age=' + String(opts.maxAge);
        if (opts.secure) cookie += '; Secure';
        if (opts.sameSite) cookie += '; SameSite=' + opts.sameSite;
        return cookie;
    };

    /**
     * Client-settable secure cookie (NOT HttpOnly).
     * Session/auth cookies must be issued by the server with HttpOnly.
     */
    const setClientCookie = (name, value, options) => {
        document.cookie = buildSecureCookieString(name, value, options);
    };

    // ----------------------------------------------------------------------
    // Error handling — no internal leakage in UI
    // ----------------------------------------------------------------------
    const initErrorHandling = () => {
        global.addEventListener('error', (event) => {
            // Swallow noisy resource errors; log type only
            if (event && event.target && event.target !== global) {
                logSuspicious('resource-error', (event.target.tagName || '').toLowerCase());
                return;
            }
            logSuspicious('runtime-error');
            // Do not surface event.error / stack to the page
        });

        global.addEventListener('unhandledrejection', () => {
            logSuspicious('unhandled-rejection');
        });
    };

    // ----------------------------------------------------------------------
    // MutationObserver — future links & forms
    // ----------------------------------------------------------------------
    const startObserver = () => {
        if (!global.MutationObserver) return null;
        const observer = new MutationObserver((mutations) => {
            for (let i = 0; i < mutations.length; i += 1) {
                const mutation = mutations[i];
                if (mutation.type !== 'childList') continue;
                mutation.addedNodes.forEach((node) => {
                    if (!isElement(node)) return;
                    hardenAllLinks(node);
                    protectAllForms(node);
                });
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        return observer;
    };

    // ----------------------------------------------------------------------
    // Public API
    // ----------------------------------------------------------------------
    const FoundrySecurity = {
        config,
        escapeHtml,
        sanitizeInput,
        stripControlChars,
        validateEmail,
        validateUrl,
        looksLikeScriptInjection,
        detectSqlInjection,
        setText,
        setSafeHtml,
        hardenLink,
        protectForm,
        verifyCaptcha,
        recordBotEvent,
        isThrottled,
        logSuspicious,
        getActivityLog: () => activityLog.slice(),
        buildSecureCookieString,
        setClientCookie,
        refresh() {
            hardenAllLinks(document);
            protectAllForms(document);
            upgradeMixedContent();
        },
        init() {
            if (global.__FoundrySecurityInitialized) return FoundrySecurity;
            global.__FoundrySecurityInitialized = true;

            initFrameBusting();
            initErrorHandling();
            hardenAllLinks(document);
            protectAllForms(document);
            upgradeMixedContent();
            startObserver();

            // Lightweight interaction sampling for flood detection (delegated)
            if (config.enableBotThrottle) {
                document.addEventListener('click', () => {
                    recordBotEvent('click');
                }, { passive: true, capture: true });
            }

            return FoundrySecurity;
        }
    };

    // Back-compat bridge for existing script.js Security object consumers
    global.FoundrySecurity = FoundrySecurity;
    global.Security = global.Security || {
        sanitizeInput: FoundrySecurity.sanitizeInput,
        validateEmailSecure: FoundrySecurity.validateEmail,
        detectSQLInjection: FoundrySecurity.detectSqlInjection
    };

    const boot = () => FoundrySecurity.init();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})(typeof window !== 'undefined' ? window : this);
