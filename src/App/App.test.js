import React from 'react';
import { shallow, mount } from 'enzyme';
import { basicReduxStore } from '../reduxStore';
import { Provider } from 'react-redux';

import App from './App';

const errFunc = console.error;
let errMsg = '';

// going to suppress errors ont he full render because react hates the shitty tables needed for email html
// but im going to snap shot the start of the warnings so that if there are actual errors we notice
beforeEach(() => {
  console.error = (...args) => (errMsg = args.slice(0, 3));
});

afterEach(() => {
  errMsg = '';
  console.error = errFunc;
});

it('Renders Purple Signature', () => {
  const tree = mount(
    <Provider store={basicReduxStore}>
      <App />
    </Provider>
  );
  expect(tree).toMatchSnapshot();
  expect(errMsg).toMatchSnapshot();
});

it('Renders Purple support', () => {
  const tree = mount(
    <Provider store={basicReduxStore}>
      <App />
    </Provider>
  );
  tree.find('#telstraPurpleManagedServices').simulate('change');
  expect(tree).toMatchSnapshot();
  expect(errMsg).toMatchSnapshot();
});

it('Renders App', () => {
  const tree = shallow(
    <Provider store={basicReduxStore}>
      <App />
    </Provider>
  );
  expect(tree).toMatchSnapshot();
});
