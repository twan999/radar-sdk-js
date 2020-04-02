const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);
const { expect } = chai;

import * as Cookie from '../src/cookie';
import * as Http from '../src/http';
import STATUS from '../src/status_codes';

import Context from '../src/context';

describe('Context', () => {
  let getCookieStub;

  const publishableKey = 'mock-publishable-key';

  const latitude = 40.7041895;
  const longitude = -73.9867797;

  beforeEach(() => {
    sinon.stub(Cookie, 'deleteCookie');
    sinon.stub(Cookie, 'setCookie');
    getCookieStub = sinon.stub(Cookie, 'getCookie');
  });

  afterEach(() => {
    Cookie.deleteCookie.restore();
    Cookie.getCookie.restore();
    Cookie.setCookie.restore();
  });

  context('getContextForLocation', () => {
    it('should return a publishable key error if not set', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(null);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      expect(contextCallback).to.be.calledWith(STATUS.ERROR_PUBLISHABLE_KEY);
    });

    it('should throw a server error if invalid JSON is returned in the response', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonErrorResponse = '"invalid_json": true}';
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonErrorResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      expect(contextCallback).to.be.calledWith(STATUS.ERROR_SERVER);

      Http.request.restore();
    });

    it('should return the error from the http request', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onError('http error');
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      expect(contextCallback).to.be.calledWith('http error');

      Http.request.restore();
    });

    it('should succeed', () => {
      getCookieStub.withArgs(Cookie.PUBLISHABLE_KEY).returns(publishableKey);

      const jsonSuccessResponse = '{"context":"matching-context"}'
      const httpRequestSpy = sinon.spy((method, url, body, headers, onSuccess, onError) => {
        onSuccess(jsonSuccessResponse);
      });
      sinon.stub(Http, 'request').callsFake(httpRequestSpy);

      const contextCallback = sinon.spy();
      Context.getContextForLocation({ latitude, longitude }, contextCallback);

      const [method, url, body, headers] = httpRequestSpy.getCall(0).args;
      expect(method).to.equal('GET');
      expect(url).to.equal('https://api.radar.io/v1/context');
      expect(headers).to.deep.equal({
        Authorization: publishableKey,
      });
      expect(body).to.deep.equal({
        coordinates: `${latitude},${longitude}`,
      });

      expect(contextCallback).to.be.calledWith(STATUS.SUCCESS, 'matching-context');

      Http.request.restore();
    });
  });
});
