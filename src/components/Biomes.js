import { Color } from 'three'
import Building from './Building'
import Cactus from './Cactus'
import Rock from './Rock'
import Tree from './Tree'

export const BIOMES = {
  temperate: {
    assets: [Building, Tree, Rock],
    terrain: {
      ground: new Color(0.19, 0.35, 0.11),
      shoreline: new Color(0.41, 0.31, 0.15),
      cliff: new Color(0.28, 0.31, 0.29),
      underwater: new Color(0.05, 0.08, 0.08),
      side: new Color(0.42, 0.37, 0.26),
    },
    water: { color: new Color(0.05, 0.06, 0.04), opacity: 0.83 },
  },
  desert: {
    assets: [Cactus, Rock],
    terrain: {
      ground: new Color(0.44, 0.24, 0.14),
      shoreline: new Color(0.56, 0.37, 0.24),
      cliff: new Color(0.34, 0.19, 0.12),
      underwater: new Color(0.05, 0.08, 0.08),
      side: new Color(0.41, 0.28, 0.21),
    },
    water: { color: new Color(0.08, 0.15, 0.11), opacity: 0.75 },
  },
  arctic: {
    assets: [Tree, Rock],
    terrain: {
      ground: new Color(0.82, 0.84, 0.88),
      shoreline: new Color(0.55, 0.51, 0.47),
      cliff: new Color(0.24, 0.26, 0.26),
      underwater: new Color(0.05, 0.08, 0.08),
      side: new Color(0.31, 0.24, 0.18),
    },
    water: { color: new Color(0.04, 0.05, 0.03), opacity: 0.81 },
  },
}
