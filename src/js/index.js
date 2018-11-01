(() => {
  // conditionallyRequire('.home-page', () => require('./home-page'));
  // conditionallyRequire('.about-page', () => require('./about-page'));
  // require('./footer');
})();

/**
 * We used to check for the existence of a certain DOM el before executing
 * a page's specific js (from within the module).
 *
 * @param {string} selector - CSS selector of required element
 * @param {function} requireCb - function that contains require call
 * @param {mixed} fallback - return value in case the selector does not exist
 * @return {mixed} either required module or the fallback
 */
function conditionallyRequire(selector, requireCb = noop, fallback = noop) {
  if (document.querySelector(selector)) {
    return requireCb();
  }

  return fallback;
}

function noop() {}
