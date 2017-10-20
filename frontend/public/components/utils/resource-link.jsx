import * as React from 'react';
import { Link } from 'react-router-dom';

import {kindObj, ResourceIcon} from './index';

export const resourcePath = (kind, name, namespace = undefined) => {
  const {path} = _.toLower(kind) === 'etcdcluster' ? { path: 'etcdclusters' } : kindObj(kind);
  return path && `/${namespace ? `ns/${namespace}/` : ''}${path}/${name}`;
};

export const resourceObjPath = (obj, kind) => resourcePath(kind, _.get(obj, 'metadata.name'), _.get(obj, 'metadata.namespace'));

/** @type {React.StatelessComponent<{kind: string, name: string, namespace: string, title: string, displayName?: string}>} */
export const ResourceLink = ({kind, name, namespace, title, displayName}) => {
  const path = resourcePath(kind, name, namespace);
  const value = displayName ? displayName : name;

  return (
    <span className="co-resource-link">
      <ResourceIcon kind={kind} />
      {path ? <Link to={`${path}/details`} title={title}>{value}</Link> : <span>{value}</span>}
    </span>
  );
};

ResourceLink.displayName = 'ResourceLink';