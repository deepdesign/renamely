// Default themes with curated word banks

import { db } from '../store/db';
import type { Theme, WordBank, Preset } from '../store/db';

// Artistic theme - creative, poetic, aesthetic words
const ARTISTIC_ADJECTIVES: string[] = [
  'soft', 'gentle', 'delicate', 'elegant', 'graceful', 'refined', 'subtle', 'muted',
  'vibrant', 'vivid', 'bold', 'striking', 'dramatic', 'expressive', 'artistic', 'creative',
  'poetic', 'lyrical', 'melodic', 'harmonious', 'serene', 'tranquil', 'peaceful', 'calm',
  'ethereal', 'dreamy', 'mystical', 'enchanting', 'magical', 'whimsical', 'fantastical',
  'romantic', 'passionate', 'intense', 'profound', 'deep', 'rich', 'luscious', 'opulent',
  'minimalist', 'clean', 'crisp', 'precise', 'balanced', 'symmetrical', 'asymmetrical',
  'abstract', 'surreal', 'impressionistic', 'expressionistic', 'cubist', 'modernist',
  'sublime', 'exquisite', 'radiant', 'luminous', 'brilliant', 'sparkling', 'glowing', 'shimmering',
  'velvety', 'silken', 'satin', 'smooth', 'polished', 'glossy', 'lustrous', 'gleaming',
  'wondrous', 'marvelous', 'magnificent', 'splendid', 'gorgeous', 'stunning', 'breathtaking', 'captivating',
  'evocative', 'suggestive', 'allusive', 'symbolic', 'metaphorical', 'allegorical', 'figurative', 'representational',
  'atmospheric', 'moody', 'ambient', 'immersive', 'enveloping', 'pervasive', 'permeating', 'saturating',
  'textured', 'layered', 'dimensional', 'sculptural', 'volumetric', 'tactile', 'sensual', 'tangible',
  'chromatic', 'hue-rich', 'saturated', 'desaturated', 'monochromatic', 'polychromatic', 'variegated', 'multicolored',
  'composed', 'arranged', 'orchestrated', 'curated', 'selected', 'chosen', 'picked', 'gathered',
  'transcendent', 'sublime', 'divine', 'celestial', 'heavenly', 'ethereal', 'otherworldly', 'supernatural',
  'meditative', 'contemplative', 'introspective', 'reflective', 'thoughtful', 'pensive', 'pondering', 'ruminating',
];

const ARTISTIC_NOUNS: string[] = [
  'moonlight', 'sunset', 'dawn', 'twilight', 'breeze', 'whisper', 'sigh', 'breath',
  'silence', 'stillness', 'serenity', 'tranquility', 'peace', 'harmony', 'balance',
  'dream', 'vision', 'fantasy', 'reverie', 'muse', 'inspiration', 'creativity',
  'canvas', 'palette', 'brushstroke', 'composition', 'masterpiece', 'artwork', 'creation',
  'melody', 'symphony', 'harmony', 'rhythm', 'song', 'verse', 'poem', 'stanza',
  'light', 'shadow', 'glow', 'radiance', 'luminance', 'brilliance', 'sparkle', 'glimmer',
  'emotion', 'feeling', 'sentiment', 'mood', 'atmosphere', 'ambiance', 'essence', 'spirit',
  'portrait', 'landscape', 'still-life', 'sculpture', 'statue', 'figure', 'form', 'shape',
  'color', 'hue', 'tint', 'shade', 'tone', 'chroma', 'saturation', 'vibrancy',
  'texture', 'pattern', 'design', 'motif', 'theme', 'style', 'aesthetic', 'beauty',
  'expression', 'gesture', 'movement', 'flow', 'rhythm', 'tempo', 'pace', 'cadence',
  'reflection', 'mirror', 'image', 'echo', 'resonance', 'vibration', 'frequency', 'wave',
  'journey', 'passage', 'transition', 'transformation', 'evolution', 'metamorphosis', 'change', 'shift',
  'memory', 'recollection', 'reminiscence', 'nostalgia', 'longing', 'yearning', 'desire', 'passion',
  'story', 'narrative', 'tale', 'fable', 'myth', 'legend', 'epic', 'saga',
  'metaphor', 'symbol', 'icon', 'sign', 'emblem', 'token', 'representation', 'manifestation',
  'canvas', 'surface', 'medium', 'material', 'substance', 'fabric', 'textile', 'cloth',
  'brush', 'pencil', 'pen', 'tool', 'instrument', 'implement', 'device',
  'gallery', 'studio', 'atelier', 'workshop', 'sanctuary', 'haven', 'retreat', 'refuge',
  'exhibition', 'show', 'display', 'presentation', 'showcase', 'collection', 'assembly', 'gathering',
  'technique', 'method', 'approach', 'style', 'manner', 'way', 'mode', 'fashion',
  'depth', 'perspective', 'dimension', 'scale', 'proportion', 'ratio', 'measure', 'extent',
  'contrast', 'comparison', 'juxtaposition', 'opposition', 'tension', 'conflict', 'drama', 'intensity',
];

// Nature theme - natural, organic, outdoor words
const NATURE_ADJECTIVES: string[] = [
  'wild', 'natural', 'organic', 'pristine', 'untamed', 'raw', 'rugged', 'majestic',
  'ancient', 'timeless', 'enduring', 'eternal', 'evergreen', 'fresh', 'vibrant', 'lush',
  'fertile', 'rich', 'abundant', 'bountiful', 'flourishing', 'thriving', 'blooming', 'blossoming',
  'crisp', 'cool', 'refreshing', 'invigorating', 'energizing', 'revitalizing', 'renewing',
  'tranquil', 'serene', 'peaceful', 'calm', 'gentle', 'soothing', 'healing', 'restorative',
  'verdant', 'emerald', 'jade', 'forest', 'leafy', 'foliage-rich', 'canopied', 'shaded',
  'sunny', 'sunlit', 'sun-drenched', 'golden', 'amber', 'honeyed', 'warm', 'radiant',
  'misty', 'foggy', 'hazy', 'veiled', 'shrouded', 'cloaked', 'wrapped', 'enveloped',
  'flowing', 'cascading', 'tumbling', 'rolling', 'meandering', 'winding', 'curving', 'snaking',
  'crystalline', 'sparkling', 'glistening', 'shimmering', 'glittering', 'twinkling', 'dazzling', 'brilliant',
  'mossy', 'lichen-covered', 'lichenous', 'fungal', 'mushroomy', 'earthy', 'soil-rich', 'humus-filled',
  'rocky', 'stony', 'pebbled', 'bouldered', 'craggy', 'jagged', 'rough', 'uneven',
  'sandy', 'beach-like', 'coastal', 'shoreline', 'tidal', 'marine', 'aquatic', 'watery',
  'windy', 'breezy', 'gusty', 'stormy', 'tempestuous', 'turbulent', 'agitated', 'restless',
  'rainy', 'drizzly', 'moist', 'damp', 'humid', 'saturated', 'waterlogged', 'soaked',
  'snowy', 'frosty', 'icy', 'frozen', 'glacial', 'arctic', 'wintry', 'chilly',
  'autumnal', 'fall-colored', 'rust-colored', 'amber-hued', 'golden', 'bronze', 'copper', 'crimson',
  'spring-like', 'vernal', 'budding', 'sprouting', 'emerging', 'awakening', 'blooming', 'flowering',
];

const NATURE_NOUNS: string[] = [
  'mountain', 'valley', 'peak', 'ridge', 'summit', 'cliff', 'canyon', 'gorge',
  'forest', 'grove', 'woodland', 'meadow', 'field', 'prairie', 'grassland', 'savanna',
  'river', 'stream', 'brook', 'creek', 'waterfall', 'cascade', 'rapids', 'current',
  'ocean', 'sea', 'lake', 'pond', 'bay', 'harbor', 'cove', 'beach', 'shore', 'coast',
  'tree', 'oak', 'pine', 'cedar', 'maple', 'birch', 'willow', 'elm',
  'flower', 'blossom', 'petal', 'bud', 'bloom', 'wildflower', 'rose', 'tulip',
  'bird', 'eagle', 'hawk', 'owl', 'swan', 'heron', 'crane', 'dove',
  'breeze', 'wind', 'gust', 'storm', 'rain', 'mist', 'fog', 'dew',
  'hill', 'knoll', 'mound', 'slope', 'incline', 'decline', 'terrace', 'plateau',
  'cave', 'cavern', 'grotto', 'tunnel', 'passage', 'chamber', 'hollow', 'cavity',
  'volcano', 'crater', 'lava', 'ash', 'magma', 'eruption', 'geyser', 'hot-spring',
  'desert', 'dune', 'sand', 'oasis', 'mirage', 'arid-land', 'wasteland', 'barren-ground',
  'tundra', 'taiga', 'permafrost', 'ice-field', 'glacier', 'iceberg', 'snowfield', 'snow-drift',
  'jungle', 'rainforest', 'canopy', 'undergrowth', 'thicket', 'bush', 'shrub', 'hedge',
  'marsh', 'swamp', 'bog', 'wetland', 'fen', 'mire', 'quagmire', 'morass',
  'reef', 'coral', 'atoll', 'lagoon', 'estuary', 'delta', 'mouth', 'inlet',
  'island', 'isle', 'archipelago', 'peninsula', 'isthmus', 'cape', 'promontory', 'headland',
  'rock', 'stone', 'boulder', 'pebble', 'gravel', 'sandstone', 'limestone', 'granite',
  'crystal', 'gem', 'mineral', 'ore', 'deposit', 'vein', 'seam', 'stratum',
  'leaf', 'branch', 'twig', 'trunk', 'bark', 'root', 'sap', 'resin',
  'fern', 'moss', 'lichen', 'algae', 'fungus', 'mushroom', 'toadstool', 'spore',
  'seed', 'nut', 'acorn', 'cone', 'pod', 'capsule', 'berry', 'fruit',
  'butterfly', 'moth', 'dragonfly', 'bee', 'wasp', 'ant', 'beetle', 'ladybug',
  'deer', 'elk', 'moose', 'caribou', 'reindeer', 'stag', 'doe', 'fawn',
  'wolf', 'fox', 'coyote', 'jackal', 'bear', 'cub', 'grizzly', 'polar-bear',
  'rabbit', 'hare', 'bunny', 'squirrel', 'chipmunk', 'prairie-dog', 'marmot', 'groundhog',
  'fish', 'salmon', 'trout', 'bass', 'pike', 'perch', 'carp', 'catfish',
  'whale', 'dolphin', 'porpoise', 'seal', 'walrus', 'otter', 'beaver', 'muskrat',
  'seagull', 'pelican', 'cormorant', 'tern', 'puffin', 'albatross', 'petrel', 'gannet',
  'sunrise', 'sunset', 'dawn', 'dusk', 'twilight', 'daybreak', 'morning', 'evening',
  'moon', 'crescent', 'full-moon', 'new-moon', 'lunar', 'phase', 'orbit', 'eclipse',
  'star', 'constellation', 'galaxy', 'nebula', 'comet', 'meteor', 'asteroid', 'planet',
  'cloud', 'cumulus', 'stratus', 'cirrus', 'nimbus', 'vapor', 'steam', 'condensation',
  'thunder', 'lightning', 'bolt', 'flash', 'rumble', 'roar', 'crack', 'boom',
  'rainbow', 'arc', 'spectrum', 'prism', 'refraction', 'reflection', 'dispersion', 'scattering',
];

// Urban theme - city, modern, architectural words
const URBAN_ADJECTIVES: string[] = [
  'modern', 'contemporary', 'urban', 'metropolitan', 'cosmopolitan', 'sophisticated', 'refined',
  'architectural', 'structural', 'geometric', 'angular', 'linear', 'symmetrical', 'precise',
  'dynamic', 'energetic', 'vibrant', 'pulsating', 'lively', 'bustling', 'busy', 'active',
  'industrial', 'mechanical', 'technological', 'digital', 'cyber', 'futuristic', 'avant-garde',
  'polished', 'sleek', 'smooth', 'glossy', 'shiny', 'reflective', 'mirrored', 'crystalline',
  'concrete', 'steel', 'metal', 'metallic', 'aluminum', 'chrome', 'silver', 'titanium',
  'glass', 'glazed', 'transparent', 'translucent', 'opaque', 'frosted', 'etched', 'engraved',
  'grid-like', 'modular', 'systematic', 'organized', 'structured', 'methodical', 'coordinated', 'ordered',
  'illuminated', 'lit', 'bright', 'neon-lit', 'fluorescent', 'LED-bright', 'glowing', 'radiant',
  'crowded', 'populated', 'densely-packed', 'congested', 'teeming', 'swarming', 'overflowing', 'packed',
  'noisy', 'loud', 'boisterous', 'clamorous', 'raucous', 'uproarious', 'deafening', 'thunderous',
  'spacious', 'expansive', 'roomy', 'open', 'airy', 'uncluttered', 'unobstructed', 'clear',
  'underground', 'subterranean', 'basement-level', 'below-ground', 'buried', 'sunken', 'recessed', 'hidden',
  'elevated', 'raised', 'high-rise', 'towering', 'soaring', 'sky-high', 'lofty', 'tall',
  'narrow', 'tight', 'constricted', 'cramped', 'confined', 'squeezed', 'compressed', 'compact',
  'wide', 'broad', 'expansive', 'spacious', 'roomy', 'generous', 'ample', 'plentiful',
  'historic', 'vintage', 'retro', 'classic', 'traditional', 'heritage', 'landmark', 'monumental',
];

const URBAN_NOUNS: string[] = [
  'city', 'metropolis', 'urban', 'downtown', 'skyline', 'district', 'quarter',
  'building', 'tower', 'skyscraper', 'high-rise', 'structure', 'architecture', 'facade',
  'street', 'avenue', 'boulevard', 'lane', 'alley', 'pathway', 'sidewalk', 'pavement',
  'bridge', 'overpass', 'viaduct', 'tunnel', 'subway', 'metro', 'station', 'terminal',
  'plaza', 'square', 'park', 'courtyard', 'atrium', 'lobby', 'hall', 'corridor',
  'light', 'neon', 'glow', 'illumination', 'reflection', 'shadow', 'silhouette', 'outline',
  'block', 'intersection', 'crossroad', 'junction', 'corner', 'roundabout', 'traffic-circle', 'rotary',
  'apartment', 'condo', 'loft', 'penthouse', 'studio', 'flat', 'residence', 'dwelling',
  'office', 'workspace', 'suite', 'floor', 'level', 'story', 'storey', 'tier',
  'window', 'glass', 'pane', 'frame', 'sill', 'ledge', 'balcony', 'terrace',
  'door', 'entrance', 'exit', 'entryway', 'foyer', 'vestibule', 'threshold', 'gateway',
  'roof', 'rooftop', 'pinnacle', 'spire', 'dome', 'cupola', 'turret', 'tower-top',
  'wall', 'surface', 'exterior', 'interior', 'partition', 'divider', 'barrier', 'boundary',
  'concrete', 'steel', 'glass', 'metal', 'aluminum', 'chrome', 'titanium', 'composite',
  'pavement', 'asphalt', 'concrete', 'cobblestone', 'brick', 'tile', 'marble', 'granite',
  'traffic', 'vehicle', 'car', 'bus', 'truck', 'taxi', 'cab', 'automobile',
  'pedestrian', 'walker', 'commuter', 'passerby', 'crowd', 'throng', 'multitude', 'mass',
  'sign', 'billboard', 'advertisement', 'poster', 'banner', 'display', 'screen', 'monitor',
  'lamp', 'streetlight', 'lantern', 'fixture', 'bulb', 'led', 'fluorescent', 'halogen',
  'bench', 'seat', 'chair', 'stool', 'furniture', 'fixture', 'installation', 'furnishing',
  'fountain', 'sculpture', 'statue', 'monument', 'memorial', 'plaque', 'marker', 'landmark',
  'subway', 'metro', 'train', 'railway', 'tracks', 'platform', 'tunnel', 'underground',
  'elevator', 'lift', 'escalator', 'stairs', 'steps', 'stairway', 'staircase', 'ramp',
  'parking', 'garage', 'lot', 'space', 'spot', 'stall', 'bay', 'area',
  'construction', 'site', 'scaffolding', 'crane', 'excavator', 'bulldozer', 'equipment', 'machinery',
  'garbage', 'trash', 'waste', 'debris', 'litter', 'rubbish', 'refuse', 'detritus',
  'grate', 'drain', 'manhole', 'cover', 'vent', 'duct', 'pipe', 'conduit',
  'fire-escape', 'ladder', 'rung', 'step', 'platform', 'balcony', 'landing', 'exit',
  'awning', 'canopy', 'overhang', 'eave', 'shelter', 'cover', 'protection', 'shade',
  'graffiti', 'mural', 'art', 'tag', 'writing', 'painting', 'design', 'image',
  'crosswalk', 'zebra-crossing', 'pedestrian-crossing', 'walkway', 'path', 'trail', 'route', 'way',
];

// Adventure theme - bold, exciting, exploration words
const ADVENTURE_ADJECTIVES: string[] = [
  'bold', 'brave', 'courageous', 'daring', 'fearless', 'intrepid', 'adventurous', 'exploratory',
  'exciting', 'thrilling', 'exhilarating', 'electrifying', 'pulsating', 'dynamic', 'energetic',
  'epic', 'grand', 'magnificent', 'heroic', 'legendary', 'mythical', 'fabled', 'immortal',
  'rugged', 'tough', 'resilient', 'enduring', 'unyielding', 'indomitable', 'unstoppable',
  'wild', 'untamed', 'savage', 'ferocious', 'powerful', 'mighty', 'formidable', 'dominant',
  'treacherous', 'perilous', 'dangerous', 'hazardous', 'risky', 'precarious', 'uncertain', 'unpredictable',
  'challenging', 'daunting', 'demanding', 'testing', 'trying', 'arduous', 'strenuous', 'taxing',
  'remote', 'isolated', 'secluded', 'distant', 'far-flung', 'outlying', 'peripheral', 'marginal',
  'uncharted', 'unexplored', 'unknown', 'unmapped', 'undiscovered', 'virgin', 'untouched', 'pristine',
  'mysterious', 'enigmatic', 'puzzling', 'cryptic', 'obscure', 'hidden', 'secret', 'concealed',
  'exotic', 'foreign', 'alien', 'strange', 'unfamiliar', 'unusual', 'uncommon', 'rare',
  'extreme', 'intense', 'severe', 'harsh', 'rigorous', 'strict', 'stern', 'uncompromising',
  'spectacular', 'stunning', 'breathtaking', 'awe-inspiring', 'jaw-dropping', 'mind-blowing', 'incredible', 'unbelievable',
  'pioneering', 'trailblazing', 'groundbreaking', 'innovative', 'revolutionary', 'cutting-edge', 'state-of-the-art', 'advanced',
  'endless', 'infinite', 'boundless', 'limitless', 'unlimited', 'vast', 'immense', 'enormous',
  'unforgettable', 'memorable', 'remarkable', 'notable', 'significant', 'important', 'momentous', 'historic',
];

const ADVENTURE_NOUNS: string[] = [
  'journey', 'quest', 'expedition', 'adventure', 'voyage', 'odyssey', 'pilgrimage', 'trek',
  'explorer', 'adventurer', 'pioneer', 'trailblazer', 'pathfinder', 'scout', 'ranger', 'guide',
  'mountain', 'peak', 'summit', 'cliff', 'canyon', 'ravine', 'chasm', 'abyss',
  'forest', 'jungle', 'wilderness', 'frontier', 'outback', 'terrain', 'landscape', 'vista',
  'treasure', 'artifact', 'relic', 'discovery', 'find', 'revelation', 'secret', 'mystery',
  'challenge', 'obstacle', 'barrier', 'hurdle', 'test', 'trial', 'ordeal', 'quest',
  'trail', 'path', 'track', 'route', 'way', 'course', 'direction', 'bearing',
  'compass', 'map', 'chart', 'guide', 'navigation', 'orientation', 'location', 'position',
  'backpack', 'pack', 'rucksack', 'gear', 'equipment', 'supplies', 'provisions', 'rations',
  'tent', 'shelter', 'camp', 'campsite', 'bivouac', 'encampment', 'base', 'headquarters',
  'fire', 'flame', 'ember', 'spark', 'kindling', 'tinder', 'fuel', 'wood',
  'rope', 'cord', 'line', 'cable', 'chain', 'tether', 'lanyard', 'strap',
  'knife', 'blade', 'tool', 'implement', 'instrument', 'device', 'utensil', 'apparatus',
  'flashlight', 'lantern', 'torch', 'light', 'beam', 'ray', 'glow', 'illumination',
  'water', 'stream', 'spring', 'source', 'well', 'oasis', 'reservoir', 'cistern',
  'food', 'meal', 'ration', 'provision', 'sustenance', 'nourishment', 'nutrition', 'sustenance',
  'backpacker', 'hiker', 'climber', 'mountaineer', 'alpinist', 'trekker', 'walker', 'rambler',
  'cave', 'cavern', 'grotto', 'tunnel', 'passage', 'chamber', 'hollow', 'cavity',
  'river', 'rapid', 'current', 'flow', 'stream', 'waterway', 'channel', 'creek',
  'lake', 'pond', 'pool', 'reservoir', 'basin', 'depression', 'hollow', 'valley',
  'desert', 'dune', 'sand', 'oasis', 'mirage', 'wasteland', 'barren-land', 'arid-zone',
  'jungle', 'rainforest', 'canopy', 'undergrowth', 'thicket', 'bush', 'vegetation', 'foliage',
  'wildlife', 'animal', 'creature', 'beast', 'predator', 'prey', 'fauna', 'species',
  'bird', 'eagle', 'hawk', 'vulture', 'condor', 'falcon', 'kite', 'osprey',
  'snake', 'serpent', 'viper', 'python', 'cobra', 'rattlesnake', 'mamba', 'adder',
  'insect', 'bug', 'beetle', 'ant', 'termite', 'wasp', 'hornet', 'bee',
  'spider', 'scorpion', 'centipede', 'millipede', 'cricket', 'grasshopper', 'locust', 'cicada',
  'discovery', 'find', 'treasure', 'hoard', 'cache', 'stash', 'loot', 'booty',
  'artifact', 'relic', 'antiquity', 'antique', 'curio', 'collectible', 'souvenir', 'memento',
  'ruin', 'ruins', 'remains', 'wreck', 'wreckage', 'debris', 'fragments', 'remnants',
  'ancient', 'old', 'antique', 'vintage', 'antiquated', 'archaic', 'primitive', 'prehistoric',
  'mystery', 'enigma', 'puzzle', 'riddle', 'conundrum', 'secret', 'hidden', 'concealed',
  'legend', 'myth', 'tale', 'story', 'fable', 'folklore', 'tradition', 'lore',
  'danger', 'risk', 'peril', 'hazard', 'threat', 'menace', 'jeopardy', 'pitfall',
  'survival', 'endurance', 'persistence', 'resilience', 'tenacity', 'determination', 'fortitude', 'grit',
  'victory', 'triumph', 'success', 'achievement', 'accomplishment', 'conquest', 'win', 'conquest',
  'defeat', 'failure', 'loss', 'setback', 'reversal', 'disappointment', 'frustration', 'obstacle',
];

// Scientific theme - technical, research-oriented, analytical words
const SCIENTIFIC_ADJECTIVES: string[] = [
  'precise', 'accurate', 'systematic', 'methodical', 'analytical', 'empirical', 'quantitative', 'qualitative',
  'experimental', 'observational', 'theoretical', 'hypothetical', 'structured', 'rigorous', 'meticulous', 'detailed',
  'sophisticated', 'advanced', 'cutting-edge', 'innovative', 'revolutionary', 'groundbreaking', 'pioneering', 'novel',
  'objective', 'neutral', 'unbiased', 'impartial', 'logical', 'rational', 'evidence-based', 'data-driven',
  'complex', 'intricate', 'sophisticated', 'elaborate', 'comprehensive', 'thorough', 'exhaustive', 'complete',
  'atomic', 'molecular', 'cellular', 'microscopic', 'macroscopic', 'quantum', 'nuclear', 'subatomic',
  'crystalline', 'structured', 'organized', 'ordered', 'patterned', 'regular', 'systematic', 'hierarchical',
  'synthetic', 'artificial', 'manufactured', 'engineered', 'designed', 'constructed', 'fabricated', 'produced',
  'natural', 'organic', 'biological', 'living', 'bioactive', 'biodegradable', 'sustainable', 'ecological',
  'elemental', 'fundamental', 'basic', 'primary', 'essential', 'core', 'central', 'key',
  'composite', 'hybrid', 'combined', 'integrated', 'merged', 'fused', 'blended', 'mixed',
  'stable', 'constant', 'steady', 'consistent', 'uniform', 'regular', 'predictable', 'reliable',
  'volatile', 'unstable', 'reactive', 'dynamic', 'changing', 'fluctuating', 'variable', 'inconsistent',
  'transparent', 'clear', 'visible', 'observable', 'detectable', 'measurable', 'quantifiable', 'assessable',
  'opaque', 'hidden', 'concealed', 'obscured', 'masked', 'veiled', 'shrouded', 'cloaked',
  'minute', 'tiny', 'minuscule', 'microscopic', 'nanoscopic', 'infinitesimal', 'negligible', 'imperceptible',
  'massive', 'huge', 'enormous', 'gigantic', 'colossal', 'immense', 'vast', 'titanic',
  'optimized', 'efficient', 'streamlined', 'refined', 'improved', 'enhanced', 'upgraded', 'advanced',
];

const SCIENTIFIC_NOUNS: string[] = [
  'hypothesis', 'theory', 'principle', 'law', 'theorem', 'formula', 'equation', 'algorithm',
  'experiment', 'observation', 'analysis', 'data', 'result', 'finding', 'discovery', 'breakthrough',
  'research', 'study', 'investigation', 'examination', 'inquiry', 'exploration', 'probe', 'survey',
  'laboratory', 'lab', 'facility', 'institute', 'center', 'station', 'observatory', 'workshop',
  'specimen', 'sample', 'artifact', 'evidence', 'proof', 'datum', 'measurement', 'reading',
  'molecule', 'atom', 'particle', 'electron', 'proton', 'neutron', 'photon', 'quantum',
  'reaction', 'process', 'mechanism', 'phenomenon', 'event', 'occurrence', 'incident', 'instance',
  'variable', 'parameter', 'constant', 'factor', 'element', 'component', 'ingredient', 'constituent',
  'spectrum', 'wavelength', 'frequency', 'amplitude', 'oscillation', 'vibration', 'resonance', 'harmony',
  'catalyst', 'enzyme', 'reagent', 'compound', 'solution', 'mixture', 'synthesis', 'reaction',
  'method', 'technique', 'procedure', 'protocol', 'process', 'methodology', 'approach', 'strategy',
  'model', 'simulation', 'representation', 'abstraction', 'concept', 'framework', 'structure', 'design',
  'calculation', 'computation', 'calculation', 'estimate', 'approximation', 'prediction', 'forecast', 'projection',
  'graph', 'chart', 'plot', 'diagram', 'scheme', 'blueprint', 'layout', 'plan',
  'table', 'matrix', 'array', 'grid', 'lattice', 'network', 'web', 'mesh',
  'function', 'relation', 'correlation', 'association', 'connection', 'link', 'bond', 'tie',
  'derivative', 'integral', 'limit', 'infinity', 'convergence', 'divergence', 'series', 'sequence',
  'vector', 'scalar', 'tensor', 'matrix', 'array', 'field', 'domain', 'range',
  'set', 'subset', 'union', 'intersection', 'complement', 'element', 'member', 'item',
  'probability', 'statistics', 'distribution', 'mean', 'median', 'mode', 'variance', 'deviation',
  'hypothesis', 'null-hypothesis', 'alternative', 'assumption', 'premise', 'postulate', 'axiom', 'theorem',
  'correlation', 'causation', 'relationship', 'dependence', 'independence', 'association', 'link', 'connection',
  'experiment', 'trial', 'test', 'assay', 'experiment', 'validation', 'verification', 'confirmation',
  'control', 'treatment', 'intervention', 'manipulation', 'condition', 'variable', 'factor', 'element',
  'sample', 'population', 'cohort', 'group', 'subset', 'selection', 'subset', 'portion',
  'measurement', 'reading', 'value', 'quantity', 'magnitude', 'amount', 'extent', 'degree',
  'unit', 'metric', 'standard', 'reference', 'baseline', 'benchmark', 'criterion', 'indicator',
  'precision', 'accuracy', 'reliability', 'validity', 'consistency', 'reproducibility', 'repeatability', 'stability',
  'error', 'uncertainty', 'variability', 'fluctuation', 'deviation', 'discrepancy', 'difference', 'disparity',
  'instrument', 'device', 'tool', 'apparatus', 'equipment', 'machine', 'mechanism', 'appliance',
  'sensor', 'detector', 'transducer', 'probe', 'sensor', 'gauge', 'meter', 'monitor',
  'microscope', 'telescope', 'spectrometer', 'chromatograph', 'analyzer', 'scanner', 'imager', 'detector',
  'computer', 'processor', 'calculator', 'analyzer', 'simulator', 'modeler', 'solver', 'optimizer',
  'database', 'repository', 'archive', 'library', 'collection', 'dataset', 'record', 'entry',
  'software', 'program', 'application', 'system', 'platform', 'framework', 'interface', 'toolkit',
  'code', 'script', 'algorithm', 'routine', 'function', 'procedure', 'method', 'subroutine',
  'documentation', 'manual', 'guide', 'specification', 'protocol', 'procedure', 'instruction', 'directive',
  'publication', 'paper', 'article', 'report', 'study', 'research', 'investigation', 'analysis',
  'journal', 'periodical', 'magazine', 'publication', 'review', 'survey', 'census', 'compilation',
];

// Universal theme - combines all words from all themes
const UNIVERSAL_ADJECTIVES: string[] = [
  ...ARTISTIC_ADJECTIVES,
  ...NATURE_ADJECTIVES,
  ...URBAN_ADJECTIVES,
  ...ADVENTURE_ADJECTIVES,
  ...SCIENTIFIC_ADJECTIVES,
];

const UNIVERSAL_NOUNS: string[] = [
  ...ARTISTIC_NOUNS,
  ...NATURE_NOUNS,
  ...URBAN_NOUNS,
  ...ADVENTURE_NOUNS,
  ...SCIENTIFIC_NOUNS,
];

// Load default themes with word banks
export async function loadDefaultThemes(): Promise<void> {
  const themes: Omit<Theme, 'createdAt' | 'updatedAt'>[] = [
    { id: 'artistic', name: 'Artistic', description: 'Creative, poetic, and aesthetic names' },
    { id: 'nature', name: 'Nature', description: 'Natural, organic, and outdoor-inspired names' },
    { id: 'urban', name: 'Urban', description: 'Modern, architectural, and city-inspired names' },
    { id: 'adventure', name: 'Adventure', description: 'Bold, exciting, and exploration-themed names' },
    { id: 'scientific', name: 'Scientific', description: 'Technical, research-oriented, and analytical names' },
    { id: 'universal', name: 'All', description: 'All words from all themes combined' },
  ];

  const wordBanks: Omit<WordBank, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'artistic-adjectives',
      themeId: 'artistic',
      type: 'adjective',
      locale: 'en',
      name: 'Artistic Adjectives',
      words: ARTISTIC_ADJECTIVES,
      nsfw: false,
    },
    {
      id: 'artistic-nouns',
      themeId: 'artistic',
      type: 'noun',
      locale: 'en',
      name: 'Artistic Nouns',
      words: ARTISTIC_NOUNS,
      nsfw: false,
    },
    {
      id: 'nature-adjectives',
      themeId: 'nature',
      type: 'adjective',
      locale: 'en',
      name: 'Nature Adjectives',
      words: NATURE_ADJECTIVES,
      nsfw: false,
    },
    {
      id: 'nature-nouns',
      themeId: 'nature',
      type: 'noun',
      locale: 'en',
      name: 'Nature Nouns',
      words: NATURE_NOUNS,
      nsfw: false,
    },
    {
      id: 'urban-adjectives',
      themeId: 'urban',
      type: 'adjective',
      locale: 'en',
      name: 'Urban Adjectives',
      words: URBAN_ADJECTIVES,
      nsfw: false,
    },
    {
      id: 'urban-nouns',
      themeId: 'urban',
      type: 'noun',
      locale: 'en',
      name: 'Urban Nouns',
      words: URBAN_NOUNS,
      nsfw: false,
    },
    {
      id: 'adventure-adjectives',
      themeId: 'adventure',
      type: 'adjective',
      locale: 'en',
      name: 'Adventure Adjectives',
      words: ADVENTURE_ADJECTIVES,
      nsfw: false,
    },
    {
      id: 'adventure-nouns',
      themeId: 'adventure',
      type: 'noun',
      locale: 'en',
      name: 'Adventure Nouns',
      words: ADVENTURE_NOUNS,
      nsfw: false,
    },
    {
      id: 'scientific-adjectives',
      themeId: 'scientific',
      type: 'adjective',
      locale: 'en',
      name: 'Scientific Adjectives',
      words: SCIENTIFIC_ADJECTIVES,
      nsfw: false,
    },
    {
      id: 'scientific-nouns',
      themeId: 'scientific',
      type: 'noun',
      locale: 'en',
      name: 'Scientific Nouns',
      words: SCIENTIFIC_NOUNS,
      nsfw: false,
    },
    {
      id: 'universal-adjectives',
      themeId: 'universal',
      type: 'adjective',
      locale: 'en',
      name: 'All Adjectives',
      words: UNIVERSAL_ADJECTIVES,
      nsfw: false,
    },
    {
      id: 'universal-nouns',
      themeId: 'universal',
      type: 'noun',
      locale: 'en',
      name: 'All Nouns',
      words: UNIVERSAL_NOUNS,
      nsfw: false,
    },
  ];

  // Add or update themes
  for (const theme of themes) {
    const existing = await db.themes.get(theme.id);
    if (!existing) {
      await db.themes.add({
        ...theme,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Update existing theme with new name and description
      await db.themes.update(theme.id, {
        name: theme.name,
        description: theme.description,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Add or update word banks (update to ensure themeId is correct)
  for (const bank of wordBanks) {
    const existing = await db.wordBanks.get(bank.id);
    if (!existing) {
      await db.wordBanks.add({
        ...bank,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Update existing word bank to ensure it has the correct themeId and words
      await db.wordBanks.update(bank.id, {
        themeId: bank.themeId,
        type: bank.type,
        locale: bank.locale,
        name: bank.name,
        words: bank.words,
        nsfw: bank.nsfw,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

// Create default presets for all themes
export async function loadDefaultPresets(): Promise<void> {
  // Get all themes
  const allThemes = await db.themes.toArray();
  if (allThemes.length === 0) {
    return; // No themes yet
  }

  // Get existing presets to check which defaults need to be added
  const existingPresets = await db.presets.toArray();
  const existingPresetIds = new Set(existingPresets.map(p => p.id));

  const now = new Date().toISOString();
  
  // Get all word banks for default presets (we'll use all, but templates don't store this)
  const allWordBanks = await db.wordBanks.toArray();
  const allAdjectives = allWordBanks.filter(b => b.type === 'adjective').map(b => b.id);
  const allNouns = allWordBanks.filter(b => b.type === 'noun').map(b => b.id);

  // Define all default presets in logical order
  const defaultPresetsToAdd: Preset[] = [
      // Basic patterns: adj-noun, adj-adj-noun, adj-adj-adj-noun
      {
        id: 'default-adjective-noun',
        name: 'Simple',
        template: '{adjective} {noun}',
        delimiter: ' ',
        caseStyle: 'Title',
        numAdjectives: 1,
        prefix: '',
        suffix: '',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'default-adjective-adjective-noun',
        name: 'Descriptive',
        template: '{adjective}-{adjective}-{noun}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 2,
        prefix: '',
        suffix: '',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'default-adjective-adjective-adjective-noun',
        name: 'Rich',
        template: '{adjective}-{adjective}-{adjective}-{noun}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 3,
        prefix: '',
        suffix: '',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Simple with counter
      {
        id: 'default-adjective-noun-counter',
        name: 'Simple with counter',
        template: '{adjective}-{noun}-{counter}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: '',
        includeDateStamp: false,
        useCounter: true,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Simple with date
      {
        id: 'default-adjective-noun-date',
        name: 'Simple with date',
        template: '{adjective}-{noun}-{date}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: '',
        includeDateStamp: true,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Simple with date and counter
      {
        id: 'default-adjective-noun-date-counter',
        name: 'Simple with date & counter',
        template: '{adjective}-{noun}-{date}-{counter}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: '',
        includeDateStamp: true,
        useCounter: true,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Date first
      {
        id: 'default-date-adjective-noun',
        name: 'Date first',
        template: '{date}-{adjective}-{noun}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: '',
        includeDateStamp: true,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Prefixed templates
      {
        id: 'default-prefix-adjective-noun',
        name: 'Prefixed',
        template: '{prefix}-{adjective}-{noun}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: 'photo',
        suffix: '',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'default-prefix-adjective-adjective-noun',
        name: 'Prefixed descriptive',
        template: '{prefix}-{adjective}-{adjective}-{noun}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 2,
        prefix: 'photo',
        suffix: '',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Suffixed templates
      {
        id: 'default-adjective-noun-suffix',
        name: 'Suffixed',
        template: '{adjective}-{noun}-{suffix}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: 'img',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'default-adjective-noun-suffix-counter',
        name: 'Suffixed with counter',
        template: '{adjective}-{noun}-{suffix}-{counter}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: 'img',
        includeDateStamp: false,
        useCounter: true,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      },
      // Reverse order
      {
        id: 'default-noun-adjective',
        name: 'Reverse order',
        template: '{noun}-{adjective}',
        delimiter: '-',
        caseStyle: 'lower',
        numAdjectives: 1,
        prefix: '',
        suffix: '',
        includeDateStamp: false,
        useCounter: false,
        counterStart: 1,
        nsfwFilter: false,
        wordBankIds: { adjectives: allAdjectives, nouns: allNouns },
        createdAt: now,
        updatedAt: now,
      }
    ];

  // Update or add default presets
  let addedCount = 0;
  let updatedCount = 0;
  for (const preset of defaultPresetsToAdd) {
    if (existingPresetIds.has(preset.id)) {
      // Update existing default preset with new name and properties
      await db.presets.update(preset.id, {
        name: preset.name,
        template: preset.template,
        delimiter: preset.delimiter,
        caseStyle: preset.caseStyle,
        numAdjectives: preset.numAdjectives,
        prefix: preset.prefix,
        suffix: preset.suffix,
        includeDateStamp: preset.includeDateStamp,
        useCounter: preset.useCounter,
        counterStart: preset.counterStart,
        nsfwFilter: preset.nsfwFilter,
        wordBankIds: preset.wordBankIds,
        updatedAt: now,
      });
      updatedCount++;
    } else {
      // Add new default preset
      await db.presets.add(preset);
      addedCount++;
    }
  }
  
  if (addedCount > 0 || updatedCount > 0) {
    console.log(`Added ${addedCount} new default preset(s), updated ${updatedCount} existing default preset(s)`);
  }
}

