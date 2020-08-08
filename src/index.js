import * as THREE from 'three'
import WebGLApp from './lib/WebGLApp'
import assets from './lib/AssetManager'
import { Diorama, getDefaultDioramaOptions } from './components/Diorama'
import DioramaControls from './ui/DioramaControls'

window.DEBUG = window.location.search.includes('debug')

const canvas = document.querySelector('#app')

const webgl = new WebGLApp({
  canvas,
  alpha: true,
  background: '#222',
  backgroundAlpha: 1,
  showFps: window.DEBUG,
  orbitControls: true,
})

if (window.DEBUG) {
  window.webgl = webgl
}

const defaultDioramaOptions = getDefaultDioramaOptions()

new DioramaControls(webgl, defaultDioramaOptions)

// Hide canvas until assets are loaded
webgl.canvas.style.visibility = 'hidden'

// Load any queued assets
assets.load({ renderer: webgl.renderer }).then(() => {
  webgl.scene.diorama = new Diorama(webgl, { diorama: defaultDioramaOptions })
  webgl.scene.add(webgl.scene.diorama)

  webgl.canvas.style.visibility = ''

  // Rotate camera target slightly below the center
  webgl.orbitControls.target.set(0, -defaultDioramaOptions.bounds.y / 5, 0)

  webgl.start()
  webgl.draw()
})
