/**
 * Sofa3DViewer stub for backward compatibility
 */
class Sofa3DViewer {
  constructor() {}
  setColor() {}
  setConfig() {}
  triggerCleaningDemo(cb) { if (typeof cb === 'function') cb(); }
  onResize() {}
}

window.Sofa3DViewer = Sofa3DViewer;
