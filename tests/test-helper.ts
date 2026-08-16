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
// window `error` event, which QUnit otherwise treats as a test failure.
// `QUnit` is an ES module namespace object here, so its exports are
// frozen bindings; filtering has to happen at the DOM event, registered
// before `qunitStart()` below installs QUnit's own listener so this one
// runs first and can stop propagation.
window.addEventListener(
  'error',
  (event) => {
    if (event.message?.includes('ResizeObserver loop')) {
      event.stopImmediatePropagation();
    }
  },
  true,
);

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
}
