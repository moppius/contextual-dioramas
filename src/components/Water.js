import * as THREE from 'three'
import generateSideMeshes from '../lib/meshUtils'

export default class Water extends THREE.Group {
  constructor(webgl, options, waterCurve) {
    super(options)

    this.type = 'WaterMesh'

    this.webgl = webgl
    this.options = options
    this.waterCurve = waterCurve

    this.generateMesh()

    const seedrandom = require('seedrandom')
    this.rng = seedrandom(this.options.seed)
    const rx = this.rng() * 0.1,
      ry = this.rng() * 0.1,
      rz = this.rng() * 0.1,
      color = new THREE.Color(0.1 + rx, 0.15 + ry, 0.2 + rz),
      material = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
      }),
      geometry = this.generateMesh()

    this.mesh = new THREE.Mesh(geometry, material)

    this.mesh.castShadow = false
    this.mesh.receiveShadow = false

    this.add(this.mesh)

    generateSideMeshes(this, geometry, material, 1, 1, -this.options.bounds.y / 2)
  }

  generateMesh() {
    const geometry = new THREE.PlaneBufferGeometry(
      this.options.bounds.x,
      this.options.bounds.z,
      1,
      1
    )
    geometry.rotateX(-Math.PI / 2)

    const points = this.waterCurve.getPoints(10)
    let vertices = geometry.getAttribute('position').array
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
      vertices[j] *= 0.999
      vertices[j + 1] = points[0].y + 1
      vertices[j + 2] *= 0.999
    }

    return geometry
  }
}
