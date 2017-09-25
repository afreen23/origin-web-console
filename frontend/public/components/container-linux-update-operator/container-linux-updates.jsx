import * as React from 'react';

import { ContainerLinuxUpdateDetails } from './container-linux-update-details';
import { LoadingInline, MultiFirehose, containerLinuxUpdateOperator, StatusBox } from '../utils';

export const ContainerLinuxUpdates = (props) => {
  const firehoseResources = [
    {
      kind: 'Node',
      isList: true,
      prop: 'nodes'
    },
    {
      kind: 'ConfigMap',
      namespace: 'tectonic-system',
      name: 'tectonic-config',
      prop: 'configMap'

    },
  ];
  return <MultiFirehose resources={firehoseResources}>
    <ContainerLinuxUpdatesWithData {...props} />
  </MultiFirehose>;
};

export const ContainerLinuxUpdatesWithData = (props) => {
  if (props.loadError) {
    return <div className="co-cluster-updates__component">
      <div className="co-cluster-updates__heading--name-wrapper">
        <span className="co-cluster-updates__heading--name">Container Linux</span>
      </div>
      <StatusBox loadError={props.loadError} />
    </div>;
  }
  if (!_.isEmpty(props.nodes.data)) {
    const nodes = props.nodes.data;
    const isOperatorInstalled = containerLinuxUpdateOperator.isOperatorInstalled(nodes[0]);
    const isSandbox = _.includes(_.get(props.configMap.data, 'data.installerPlatform', ''), 'sandbox');
    if (isOperatorInstalled || isSandbox) {
      const nodeListUpdateStatus = containerLinuxUpdateOperator.getNodeListUpdateStatus(nodes);
      return <ContainerLinuxUpdateDetails
        nodeListUpdateStatus={nodeListUpdateStatus}
        isOperatorInstalled={isOperatorInstalled}
        isSandbox={isSandbox}
      />;
    }
    return null;
  }
  return <div className="co-cluster-updates__component text-center"><LoadingInline /></div>;
};