import * as _ from 'lodash-es';
import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent, history, RequestSizeInput } from '../utils';
import { k8sUpdate } from '../../module/k8s/';
import { PersistentVolumeClaimModel } from '../../models';

//Modal for resource deletion and allows cascading deletes if propagationPolicy is provided for the enum
class ExpandPVCModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this.state = {
      requestSizeUnit: 'Gi',
      requestSizeValue: '',
      dropdownUnits: {
        Mi: 'Mi',
        Gi: 'Gi',
        Ti: 'Ti',
      },
    };
    this._handleRequestSizeInputChange = this._handleRequestSizeInputChange.bind(this);
    this._cancel = this.props.cancel.bind(this);
    this._submit = this._submit.bind(this);
  }

  _handleRequestSizeInputChange(obj) {
    this.setState({ requestSizeValue: obj.value, requestSizeUnit: obj.unit }, this.onChange);
  }

  _submit(event) {
    event.preventDefault();
    const {kind, resource} = this.props;
    const {requestSizeUnit, requestSizeValue} = this.state;

    const updatedPVC = {
      requestSizeValue,
      requestSizeUnit,
    };
    this.handlePromise(k8sUpdate(PersistentVolumeClaimModel,updatedPVC)).then(this.props.close);
  }

  render() {
    const {kind, resource} = this.props;
    const { requestSizeUnit, requestSizeValue, dropdownUnits } =this.state;
    return <form onSubmit={this._submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>Expand {kind.label}</ModalTitle>
      <ModalBody className="modal-body">
        <div className="form-group">
          <p className="lead">Increase the capacity of claim <strong>{resource.metadata.name}.</strong></p>
          <p>This can be a time-consuming process.</p>
        </div>
        <label className="control-label co-required" htmlFor="request-size-input">Size</label>
        <RequestSizeInput
          name="requestSize"
          required={false}
          onChange={this.handleRequestSizeInputChange}
          defaultRequestSizeUnit={requestSizeUnit}
          defaultRequestSizeValue={requestSizeValue}
          dropdownUnits={dropdownUnits}
          describedBy="request-size-help"
        />
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitButtonClass="btn-primary" submitText="Expand" cancel={this._cancel} />
    </form>;
  }
}

export const expandPVCModal = createModalLauncher(ExpandPVCModal);

