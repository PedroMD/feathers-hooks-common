
/* eslint no-param-reassign: 0 */

/**
 * Get a value from an object using dot notation, e.g. employee.address.city
 *
 * @param {Object} obj - The object containing the value
 * @param {string} path - The path to the value, e.g. employee.address.city
 * @returns {*} The value, or undefined if the path does not exist
 *
 * There is no way to differentiate between non-existent paths and a value of undefined
 */
export const getByDot = (obj, path) => path.split('.').reduce(
  (obj1, part) => (typeof obj1 === 'object' ? obj1[part] : undefined),
  obj
);

/**
 * Set a value in an object using dot notation, e.g. employee.address.city.
 *
 * @param {Object} obj - The object
 * @param {string} path - The path where to place the value, e.g. employee.address.city
 * @param {*} value - The value.
 * @param {boolean} ifDelete - Delete the prop at path if value is undefined.
 * @returns {Object} The modified object.
 *
 * To delete a prop, set value = undefined and ifDelete = true. Note that
 * new empty inner objects will still be created,
 * e.g. setByDot({}, 'a.b.c', undefined, true) will return {a: b: {} }
 */
export function setByDot (obj, path, value, ifDelete) {
  const parts = path.split('.');
  const lastIndex = parts.length - 1;
  return parts.reduce(
    (obj1, part, i) => {
      if (i !== lastIndex) {
        if (!obj1.hasOwnProperty(part) || typeof obj1[part] !== 'object') {
          obj1[part] = {};
        }
        return obj1[part];
      }

      obj1[part] = value;
      if (value === undefined && ifDelete) {
        delete obj1[part];
      }
      return obj1;
    },
    obj
  );
}

/**
 * Restrict the calling hook to a hook type (before, after) and a set of
 * hook methods (find, get, create, update, patch, remove).
 *
 * @param {object} hook object
 * @param {string|null} type permitted. 'before', 'after' or null for either.
 * @param {array|string} methods permitted. find, get, create, update, patch, remove or null for any
 * @param {string} label identifying hook in error messages. optional.
 *
 * Example:
 * const checkContext = require('feathers-hooks-common/utils').checkContext;
 *
 * const includeCreatedAtHook = (options) => {
 *   const fieldName = (options && options.as) ? options.as : 'createdAt';
 *   return (hook) => {
 *     checkContext(hook, 'before', 'create', 'includeCreatedAtHook');
 *     hook.data[fieldName] = new Date());
 *   };
 * },
 *
 * Examples:
 * checkContext(hook, 'before', ['update', 'patch'], 'hookName');
 * checkContext(hook, null, ['update', 'patch']);
 * checkContext(hook, 'before', null, 'hookName');
 * checkContext(hook, 'before');
 */

export function checkContext (hook, type = null, methods = [], label = 'anonymous') {
  if (type && hook.type !== type) {
    throw new Error(`The '${label}' hook can only be used as a '${type}' hook.`);
  }

  if (!methods) { return; }

  const myMethods = Array.isArray(methods) ? methods : [methods]; // safe enough for allowed values

  if (myMethods.length > 0 && myMethods.indexOf(hook.method) === -1) {
    const msg = JSON.stringify(myMethods);
    throw new Error(`The '${label}' hook can only be used on the '${msg}' service method(s).`);
  }
}

/**
 * Return the data items in a hook.
 * hook.data if type=before.
 * hook.result.data if type=after, method=find with pagination.
 * hook.result otherwise if type=after.
 *
 * @param {Object} hook - The hook.
 * @returns {Object|Array.<Object>} The data item or array of data items
 */
export function getItems (hook) {
  const items = hook.type === 'before' ? hook.data : hook.result;
  return items && hook.method === 'find' ? items.data || items : items;
}

/**
 * Replace the data items in a hook. Companion to getItems.
 *
 * @param {Object} hook - The hook.
 * @param {Object|Array.<Object>} items - The data item or array of data items
 *
 * If you update an after find paginated hook with an item rather than an array of items,
 * the hook will have an array consisting of that one item.
 */
export function replaceItems (hook, items) {
  if (hook.type === 'before') {
    hook.data = items;
  } else if (hook.method === 'find' && hook.result && hook.result.data) {
    if (Array.isArray(items)) {
      hook.result.data = items;
      hook.result.total = items.length;
    } else {
      hook.result.data = [items];
      hook.result.total = 1;
    }
  } else {
    hook.result = items;
  }
}
