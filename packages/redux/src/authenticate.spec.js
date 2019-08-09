import {
  isRequireAuthentication,
  isRequireSignin,
  authenticateUserPure,
  signinSilent
} from "./authenticate";

describe("redux.authenticate", () => {
  it("isRequireAuthentication should return if authentication is required", () => {
    const input = { user: {}, isForce: true };
    expect(isRequireAuthentication(input)).toBe(true);
    input.isForce = false;
    expect(isRequireAuthentication(input)).toBe(false);
    input.isForce = false;
    input.user = null;
    expect(isRequireAuthentication(input)).toBe(true);
  });

  it("isRequireSignin should return if authentication is required", () => {
    const input = { user: {}, isForce: true };
    expect(isRequireSignin(input)).toBe(true);
    input.isForce = false;
    expect(isRequireSignin(input)).toBe(false);
    input.isForce = false;
    input.user = null;
    expect(isRequireSignin(input)).toBe(true);
    input.isForce = false;
    input.user = { expired: true };
    expect(isRequireSignin(input)).toBe(true);
    input.isForce = false;
    input.user = { expired: false };
    expect(isRequireSignin(input)).toBe(false);
  });

  it("authenticateUserPure should call signinRedirect method", async () => {
    const isRequireAuthenticationMock = () => true;
    const mockCallback = jest.fn();
    const signinRedirect = () =>
      new Promise(resolve => {
        mockCallback();
        resolve({});
      });
    const location = { pathname: "/test", search: "user" };
    const userManager = {
      signinRedirect
    };
    const user =  {};
    await authenticateUserPure(isRequireAuthenticationMock)(
      userManager,
      location, 
        user
    )();

    expect(mockCallback.mock.calls).toHaveLength(1);
  });

  it("authenticateUserPure should call signinSilent method", async () => {
    const isRequireAuthenticationMock = () => false;
    const mockRedirectCallback = jest.fn();
    const signinRedirect = () =>
      new Promise(resolve => {
        mockRedirectCallback();
        resolve({});
      });
    const mockSilentCallback = jest.fn();
    const signinSilentMock = () =>
      new Promise(resolve => {
        mockSilentCallback();
        resolve({});
      });
    const location = { pathname: "/test", search: "user" };
    const userManager = {
      signinRedirect,
      signinSilent: signinSilentMock
    };
    const user = { expired: true };
    await authenticateUserPure(isRequireAuthenticationMock)(
      userManager,
      location,
        user
    )();

    expect(mockRedirectCallback.mock.calls).toHaveLength(0);
    expect(mockSilentCallback.mock.calls).toHaveLength(1);
  });

  it("authenticateUserPure should call signinSilent that fail and then signinRedirect method", async () => {
    const isRequireAuthenticationMock = () => false;
    const mockRedirectCallback = jest.fn();
    const signinRedirect = () =>
      new Promise(resolve => {
        mockRedirectCallback();
        resolve({});
      });
    const mockSilentCallback = jest.fn();
    const signinSilentMock = () =>
      new Promise((resolve, reject) => {
        mockSilentCallback();
        reject(new Error("signinSilent fail"));
      });
    const location = { pathname: "/test", search: "user" };
    const userManager = {
      signinRedirect,
      signinSilent: signinSilentMock
    };
    const user = { expired: true };
    await authenticateUserPure(isRequireAuthenticationMock)(
      userManager,
      location,
        user
    )();

    expect(mockRedirectCallback.mock.calls).toHaveLength(1);
    expect(mockSilentCallback.mock.calls).toHaveLength(1);
  });

  it("trySilentAuthenticate should call signinSilent method", async () => {
    const mockCallback = jest.fn();
    const signinSilentInt = () =>
      new Promise(resolve => {
        mockCallback();
        resolve({});
      });

    const getUserManager = () => ({ signinSilent: signinSilentInt });
    await signinSilent(getUserManager)();

    expect(mockCallback.mock.calls).toHaveLength(1);
  });
});
