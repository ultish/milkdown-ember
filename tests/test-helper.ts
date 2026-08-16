import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import { setTesting } from '@embroider/macros';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modules = {
    './router': Router,
    // add any custom services here
    // import.meta.glob('./services/*', { eager: true }),
  };
}

Router.map(function () {});

// Benign browser noise, not a real failure: fires when a ResizeObserver
// callback doesn't finish within one frame, which Crepe's editor chrome
// (block-edit drag handles, table resize) can legitimately trigger under
// fast synthetic test input. Chrome and Firefox both surface it as a
// global error, which QUnit otherwise treats as a test failure.
//
// This has to be a `window.onerror` *property* override, not
// `addEventListener('error', ...)`: the two are separate delivery paths
// for the same browser error-reporting algorithm, and `qunitStart()`
// below installs its own `window.onerror` property (not a listener) to
// report failures, an addEventListener-based filter can't intercept
// that path or stop it from firing. `QUnit.onUncaughtException` looks
// like the "correct" QUnit-level hook for this, but `QUnit` is an ES
// module namespace object here, its exports are frozen bindings, and
// reassigning it throws at runtime. So: filter after qunitStart() has
// installed its own onerror, wrapping it rather than racing to run first.
function installResizeObserverErrorFilter(): void {
  const previousOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (
      typeof message === 'string' &&
      message.includes('ResizeObserver loop')
    ) {
      return true;
    }
    if (!previousOnError) return false;
    return Boolean(
      previousOnError.call(window, message, source, lineno, colno, error),
    );
  };
}

export function start() {
  setTesting(true);
  setApplication(
    TestApp.create({
      autoboot: false,
      rootElement: '#ember-testing',
    }),
  );
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
  installResizeObserverErrorFilter();
}
