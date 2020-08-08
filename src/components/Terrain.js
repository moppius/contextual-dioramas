import * as THREE from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
import generateSideMeshes from '../lib/meshUtils'
import { lerp } from 'canvas-sketch-util/math'

export default class Terrain extends THREE.Group {
  constructor(webgl, options) {
    super(options)

    this.type = 'Terrain'

    this.webgl = webgl
    this.options = options

    this.generateHeight(this.options.bounds.x, this.options.bounds.z)

    const geometry = new THREE.PlaneBufferGeometry(
      this.options.bounds.x,
      this.options.bounds.z,
      this.options.bounds.x - 1,
      this.options.bounds.z - 1
    )
    geometry.rotateX(-Math.PI / 2)

    let vertices = geometry.getAttribute('position').array
    for (let i = 0, l = vertices.length; i < l; i++) {
      vertices[i * 3 + 1] = this.heightData[i]
    }

    if (this.options.water.enabled === true) {
      this.waterCurve = this.getWaterCurve(geometry)
      this.modifyGeometryForWater(geometry)
    }
    geometry.computeVertexNormals()

    const seedrandom = require('seedrandom')
    this.rng = seedrandom(this.options.seed)
    const rx = this.rng() * 0.1,
      ry = this.rng() * 0.1,
      rz = this.rng() * 0.1,
      color = new THREE.Color(0.1 + rx, 0.4 + ry, 0.2 + rz)
    const material = new THREE.MeshStandardMaterial({ color: color })

    this.mesh = new THREE.Mesh(geometry, material)

    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    this.add(this.mesh)

    generateSideMeshes(
      this,
      geometry,
      material,
      this.options.bounds.x - 1,
      this.options.bounds.z - 1,
      -this.options.bounds.y / 2
    )
  }

  generateHeight(width, height) {
    let size = width * height,
      perlin = new ImprovedNoise(),
      quality = 1,
      seedrandom = require('seedrandom'),
      rng = seedrandom(this.options.seed),
      z = rng()

    this.heightData = new Float32Array(size)

    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < size; i++) {
        let x = i % width,
          y = ~~(i / width)
        this.heightData[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75)
      }

      quality *= 5
    }

    // Normalize height
    let min = 10000,
      max = -10000
    for (let i = 0; i < size; i++) {
      if (this.heightData[i] < min) {
        min = this.heightData[i]
      }
      if (this.heightData[i] > max) {
        max = this.heightData[i]
      }
    }

    const bottomPadding = 2,
      heightScale = (this.options.bounds.y - bottomPadding - 2) / this.options.bounds.y
    const multiplier = this.options.bounds.y / max
    for (let i = 0; i < size; i++) {
      this.heightData[i] =
        ((this.heightData[i] - min) * multiplier - this.options.bounds.y * 0.5 + bottomPadding) *
        heightScale
    }
  }

  modifyGeometryForWater(geometry) {
    const points = this.waterCurve.getPoints(10)
    let vertices = geometry.getAttribute('position').array
    let test = new THREE.Vector3(0, 0, 0),
      target = new THREE.Vector3(0, 0, 0)
    for (let i = 0, l = vertices.length; i < l; i++) {
      const vertex = new THREE.Vector3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2])
      const vertex2D = new THREE.Vector2(vertex.x, vertex.z)
      let closest = 100000
      for (let p = 0; p < points.length - 1; p++) {
        const line = new THREE.Line3(points[p], points[p + 1])
        line.closestPointToPoint(vertex, true, test)
        let distance = vertex2D.distanceTo(new THREE.Vector2(test.x, test.z))
        if (distance < closest) {
          closest = distance
          target = test.clone()
        }
      }
      const distance = vertex2D.distanceTo(new THREE.Vector2(target.x, target.z))
      if (distance < this.options.water.width / 2 + this.options.water.falloff) {
        vertices[i * 3 + 1] = this.getWaterVertexHeight(distance, target.y, vertices[i * 3 + 1])
      }
    }
  }

  getWaterVertexHeight(distance, target, current) {
    const t = Math.clamp(
      (distance - this.options.water.width / 2) / this.options.water.falloff,
      0,
      1
    )
    const calculated = lerp(target - this.options.water.depth, current, t)
    const lowest = -this.options.bounds.y / 2 + 1
    return Math.max(lowest, calculated)
  }

  getRandomPointOnTerrain() {
    const raycaster = new THREE.Raycaster()
    let position = new THREE.Vector3(this.rng(), 0, this.rng())
    position.multiply(this.options.bounds)
    position.y = this.options.bounds.y
    position.sub(new THREE.Vector3(0.5, 0.5, 0.5).multiply(this.options.bounds))
    raycaster.set(position, new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObject(this.mesh)
    if (intersects.length > 0) {
      return { hit: true, position: intersects[0].point }
    }
    return { hit: false, position: null }
  }

  getWaterCurve(geometry) {
    var points = [new THREE.Vector3(0, 100000, 0), new THREE.Vector3(0, 100000, 0)],
      tempVec = new THREE.Vector3()
    const vertices = geometry.getAttribute('position').array,
      minDist = Math.min(this.options.bounds.x, this.options.bounds.z) / 4
    for (let i = 0; i < vertices.length; i++) {
      for (let j = 0; j < points.length; j++) {
        tempVec.x = vertices[i * 3]
        tempVec.y = vertices[i * 3 + 1]
        tempVec.z = vertices[i * 3 + 2]
        if (tempVec.y < points[j].y) {
          if (j == 0 || tempVec.distanceTo(points[j - 1]) > minDist) {
            points[j].x = tempVec.x
            points[j].y = tempVec.y
            points[j].z = tempVec.z
            break
          }
        }
      }
    }

    const xTest = this.options.bounds.x / 2,
      zTest = this.options.bounds.z / 2
    const line = new THREE.Line3(
      points[0].clone().add(points[1].clone().sub(points[0]).multiplyScalar(-10)),
      points[0].clone().add(points[1].clone().sub(points[0]).multiplyScalar(10))
    )

    let xPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), zTest)
    let zPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), xTest)

    let endPoint = new THREE.Vector3(0, 0, 0)
    if (
      xPlane.intersectLine(line, endPoint) !== undefined ||
      zPlane.intersectLine(line, endPoint) !== undefined
    ) {
      points[1] = endPoint
    }

    xPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), zTest)
    zPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), xTest)

    let startPoint = new THREE.Vector3(0, 0, 0)
    if (
      xPlane.intersectLine(line, startPoint) !== undefined ||
      zPlane.intersectLine(line, startPoint) !== undefined
    ) {
      points[0] = startPoint
    }

    // Flatten the water
    if (points[0].y > points[1].y) {
      points[0].y = lerp(points[0].y, points[1].y, 0.75)
    } else {
      points[1].y = lerp(points[1].y, points[0].y, 0.75)
    }

    // Don't let the curve go below the floor
    const lowest = -this.options.bounds.y / 2 + 1
    for (let p = 0; p < points.length; p++) {
      points[p].y = Math.max(lowest, points[p].y)
    }

    return new THREE.CatmullRomCurve3([points[0], points[1]])
  }
}