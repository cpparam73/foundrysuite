/**
 * Apply saved theme before paint to avoid a light/dark flash.
 * Load synchronously in <head> (no defer/async).
 */
(function () {
    var savedTheme = localStorage.getItem('theme');
    var theme = savedTheme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
})();
