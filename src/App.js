import React from 'react';

import classNames from 'classnames';

import moment from 'moment';

const MINUTE = 60 * 1000;

const WAIT_TIME = 1 * MINUTE;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { waitTime: WAIT_TIME };
  }

  resetTimer() {
    this.setState({ waitTime: WAIT_TIME });
  }

  tick() {
    setTimeout(() => {
      if (!document.hidden) {
        this.setState({ waitTime: this.state.waitTime - 1000 });
      }

      if (this.state.waitTime > 0) {
        this.tick();
      }
    }, 1000);
  }

  componentWillReceiveProps() {
    this.resetTimer();
  }

  componentDidMount(event) {
    const { params } = this.props;

    this.tick();
  }

  handleAllowClick(time) {
    const { params } = this.props;

    chrome.runtime.sendMessage({
      allow: params.url,
      time: time
    }, (response) => {
      console.log(response);

      if (response.allowed) {
        console.log(params.url);
        window.location = params.url;
      }
    });
  }

  render() {
    const { params } = this.props;

    const timeInMinutes = 5;

    const waitTime = this.state.waitTime;

    if (!params.url) {
      return null;
    }

    return (
      <div style={{ padding: '1em 3em' }}>
        {
          params.lastVisit ?
            <div>
              <p style={{ fontSize: '2em' }}>
                You were here <strong>{ moment(params.lastVisit.timestamp).fromNow() }</strong>
              </p>
            </div>
            :
            null
        }
        <div>
          <button
            style={{ fontSize: '125%' }}
            className={ classNames('pure-button', { 'pure-button-disabled': waitTime > 0 }) }
            onClick={
              () => {
                if (waitTime > 0) {
                  return;
                }

                this.handleAllowClick(timeInMinutes * MINUTE);
              }
            }
          >
            { waitTime > 0 ? `(${waitTime / 1000})` : '' } Allow {params.url} for { timeInMinutes } minutes
          </button>
        </div>
      </div>
    );
  }
}

export default App;
