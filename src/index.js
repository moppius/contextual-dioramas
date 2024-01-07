import WebGLApp from './utils/WebGLApp'
import assets from './utils/AssetManager'
import { Diorama, getDefaultDioramaOptions } from './components/Diorama'
import DioramaControls from './ui/DioramaControls'
import { addScreenshotButton, addRecordButton } from './screenshot-record-buttons'
import { Vector3 } from 'three'

// true if the url has the `?debug` parameter, otherwise false
window.DEBUG = window.location.search.includes('debug')

// grab our canvas
const canvas = document.querySelector('#app')

// setup the WebGLRenderer
const webgl = new WebGLApp({
  canvas,
  alpha: true,
  background: '#ABC',
  backgroundAlpha: 1,
  // show the GUI and FPS if we're in debug mode
  showFps: window.DEBUG,
  gui: window.DEBUG,
  orbitControls: { enabled: true, maxDistance: 250 },
  cameraPosition: new Vector3(30, 20, 60),
  fov: 40,
  near: 1,
  far: 500,
})

// attach it to the window to inspect in the console
if (window.DEBUG) {
  window.webgl = webgl
}

const defaultDioramaOptions = getDefaultDioramaOptions()
// hide canvas
webgl.canvas.style.visibility = 'hidden'

new DioramaControls(webgl, defaultDioramaOptions)

// Hide canvas until assets are loaded
webgl.canvas.style.visibility = 'hidden'

// Load any queued assets
await assets.load({ renderer: webgl.renderer });

const dioramaOptions = {
  diorama: defaultDioramaOptions,
}
webgl.scene.diorama = new Diorama(webgl, dioramaOptions)
webgl.scene.add(webgl.scene.diorama)

// add the save screenshot and save gif buttons
if (window.DEBUG) {
  addScreenshotButton(webgl)
  addRecordButton(webgl)
}

// Rotate camera target slightly below the center
webgl.orbitControls.target.set(0, -defaultDioramaOptions.bounds.y / 5, 0)

// show canvas
webgl.canvas.style.visibility = ''

// start animation loop
webgl.start()
