import React from 'react';

import ReactDom from 'react-dom';

import App from './App';

require('purecss/build/pure-min.css');

const render = () => {
  const params =
    location.hash ?
      JSON.parse(
        decodeURIComponent(location.hash.slice(1))
      ) : {};

  ReactDom.render(
    <App params={ params } />,
    document.getElementById('root')
  );
};

window.addEventListener('hashchange', () => {
  console.log('hashchange', event);
  render();
});

render();
