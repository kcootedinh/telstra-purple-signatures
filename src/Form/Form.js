import React, { Component } from 'react';
import { omit, mapValues } from 'lodash/object';
import { camelCase } from 'lodash/string';
import { UserAgentApplication } from 'msal/lib-es6';
import { entries } from 'lodash/object';

import './Form.scss';
import constants from '../constants';
import SignatureContainer from '../SignatureContainer';

const MicrosoftGraph = require('@microsoft/microsoft-graph-client');
const { applicationConfig } = constants;

const authCallback = (errorDesc, token, error) => {
  if (token) {
  } else {
    console.error(error + ':' + errorDesc);
  }
};

const userAgentApplication = new UserAgentApplication(
  applicationConfig.clientID,
  null,
  authCallback
);

const login = async () => {
  const graphScopes = ['user.read'];
  try {
    let accessToken = null;
    try {
      accessToken = await userAgentApplication.acquireTokenSilent(graphScopes);
    } catch (error) {
      await userAgentApplication.loginPopup(graphScopes);
      accessToken = await userAgentApplication.acquireTokenSilent(graphScopes);
    }
    return accessToken;
  } catch (error) {
    console.error(error);
  }
};

class Form extends Component {
  static labels = {
    signatureTypes: 'Signature Type',
    name: 'Your Name:',
    title: 'Job Title:',
    email: 'Email:',
    phone: 'Phone: (Optional)',
    mobile: 'Mobile:',
    twitter: 'Twitter: (Optional)',
    qualifications: 'Qualifications: (Optional)'
  };

  constructor() {
    super();
    this.state = {
      sigType: false,
      inputs: {
        signatureTypes: {
          text: [
            { text: 'Readify', checked: true, type: 'readify' },
            { text: 'Readify Support', checked: false, type: 'support' },
            { text: 'BTS Digital', checked: false, type: 'bts' }
          ].filter(Boolean),
          order: 1
        },
        name: { text: '', order: 2 },
        title: { text: '', order: 3 },
        qualifications: { text: '', order: 4 },
        mobile: { text: '', order: 5 },
        email: { text: '', order: 6 },
        twitter: { text: '', order: 7 }
      }
    };
  }

  componentDidMount() {
    login().then(token => {
      if (token === null) return null;
      const client = MicrosoftGraph.Client.init({
        authProvider: done => {
          done(null, token);
        }
      });
      client
        .api('/me')
        .get()
        .then(
          res => {
            const {
              displayName: name,
              jobTitle: title,
              mail: email,
              mobilePhone: mobile
            } = res;
            const inputs = entries({ name, title, email, mobile }).reduce(
              (inputs, item) =>
                Object.assign(inputs, {
                  [item[0]]: {
                    text: item[1],
                    order: this.state.inputs[item[0]].order
                  }
                }),
              {}
            );
            this.setState({
              inputs: { ...this.state.inputs, ...inputs }
            });
          },
          err => {
            console.log(err);
            return null;
          }
        );
    });
  }

  handleChange = (name, value) => {
    let inputs = this.state.inputs;
    const newState = {
      ...inputs,
      [name]: { text: value, order: inputs[name].order }
    };
    this.setState({ inputs: newState });
  };

  handleRadioChange = index => {
    const signatureTypes = this.state.inputs.signatureTypes;
    const newSignatureTypes = signatureTypes.text.map((sigObj, sigIndex) => ({
      ...sigObj,
      ...(sigIndex === index ? { checked: true } : { checked: false })
    }));
    const sigType = newSignatureTypes[index].type;

    const baseInputs =
      sigType === 'bts'
        ? {
            phone: {
              text: '',
              order: 4.5
            },
            ...this.state.inputs
          }
        : omit(this.state.inputs, ['phone']);
    this.setState({
      inputs: {
        ...baseInputs,
        signatureTypes: { ...signatureTypes, text: newSignatureTypes }
      },
      sigType: sigType
    });
  };

  inputHtml = (inputName, inputVal, placeholders) => {
    if (inputName === 'signatureTypes') {
      return (
        <div className="field is-narrow">
          <div className="control">
            {inputVal.map((inputObj, index) => {
              return (
                <label className="radio" key={index}>
                  <input
                    className="radioInput"
                    type="radio"
                    name="signatureTypeOpt"
                    onChange={() => this.handleRadioChange(index)}
                    checked={inputObj.checked}
                    id={camelCase(inputObj.text)}
                  />
                  {inputObj.text}
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    return (
      <input
        className="input"
        placeholder={placeholders[inputName]}
        style={{ width: '300px' }}
        value={inputVal || ''}
        onChange={e => this.handleChange(inputName, e.target.value)}
      />
    );
  };

  renderHtmlForInputs = (formInputs, placeholders) => {
    return Object.entries(formInputs)
      .sort((a, b) => a[1].order - b[1].order)
      .map(obj => ({ key: obj[0], ...omit(obj[1], 'order') }))
      .map(inputObj => {
        const inputName = inputObj.key;
        return (
          <div className="field is-horizontal" key={inputName}>
            <div className="field-label is-normal">
              <label className="label field-label">
                {Form.labels[inputName]}
              </label>
            </div>
            <div className="field-body">
              <div className="control" key={inputName}>
                {this.inputHtml(inputName, inputObj.text, placeholders)}
              </div>
            </div>
          </div>
        );
      });
  };

  render() {
    const placeholders =
      constants[this.state.sigType === 'bts' ? 'btsDigital' : 'readify']
        .placeholders;
    const formInputs = this.state.inputs;

    const inputs = this.renderHtmlForInputs(formInputs, placeholders);

    const SignatureContainerProps = {
      placeholders,
      sigType: this.state.sigType,
      ...omit(mapValues(this.state.inputs, 'text'), 'signatureType')
    };

    return (
      <form>
        {inputs}
        <hr />
        <SignatureContainer {...SignatureContainerProps} />
      </form>
    );
  }
}

export default Form;
