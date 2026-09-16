/* ============================================================
 * Horizon Race - 赛道数据
 * 指令格式: [type, len, param1, param2]
 *   's'  : 直道            len
 *   'c'  : 弯道            len, 曲率(正=右弯 负=左弯)
 *   'h'  : 坡道            len, 高度变化
 *   'ch' : 弯道+坡道       len, 曲率, 高度变化
 *   'sc' : S型连续弯       len, 强度系数
 * ============================================================ */

const TRACKS = [
  {
    id: 'mushroom',
    name: '蘑菇平原',
    nameEn: 'Mushroom Circuit',
    difficulty: 1,
    laps: 3,
    hazards: ['cone'],
    theme: {
      skyTop: '#4aa8ff', skyBottom: '#bfe8ff',
      hillFar: '#7ec850', hillNear: '#5aad3a',
      grassLight: '#54b83c', grassDark: '#48a832',
      roadLight: '#6b6b74', roadDark: '#63636c',
      rumbleLight: '#e04040', rumbleDark: '#f0f0f0',
      lane: '#f0f0f0', fog: '#bfe8ff',
      bgStyle: 'hills', sun: '#fff3a0',
      sprites: ['tree1', 'tree2', 'bush', 'sign']
    },
    ops: [
      ['s', 80], ['c', 50, 3], ['s', 35], ['c', 50, -3],
      ['h', 30, 25], ['sc', 35, 0.8], ['s', 40],
      ['c', 55, 4], ['h', 35, -40], ['s', 35],
      ['c', 55, -4], ['sc', 35, 0.7], ['s', 65]
    ]
  },
  {
    id: 'coast',
    name: '日落海岸',
    nameEn: 'Sunset Coast',
    difficulty: 1,
    laps: 3,
    hazards: ['cone','oil'],
    theme: {
      skyTop: '#ff9a56', skyBottom: '#ffd9a0',
      hillFar: '#c97b8e', hillNear: '#a05a78',
      grassLight: '#e8cc7a', grassDark: '#dcc06a',
      roadLight: '#7a7280', roadDark: '#726a7a',
      rumbleLight: '#ff7043', rumbleDark: '#ffe0b0',
      lane: '#fff5e0', fog: '#ffd9a0',
      bgStyle: 'sea', sun: '#ff5722',
      sprites: ['palm', 'palm', 'rock', 'umbrella']
    },
    ops: [
      ['s', 50], ['ch', 80, -3, 20], ['c', 50, 5],
      ['s', 25], ['c', 90, -5], ['h', 60, 45],
      ['sc', 100, 1.2], ['c', 60, 4], ['s', 30],
      ['ch', 70, -4, -65], ['c', 55, 3], ['s', 45]
    ]
  },
  {
    id: 'desert',
    name: '烈日沙漠',
    nameEn: 'Dune Drifter',
    difficulty: 2,
    laps: 3,
    hazards: ['cone','barrel','mud'],
    theme: {
      skyTop: '#60c8f8', skyBottom: '#f0e0b0',
      hillFar: '#d8a86a', hillNear: '#c08850',
      grassLight: '#e0b878', grassDark: '#d0a868',
      roadLight: '#8a8078', roadDark: '#827870',
      rumbleLight: '#e0a030', rumbleDark: '#faf0dc',
      lane: '#fdf6e0', fog: '#f0e0b0',
      bgStyle: 'dunes', sun: '#fff0b0',
      sprites: ['cactus', 'cactus', 'rock', 'skull']
    },
    ops: [
      ['s', 35], ['c', 70, 4], ['h', 45, 60],
      ['c', 60, -5], ['h', 45, -30], ['sc', 110, 1.4],
      ['s', 25], ['ch', 80, 5, -30], ['c', 65, -4],
      ['h', 50, 40], ['c', 80, 6], ['h', 40, -40],
      ['s', 35]
    ]
  },
  {
    id: 'snow',
    name: '冰峰滑道',
    nameEn: 'Frost Peak',
    rule: '冰雪路面：转向抓地力较低，入弯要提前减速',
    difficulty: 2,
    laps: 3,
    hazards: ['tire','oil'],
    theme: {
      skyTop: '#88b8e8', skyBottom: '#dceeff',
      hillFar: '#b0cce0', hillNear: '#90aec8',
      grassLight: '#eef4fa', grassDark: '#dce8f2',
      roadLight: '#98a0ac', roadDark: '#9098a4',
      rumbleLight: '#4090e0', rumbleDark: '#ffffff',
      lane: '#ffffff', fog: '#dceeff',
      bgStyle: 'snow', sun: '#ffffff',
      sprites: ['pine', 'pine', 'snowman', 'ice']
    },
    ops: [
      ['h', 60, 80], ['c', 60, -4], ['s', 25],
      ['ch', 90, 4, 40], ['sc', 90, 1.1], ['h', 50, -60],
      ['c', 75, 5], ['s', 20], ['c', 60, -6],
      ['ch', 70, -3, 30], ['h', 60, -90], ['s', 40]
    ]
  },
  {
    id: 'city',
    name: '霓虹都市',
    nameEn: 'Neon City',
    difficulty: 3,
    laps: 3,
    hazards: ['cone','barrel'],
    theme: {
      skyTop: '#0a0a24', skyBottom: '#38246a',
      hillFar: '#241a4a', hillNear: '#181238',
      grassLight: '#2a2a3a', grassDark: '#242434',
      roadLight: '#3c3c48', roadDark: '#34343e',
      rumbleLight: '#ff2ea6', rumbleDark: '#22e0e0',
      lane: '#eaeaff', fog: '#141032',
      bgStyle: 'city', sun: '#ffeb60',
      sprites: ['building', 'lamp', 'lamp', 'billboard']
    },
    ops: [
      ['s', 45], ['c', 55, 5], ['c', 55, -5],
      ['s', 15], ['ch', 70, 4, 25], ['sc', 120, 1.5],
      ['c', 60, -5], ['h', 40, 35], ['c', 70, 6],
      ['h', 40, -35], ['c', 55, -5], ['s', 20],
      ['c', 65, 4], ['s', 30]
    ]
  },
  {
    id: 'volcano',
    name: '火山狂飙',
    nameEn: 'Volcano Rush',
    rule: '热风区：橙色路段会周期性推动车身',
    difficulty: 3,
    laps: 3,
    hazards: ['barrel','mud'],
    theme: {
      skyTop: '#301818', skyBottom: '#883018',
      hillFar: '#582420', hillNear: '#401818',
      grassLight: '#4a3030', grassDark: '#402828',
      roadLight: '#50484a', roadDark: '#484042',
      rumbleLight: '#ff5020', rumbleDark: '#ffb020',
      lane: '#ffd0a0', fog: '#5a2015',
      bgStyle: 'volcano', sun: '#ff7030',
      sprites: ['lavarock', 'deadtree', 'lavarock', 'ember']
    },
    ops: [
      ['s', 30], ['ch', 85, 5, 50], ['c', 60, -6],
      ['h', 55, -70], ['sc', 130, 1.6], ['c', 70, 6],
      ['s', 15], ['ch', 75, -5, 60], ['c', 80, -7],
      ['h', 45, -40], ['c', 60, 5], ['s', 35]
    ]
  },
  {
    id: 'forest',
    name: '迷雾森林',
    nameEn: 'Misty Forest',
    difficulty: 4,
    laps: 3,
    hazards: ['tire','mud'],
    theme: {
      skyTop: '#7ab8a8', skyBottom: '#c8e0c0',
      hillFar: '#4a8868', hillNear: '#387050',
      grassLight: '#3a7848', grassDark: '#326c40',
      roadLight: '#5c5850', roadDark: '#544e48',
      rumbleLight: '#c8a040', rumbleDark: '#e8e0c0',
      lane: '#e8e8d0', fog: '#a8c8b0',
      bgStyle: 'forest', sun: '#f0ffd0',
      sprites: ['tree1', 'tree2', 'mushroom', 'stump']
    },
    ops: [
      ['sc', 100, 1.3], ['c', 70, 5], ['h', 50, 45],
      ['c', 60, -6], ['sc', 110, 1.5], ['ch', 80, 4, -45],
      ['c', 65, -5], ['h', 45, 55], ['c', 75, 7],
      ['h', 50, -55], ['sc', 90, 1.2], ['s', 30]
    ]
  },
  {
    id: 'rainbow',
    name: '彩虹天际',
    nameEn: 'Rainbow Horizon',
    difficulty: 5,
    laps: 3,
    theme: {
      skyTop: '#12082a', skyBottom: '#4a1860',
      hillFar: '#2a1050', hillNear: '#1c0a3a',
      grassLight: '#3a1850', grassDark: '#301240',
      roadLight: '#442466', roadDark: '#3c2058',
      rumbleLight: '#ff4080', rumbleDark: '#40c0ff',
      lane: '#ffe060', fog: '#201040',
      bgStyle: 'rainbow', sun: '#ff80e0',
      sprites: ['star', 'crystal', 'star', 'cloudDeco'],
      rainbowRoad: true
    },
    ops: [
      ['h', 70, 100], ['sc', 140, 1.8], ['c', 70, 7],
      ['ch', 90, -6, 60], ['sc', 150, 2.0], ['c', 65, -7],
      ['h', 60, -80], ['c', 80, 8], ['sc', 120, 1.7],
      ['ch', 80, -5, -80], ['c', 70, 6], ['h', 50, 40],
      ['s', 30]
    ]
  }
];
