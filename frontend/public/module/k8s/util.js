import _ from 'lodash';

import {k8sKinds} from './enum';

export const util = {
  getKindEnumById: id => _.find(k8sKinds, {id: id}),

  // Set all named properties of object to null if empty.
  nullifyEmpty: (obj, props) => {
    props.forEach(function(p) {
      if (_.isEmpty(obj[p])) {
        obj[p] = null;
      }
    });
  },

  deleteProps: (obj, fn) => {
    _.forEach(obj, function(val, key) {
      if (fn(val)) {
        delete obj[key];
      }
    });
    return obj;
  },

  deleteNulls: (obj) => {
    util.deleteProps(obj, _.isNull);
    return obj;
  },
};