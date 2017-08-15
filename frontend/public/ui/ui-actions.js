import store from '../redux';
import { history } from '../components/utils/router';
import { isNamespaced } from '../components/utils/link';

const prefixes = [];

export const getActiveNamespace = () => store.getState().UI.get('activeNamespace');

// Most namespaced urls can't move from one namespace to another,
// but happen to have prefixes that can - for example:
//
//   /ns/NS1/pods/MY_POD
//
// MY_POD is in general only associated with ns1, but /ns/$$/pods
// is valid for all values of $$
//
// Only paths with registered namespace friendly prefixes can be
// re-namespaced, so register your prefixes here as you define the
// associated routes.
export const formatNamespaceRoute = (activeNamespace, originalPath) => {
  const match = isNamespaced(originalPath);
  if (match) {
    // The resource is the first URL slug that matches a prefix (e.g. for "/ns/test-ns/jobs/test-job/pods", the resource
    // is "jobs", not "pods")
    const resource = _(prefixes).filter(p => originalPath.indexOf(p) !== -1).minBy(p => originalPath.indexOf(p));
    if (!resource) {
      throw new Error(`Path can't be namespaced: ${originalPath}`);
    }
    originalPath = resource;
  }

  while (originalPath[0] === '/') {
    originalPath = originalPath.substr(1);
  }

  const namespacePrefix = activeNamespace ? `ns/${activeNamespace}/` : 'all-namespaces/';
  return `${namespacePrefix}${originalPath}`;
};

export const registerNamespaceFriendlyPrefix = s => prefixes.push(s);

export const getNamespacedRoute = path => formatNamespaceRoute(getActiveNamespace(), path);

export const types = {
  setActiveNamespace: 'setActiveNamespace',
  setCurrentLocation: 'setCurrentLocation',
  startImpersonate: 'startImpersonate',
  stopImpersonate: 'stopImpersonate',
  sortList: 'sortList',
};

export const UIActions = {
  [types.setCurrentLocation]: (location, ns) => ({location, ns, type: types.setCurrentLocation}),

  [types.setActiveNamespace]: (namespace) => {
    if (namespace) {
      namespace = namespace.trim();
    }

    // make it noop when new active namespace is the same
    // otherwise users will get page refresh and cry about
    // broken direct links and bookmarks
    if (namespace !== getActiveNamespace()) {
      const oldPath = window.location.pathname;
      if (isNamespaced(oldPath)) {
        const location = Object.assign({}, history.getCurrentLocation());
        location.pathname = formatNamespaceRoute(namespace, oldPath);
        history.push(location);
      }
    }

    return {
      type: types.setActiveNamespace,
      value: namespace,
    };
  },

  [types.startImpersonate]: (kind, name) => ({kind, name, type: types.startImpersonate}),

  [types.stopImpersonate]: () => ({type: types.stopImpersonate}),

  [types.sortList]: (listId, field, func, order) => ({listId, field, func, order, type: types.sortList}),
};