/**
 * Layer Registry — central coordination point for all Cesium layers.
 * Provides uniform register/retrieve/toggle/cleanup API regardless of
 * whether a layer uses CustomDataSource, GeoJsonDataSource, or Cesium3DTileset.
 */

export function createLayerRegistry() {
  var layers = {};
  var listeners = [];
  var destroyed = false;

  function guardDestroyed() {
    if (destroyed) {
      throw new Error("Registry has been destroyed");
    }
  }

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }
  }

  function register(name, layer) {
    guardDestroyed();
    if (layers[name]) {
      throw new Error('Layer "' + name + '" is already registered');
    }
    if (!layer || typeof layer.destroy !== "function") {
      throw new Error('Layer must have a destroy() method');
    }
    layers[name] = layer;
    notify();
  }

  function unregister(name) {
    guardDestroyed();
    if (!layers[name]) {
      throw new Error('Layer "' + name + '" is not registered');
    }
    layers[name].destroy();
    delete layers[name];
    notify();
  }

  function get(name) {
    if (destroyed) return null;
    return layers[name] || null;
  }

  function getAll() {
    var result = [];
    var keys = Object.keys(layers);
    for (var i = 0; i < keys.length; i++) {
      result.push(layers[keys[i]]);
    }
    return result;
  }

  function setVisible(name, visible) {
    guardDestroyed();
    if (!layers[name]) {
      throw new Error('Layer "' + name + '" is not registered');
    }
    layers[name].dataSource.show = visible;
    notify();
  }

  function isVisible(name) {
    guardDestroyed();
    if (!layers[name]) {
      throw new Error('Layer "' + name + '" is not registered');
    }
    return layers[name].dataSource.show;
  }

  function onChange(callback) {
    listeners.push(callback);
    return function unsubscribe() {
      var idx = listeners.indexOf(callback);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    };
  }

  function destroy() {
    var keys = Object.keys(layers);
    for (var i = 0; i < keys.length; i++) {
      layers[keys[i]].destroy();
    }
    layers = {};
    listeners = [];
    destroyed = true;
  }

  return {
    register: register,
    unregister: unregister,
    get: get,
    getAll: getAll,
    setVisible: setVisible,
    isVisible: isVisible,
    onChange: onChange,
    destroy: destroy,
  };
}
