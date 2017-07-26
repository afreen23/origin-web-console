import React from 'react';
import classNames from 'classnames';
import { k8sEnum } from '../../module/k8s/enum';

export const ResourceIcon = ({kind, className}) => {
  const k = k8sEnum.Kind[kind];
  const klass = classNames(`co-m-resource-icon co-m-resource-${kind.toLowerCase()}`, className);
  const iconLabel = k && k.abbr ? k.abbr : kind.toUpperCase().slice(0, 2);
  return <span className={klass}>{iconLabel}</span>;
};

export const ResourceName = ({kind, name}) => <span><ResourceIcon kind={kind} /> {name}</span>;