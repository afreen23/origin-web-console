import React from 'react';
import classNames from 'classnames';
import TagsInput from 'react-tagsinput';

import * as k8sSelector from '../../module/k8s/selector';
import * as k8sSelectorRequirement from '../../module/k8s/selector-requirement';

export class SelectorInput extends React.Component {
  constructor(props) {
    super(props);
    this.isBasic = !!_.get(this.props.options, 'basic');
    this.state = {
      inputValue: '',
      isInputValid: true,
      tags: this.props.tags,
    };
  }

  static arrayify (obj) {
    return _.map(obj, (v, k) => v ? `${k}=${v}` : k);
  }

  static objectify (arr) {
    const result = {};
    _.each(arr, item => {
      const [key, value = null] = item.split('=');
      result[key] = value;
    });
    return result;
  }

  isTagValid (tag) {
    const requirement = k8sSelectorRequirement.fromString(tag);
    return !!(requirement && (!this.isBasic || requirement.operator === 'Equals'));
  }

  handleInputChange (e) {
    // We track the input field value in state so we can retain the input value when an invalid tag is entered.
    // Otherwise, the default behaviour of TagsInput is to clear the input field.
    this.setState({inputValue: e.target.value, isInputValid: true});
  }

  handleChange (tags, changed) {
    // The way we use TagsInput, there should only ever be one new tag in changed
    const newTag = changed[0];

    if (!this.isTagValid(newTag)) {
      this.setState({isInputValid: false});
      return;
    }

    // Helpers for cleaning up tags by running them through the selector parser
    const cleanSelectorStr = (tag) => k8sSelector.toString(k8sSelector.fromString(tag));
    const cleanTags = (tags) => k8sSelector.split(cleanSelectorStr(tags.join(',')));

    // Clean up the new tag by running it through the selector parser
    const cleanNewTag = cleanSelectorStr(newTag);

    // Is the new tag a duplicate of an already existing tag?
    // Note that TagsInput accepts an onlyUnique property, but we handle this logic ourselves so that we can set a
    // custom error class
    if (_.filter(tags, tag => tag === cleanNewTag).length > 1) {
      this.setState({isInputValid: false});
      return;
    }

    const newTags = cleanTags(tags);
    this.setState({inputValue: '', isInputValid: true, tags: newTags});
    this.props.onChange(newTags);
  }

  render () {
    const {inputValue, isInputValid, tags} = this.state;

    // Keys that add tags: Tab, enter, space, comma
    const addKeys = [9, 13, 32, 188];

    // Backspace deletes tags, but not if there is text being edited in the input field
    const removeKeys = inputValue.length ? [] : [8];

    const inputProps = {
      autoFocus: this.props.autoFocus,
      className: classNames('input', {'invalid-tag': !isInputValid}),
      onChange: this.handleInputChange.bind(this),
      placeholder: 'app=frontend',
      spellCheck: 'false',
      value: inputValue,
    };

    const renderTag = ({tag, key, onRemove, getTagDisplayValue}) => {
      return <span className={classNames('tag-item', this.props.labelClassName)} key={key}>
        {getTagDisplayValue(tag)}&nbsp;
        <a className="remove-button" onClick={() => onRemove(key)}>×</a>
      </span>;
    };

    return <div className="co-m-selector-input">
      <tags-input>
        <TagsInput className="tags" value={tags} addKeys={addKeys} removeKeys={removeKeys} inputProps={inputProps} renderTag={renderTag} onChange={this.handleChange.bind(this)} addOnPaste={true} />
      </tags-input>
    </div>;
  }
}