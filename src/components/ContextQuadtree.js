import * as THREE from 'three'

const MIN_QUAD_SIZE = 2

export default class Quad {
  constructor(webgl, bounds) {
    this.webgl = webgl

    this.bounds = bounds
    this.boundsSize = new THREE.Vector2(0, 0)
    this.bounds.getSize(this.boundsSize)

    this.labels = {}
    this.color = null

    this.topLeft = null
    this.topRight = null
    this.bottomLeft = null
    this.bottomRight = null
  }

  isSmallestAllowedSize() {
    return this.boundsSize.x <= MIN_QUAD_SIZE && this.boundsSize.y <= MIN_QUAD_SIZE
  }

  setColor(color, position) {
    const point = this.getPoint(position)
    if (this.bounds.containsPoint(point) === false) {
      console.warn(`setColor: Bounds did not contain position [${position.x}, ${position.y}]!`)
      return
    }

    if (this.isSmallestAllowedSize() === true) {
      this.color = color
      return
    }

    const halfX = (this.bounds.min.x + this.bounds.max.x) / 2,
      halfY = (this.bounds.min.y + this.bounds.max.y) / 2

    if (halfX >= point.x) {
      // Top left
      if (halfY >= point.y) {
        if (this.topLeft === null) {
          this.topLeft = new Quad(
            this.webgl,
            new THREE.Box2(
              this.bounds.min,
              this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5)
            )
          )
        }
        this.topLeft.setColor(color, point)
      }
      // Bottom left
      else {
        if (this.bottomLeft === null) {
          this.bottomLeft = new Quad(
            this.webgl,
            new THREE.Box2(
              new THREE.Vector2(this.bounds.min.x, (this.bounds.min.y + this.bounds.max.y) / 2),
              new THREE.Vector2((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.max.y)
            )
          )
        }
        this.bottomLeft.setColor(color, point)
      }
    } else {
      // Top right
      if (halfY >= point.y) {
        if (this.topRight === null) {
          this.topRight = new Quad(
            this.webgl,
            new THREE.Box2(
              new THREE.Vector2((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.min.y),
              new THREE.Vector2(this.bounds.max.x, (this.bounds.min.y + this.bounds.max.y) / 2)
            )
          )
        }
        this.topRight.setColor(color, point)
      }
      // Bottom right
      else {
        if (this.bottomRight === null) {
          this.bottomRight = new Quad(
            this.webgl,
            new THREE.Box2(
              this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5),
              this.bounds.max
            )
          )
        }
        this.bottomRight.setColor(color, point)
      }
    }
  }

  getColor(position) {
    const point = this.getPoint(position)
    if (this.bounds.containsPoint(point) === true) {
      if (this.isSmallestAllowedSize() === true) {
        return this.color
      }
      const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
      for (const quad of quads) {
        if (quad !== null && quad.bounds.containsPoint(point) === true) {
          return quad.getColor(point)
        }
      }
    } else {
      console.warn(`getColor: Bounds did not contain position [${point.x}, ${point.y}]!`)
    }

    if (window.DEBUG) {
      this.drawDebug(0xff00ff)
    }

    return null
  }

  getAverageColor(position) {
    // TODO: Make this recursive (fake mip-mapping with a "mip level" parameter)?
    const point = this.getPoint(position)
    const baseColor = this.getColor(point)
    if (baseColor === null) {
      return null
    }

    let r = 0,
      g = 0,
      b = 0,
      numSamples = 0

    const sample = [-1, 0, 1]
    for (const x of sample) {
      for (const y of sample) {
        let color = baseColor
        if (x != 0 && y != 0) {
          const tap = new THREE.Vector2(point.x + MIN_QUAD_SIZE * x, point.y + MIN_QUAD_SIZE * y)
          if (this.bounds.containsPoint(tap) === true) {
            color = this.getColor(tap)
          }
          if (color === null) {
            color = baseColor
          }
        }
        r += color.r
        g += color.g
        b += color.b
        numSamples++
      }
    }

    return new THREE.Color(
      (baseColor.r + r) / numSamples,
      (baseColor.g + g) / numSamples,
      (baseColor.b + b) / numSamples
    )
  }

  addLabels(labels, position) {
    const point = this.getPoint(position)

    if (this.bounds.containsPoint(point) === false) {
      console.warn(`addLabels: Bounds did not contain position [${point.x}, ${point.y}]!`)
      return
    }

    for (const label of labels) {
      if (label in this.labels) {
        this.labels[label] += 1
      } else {
        this.labels[label] = 1
      }
    }

    if (this.isSmallestAllowedSize()) {
      return
    }

    const halfX = (this.bounds.min.x + this.bounds.max.x) / 2,
      halfY = (this.bounds.min.y + this.bounds.max.y) / 2

    if (halfX >= point.x) {
      // Top left
      if (halfY >= point.y) {
        if (this.topLeft === null) {
          this.topLeft = new Quad(
            this.webgl,
            new THREE.Box2(
              this.bounds.min,
              this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5)
            )
          )
        }
        this.topLeft.addLabels(labels, point)
      }
      // Bottom left
      else {
        if (this.bottomLeft === null) {
          this.bottomLeft = new Quad(
            this.webgl,
            new THREE.Box2(
              new THREE.Vector2(this.bounds.min.x, (this.bounds.min.y + this.bounds.max.y) / 2),
              new THREE.Vector2((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.max.y)
            )
          )
        }
        this.bottomLeft.addLabels(labels, point)
      }
    } else {
      // Top right
      if (halfY >= point.y) {
        if (this.topRight === null) {
          this.topRight = new Quad(
            this.webgl,
            new THREE.Box2(
              new THREE.Vector2((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.min.y),
              new THREE.Vector2(this.bounds.max.x, (this.bounds.min.y + this.bounds.max.y) / 2)
            )
          )
        }
        this.topRight.addLabels(labels, point)
      }
      // Bottom right
      else {
        if (this.bottomRight === null) {
          this.bottomRight = new Quad(
            this.webgl,
            new THREE.Box2(
              this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5),
              this.bounds.max
            )
          )
        }
        this.bottomRight.addLabels(labels, point)
      }
    }
  }

  findQuadWithMinLabelDensity(label, minDensity) {
    let density = this.getLabelDensity(label)
    if (density <= 0) {
      return null
    }
    if (density >= minDensity) {
      return this
    }

    if (label in this.labels) {
      let bestQuad = null,
        bestDensity = 0,
        quadDensity = 0
      const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
      quads.forEach((quad) => {
        if (quad !== null) {
          quadDensity = quad.getLabelDensity(label)
          if (quadDensity > bestDensity) {
            bestQuad = quad
            bestDensity = quadDensity
          }
        }
      })
      return bestQuad.findQuadWithMinLabelDensity(label, minDensity)
    }
    return null
  }

  findQuadWithMaxLabelDensity(label, maxDensity) {
    let density = this.getLabelDensity(label)
    if (density <= maxDensity) {
      console.log(`Found quad with density ${density} for ${label}`)
      return this
    }
    console.log(`This one had ${density} for ${label}, looking in children`)

    if (label in this.labels) {
      let bestQuad = null,
        bestDensity = maxDensity,
        quadDensity = 0
      const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
      quads.forEach((quad) => {
        if (quad !== null) {
          quadDensity = quad.getLabelDensity(label)
          if (quadDensity < bestDensity) {
            bestQuad = quad
            bestDensity = quadDensity
          }
        }
      })
      return bestQuad.findQuadWithMaxLabelDensity(label, maxDensity)
    }
    return null
  }

  getLabelDensity(label) {
    if (label in this.labels === true) {
      return this.labels[label] / (this.boundsSize.x * this.boundsSize.y) // TODO: Divide by ratio of 1x1m
    }
    return 0
  }

  hasLabels(labels, requireAll = false) {
    for (const label of labels) {
      const hasLabel = label in this.labels === true
      if (requireAll === true && hasLabel === false) {
        return false
      } else if (requireAll === false && hasLabel === true) {
        return true
      }
    }
    return true
  }

  positionHasLabels(position, labels) {
    if (Array.isArray(labels) === false) {
      return false
    }

    let point = this.getPoint(position)

    if (this.bounds.containsPoint(point) === false || this.hasLabels(labels) === false) {
      return false
    }

    const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
    for (const quad of quads) {
      if (quad !== null && quad.bounds.containsPoint(point)) {
        return quad.positionHasLabels(point, labels)
      }
    }

    return true
  }

  getLabels(position) {
    const point = this.getPoint(position)

    if (this.bounds.containsPoint(point) === false) {
      return []
    }

    if (this.isSmallestAllowedSize() === true) {
      return this.labels
    }

    const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
    for (const quad of quads) {
      if (quad !== null && quad.bounds.containsPoint(point)) {
        return quad.getLabels(point)
      }
    }

    return this.labels
  }

  getPoint(position) {
    if (hasOwnProperty.call(position, 'z')) {
      return new THREE.Vector2(position.x, position.z)
    }
    return position
  }

  drawDebug(color) {
    const box = new THREE.Box3(),
      center = new THREE.Vector3(
        (this.bounds.min.x + this.bounds.max.x) / 2,
        10,
        (this.bounds.min.y + this.bounds.max.y) / 2
      ),
      end = new THREE.Vector3(this.boundsSize.x, 1, this.boundsSize.y)
    box.setFromCenterAndSize(center, end)
    const helper = new THREE.Box3Helper(box, color)
    this.webgl.scene.add(helper)
  }
}
