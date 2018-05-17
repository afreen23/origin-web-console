import * as React from 'react';
import * as _ from 'lodash-es';

import { LoadingBox, LoadingInline, Dropdown, ResourceIcon } from './utils';
import { Terminal } from './terminal';
import { WSFactory } from '../module/ws-factory';
import { resourceURL } from '../module/k8s';
import { PodModel } from '../models';


const nameWithIcon = (name) => <span><span className="co-icon-space-r"><ResourceIcon kind="Container" /></span>{name}</span>;

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

export class PodExec extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      containers: [],
      activeContainer: _.get(props, 'obj.spec.containers[0].name'),
    };
    this.terminal = React.createRef();
    this.onResize = (rows, cols) => this.onResize_(rows, cols);
    this.onData = d => this.onData_(d);
    this.onChangeContainer = index => this.onChangeContainer_(index);
  }

  connect_ () {
    const { metadata } = this.props.obj;
    const { activeContainer } = this.state;

    const params = {
      ns: metadata.namespace,
      name: metadata.name,
      path: 'exec',
      queryParams: {
        stdout: 1,
        stdin: 1,
        stderr: 1,
        tty: 1,
        container: activeContainer,
        command: ['/bin/sh', '-i', '-c', 'TERM=xterm /bin/sh'].map(c => encodeURIComponent(c)).join('&command='),
      },
    };

    if (this.ws) {
      this.ws.destroy();
      const { current } = this.terminal;
      current && current.onConnectionClosed(`connecting to ${activeContainer}`);
    }

    this.ws = new WSFactory(`${metadata.name}-terminal`, {
      host: 'auto',
      reconnect: true,
      path: resourceURL(PodModel, params),
      jsonParse: false,
      subProtocols: ['base64.channel.k8s.io'],
    })
      .onmessage(raw => {
        const data = atob(raw.slice(1));
        const { current } = this.terminal;
        current && current.onDataReceived(data);
      })
      .onopen(() => {
        const { current } = this.terminal;
        current && current.reset();

        this.setState({open: true});
      })
      .onclose(evt => {
        this.setState({open: false});
        if (!evt || evt.wasClean === true) {
          return;
        }
        const error = evt.reason || 'WebSocket closed uncleanly.';
        const { current } = this.terminal;
        if (current) {
          current.onConnectionClosed(error);
        }
      })
      .onerror(() => this.setState({error: true}));
  }

  componentDidMount () {
    this.connect_();
  }

  componentWillUnmount () {
    this.ws && this.ws.destroy();
    delete this.ws;
  }

  static getDerivedStateFromProps (nextProps, prevState) {
    const containers = _.get(nextProps.obj, 'spec.containers', []).map(n => n.name);
    if (_.isEqual(containers, prevState.containers)) {
      return null;
    }
    return { containers };
  }

  onChangeContainer_ (index) {
    const name = this.state.containers[index];

    if (!name) {
      // eslint-disable-next-line no-console
      console.warn(`no name, how did that happen? ${index}`);
      return;
    }
    if (name === this.state.activeContainer) {
      return;
    }
    this.setState({activeContainer: name}, () => this.connect_());
  }

  onResize_ (rows, cols) {
    const data = btoa(JSON.stringify({Height: rows, Width: cols}));
    this.ws && this.ws.send(`4${data}`);
  }

  onData_ (data) {
    this.ws && this.ws.send(`0${btoa(data)}`);
  }

  render () {
    const {containers, activeContainer } = this.state;

    return <div>
      <div className="co-m-pane__top-controls">
        <span className="log-container-selector__text">
          Connecting to
        </span>
        <Dropdown className="btn-group" items={_.mapValues(containers, nameWithIcon)} title={nameWithIcon(activeContainer || <LoadingInline />)} onChange={this.onChangeContainer} />
      </div>
      {this.state.open
        ? <Terminal
          onResize={this.onResize}
          onData={this.onData}
          ref={this.terminal}
        />
        : <LoadingBox />
      }
    </div>;
  }
}