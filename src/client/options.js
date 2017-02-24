import React from 'react';

import ReactDom from 'react-dom';

require('purecss/build/pure-min.css');

class Options extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      urls: [],
      input: ''
    };
  }

  componentDidMount() {
    chrome.storage.sync.get({
      urls: [],
    }, (items) => {
      this.setState({ urls: items.urls })
    });
  }

  syncAndSet(obj) {
    chrome.storage.sync.set(obj, () => {
      this.setState(obj);
    });
  }

  onChange(event) {
    this.setState({ input: event.target.value });
  }

  onSubmit(event) {
    event.preventDefault();

    const { input, urls } = this.state;

    const cleanInput = input.trim();

    if (cleanInput) {
      const existingUrl = urls.find(url => url === cleanInput);

      this.syncAndSet({
        urls: this.state.urls.concat(cleanInput)
      });
    }

    this.setState({ input: '' });
  }

  removeUrl(urlToRemove) {
    const { urls } = this.state;

    this.syncAndSet({
      urls: urls.filter(url => url !== urlToRemove)
    });
  }

  render() {
    const { input, urls } = this.state;

    return (
      <ul style={{ listStyle: 'none' }}>
        {
          urls.map((url, index) =>
            <li style={{ marginBottom: 15 }}>
              { url }
              {' '}
              <a
                href="#"
                style={{ textDecoration: 'none' }}
                onClick={ () => this.removeUrl(url) }
              >
                &#x2715;
              </a>
            </li>
          )
        }
        <li>
          <form onSubmit={ this.onSubmit.bind(this) }>
            <input
              onChange={ this.onChange.bind(this) }
              placeholder="Add new site"
              value={ input }
            />

            {
              input ?
                <p>This will block ://{input} and ://www.{input}</p>
                :
                null
            }
          </form>
        </li>
      </ul>
    );
  }
}

ReactDom.render(
  <div>
    <Options />
  </div>,
  document.getElementById('root')
);
