import * as THREE from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
import generateSideMeshes from '../lib/meshUtils'
import { lerp } from 'canvas-sketch-util/math'
import { BIOMES } from './Biomes'

export default class Terrain extends THREE.Group {
  #bottomPadding = 2

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
    for (let i = 0, l = vertices.length / 3; i < l; i++) {
      vertices[i * 3 + 1] = this.heightData[i]
    }

    if (this.options.water.enabled === true) {
      this.waterCurve = this.getWaterCurve(geometry)
      this.modifyGeometryForWater(geometry)
    }
    geometry.computeVertexNormals()

    const texture = new THREE.CanvasTexture(
      this.generateTexture(geometry, this.options.bounds.x, this.options.bounds.z)
    )
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping

    const material = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: 0.7,
    })

    this.mesh = new THREE.Mesh(geometry, material)

    this.mesh.castShadow = true
    this.mesh.receiveShadow = true

    this.add(this.mesh)

    const sideMaterial = new THREE.MeshPhysicalMaterial({
      color: BIOMES[this.options.biome.name].terrain.side,
      roughness: 0.6,
    })
    generateSideMeshes(
      this,
      geometry,
      sideMaterial,
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

    const heightScale = (this.options.bounds.y - this.#bottomPadding - 2) / this.options.bounds.y,
      multiplier = this.options.bounds.y / max
    for (let i = 0; i < size; i++) {
      this.heightData[i] =
        ((this.heightData[i] - min) * multiplier -
          this.options.bounds.y * 0.5 +
          this.#bottomPadding) *
        heightScale
    }
  }

  generateTexture(geometry, width, height) {
    var canvas, context, image, imageData

    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    context = canvas.getContext('2d')
    context.fillStyle = '#000'
    context.fillRect(0, 0, width, height)

    image = context.getImageData(0, 0, canvas.width, canvas.height)
    imageData = image.data

    const seedrandom = require('seedrandom'),
      rng = seedrandom(this.options.seed)

    const halfHeight = this.options.bounds.y / 2,
      waterLevel = lerp(-halfHeight, halfHeight, this.options.water.level),
      vertices = geometry.getAttribute('position').array,
      normals = geometry.getAttribute('normal').array,
      ground = BIOMES[this.options.biome.name].terrain.ground
        .clone()
        .add(new THREE.Color(rng() * 0.05, rng() * 0.05, rng() * 0.05)),
      shoreline = BIOMES[this.options.biome.name].terrain.shoreline
        .clone()
        .add(new THREE.Color(rng() * 0.05, rng() * 0.05, rng() * 0.05)),
      cliff = BIOMES[this.options.biome.name].terrain.cliff
        .clone()
        .add(new THREE.Color(rng() * 0.05, rng() * 0.05, rng() * 0.05)),
      underwater = BIOMES[this.options.biome.name].terrain.underwater
        .clone()
        .add(new THREE.Color(rng() * 0.05, rng() * 0.05, rng() * 0.05)),
      upVector = new THREE.Vector3(0, 1, 0),
      minCliffSteepness = 0.15,
      maxCliffSteepness = 0.2

    for (let i = 0, l = vertices.length / 3; i < l; i++) {
      let color = ground.clone(),
        labels = ['ground']
      if (this.options.water.enabled) {
        const height = vertices[i * 3 + 1]
        if (height < waterLevel) {
          color = underwater.clone()
          labels = ['shoreline']
        }
        if (this.options.water.shoreline.enabled === true) {
          const sandMax = this.options.water.shoreline.width + this.options.water.shoreline.falloff
          if (height <= waterLevel - this.options.water.shoreline.width) {
            // UNDERWATER TO SHORELINE
            const t = Math.clamp(height / (waterLevel - height), 0, 1)
            color.lerp(shoreline, t)
          } else if (sandMax > 0.001) {
            if (height <= waterLevel + this.options.water.shoreline.width) {
              // SOLID SHORELINE
              color = shoreline.clone()
              labels = ['shoreline']
            } else if (this.options.water.shoreline.falloff > 0.001) {
              // SHORELINE TO GROUND
              const t = Math.clamp(
                (height - waterLevel - this.options.water.shoreline.width) /
                  this.options.water.shoreline.falloff,
                0,
                1
              )
              color = shoreline.clone().lerp(ground, t)
              if (t <= 0.33) {
                labels = ['shoreline']
              } else if (t <= 0.67) {
                labels.push('shoreline')
              }
            }
          }
        }
      }

      const normal = new THREE.Vector3(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]),
        cliffSteepness = 1 - Math.abs(normal.dot(upVector))
      // 1 = vertical, 0 = horizontal
      if (cliffSteepness > minCliffSteepness) {
        const blend = Math.min(
          1,
          (cliffSteepness - minCliffSteepness) / (maxCliffSteepness - minCliffSteepness)
        )
        color.lerp(cliff, blend)
        if (blend >= 0.67) {
          labels = ['cliff']
        } else if (blend > 0.33) {
          labels.push('cliff')
        }
      }

      if (height < waterLevel) {
        labels.push = ['water']
      }

      imageData[i * 4] = color.r * 255 * (1 - rng() * 0.1)
      imageData[i * 4 + 1] = color.g * 255 * (1 - rng() * 0.1)
      imageData[i * 4 + 2] = color.b * 255 * (1 - rng() * 0.1)

      // Add terrain context labels
      const position = new THREE.Vector2(vertices[i * 3], vertices[i * 3 + 2])
      this.options.contextQuadtree.addLabels(labels, position)
      this.options.contextQuadtree.setColor(color, position)
    }

    context.putImageData(image, 0, 0)

    const canvasScaled = document.createElement('canvas')
    canvasScaled.width = width * 4
    canvasScaled.height = height * 4

    context = canvasScaled.getContext('2d')
    context.scale(4, 4)
    context.drawImage(canvas, 0, 0)

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height)
    imageData = image.data

    // Add some noise
    for (var i = 0, l = imageData.length; i < l; i += 4) {
      var v = ~~((rng() - 0.5) * 8)

      imageData[i] += v
      imageData[i + 1] += v
      imageData[i + 2] += v
    }

    context.putImageData(image, 0, 0)

    return canvasScaled
  }

  modifyGeometryForWater(geometry) {
    const points = this.waterCurve.getPoints(10)
    let vertices = geometry.getAttribute('position').array
    let test = new THREE.Vector3(0, 0, 0),
      target = new THREE.Vector3(0, 0, 0)
    for (let i = 0, l = vertices.length / 3; i < l; i++) {
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
    for (let i = 0; i < vertices.length / 3; i++) {
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
