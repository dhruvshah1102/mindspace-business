import fs from 'fs';
import path from 'path';

const outputDir = path.resolve(process.cwd(), 'public/doodles');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

interface DoodleArt {
  id: number;
  name: string;
  bg: string;
  borderColor: string;
  content: string;
}

const DOODLES: DoodleArt[] = [
  {
    id: 1,
    name: 'Lotus Bloom',
    bg: '#FDF8F5',
    borderColor: '#E8D5CE',
    content: `
      <!-- Soft Water Ripple Background -->
      <path d="M40 220 C80 215 160 215 200 220 M60 232 C95 228 145 228 180 232 M75 244 C100 242 140 242 165 244" fill="none" stroke="#A9CBAE" stroke-width="3" stroke-linecap="round"/>
      <!-- Outer Petals (Lavender & Sage) -->
      <path d="M120 185 C65 170 45 130 80 95 C100 125 115 160 120 185 Z" fill="#EAE3F2" stroke="#8E7DBE" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M120 185 C175 170 195 130 160 95 C140 125 125 160 120 185 Z" fill="#EAE3F2" stroke="#8E7DBE" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Mid Petals -->
      <path d="M120 190 C80 165 70 110 100 70 C112 110 118 155 120 190 Z" fill="#FCECE6" stroke="#C86D51" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M120 190 C160 165 170 110 140 70 C128 110 122 155 120 190 Z" fill="#FCECE6" stroke="#C86D51" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Center Petal -->
      <path d="M120 50 C105 85 105 145 120 195 C135 145 135 85 120 50 Z" fill="#F8E5D8" stroke="#4F6B57" stroke-width="4" stroke-linejoin="round"/>
      <!-- Inner Vein lines -->
      <path d="M120 65 L120 180" stroke="#4F6B57" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4"/>
      <!-- Water Drop -->
      <circle cx="120" cy="38" r="4" fill="#8E7DBE"/>
    `,
  },
  {
    id: 2,
    name: 'Mountain Sunrise',
    bg: '#FAF7EE',
    borderColor: '#E6DCB8',
    content: `
      <!-- Rising Sun with Warm Glow -->
      <circle cx="120" cy="115" r="42" fill="#FEE9B5" stroke="#E07A5F" stroke-width="3.5"/>
      <path d="M120 55 L120 40 M75 75 L62 62 M165 75 L178 62 M45 115 L30 115 M195 115 L210 115" stroke="#E07A5F" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Background Peak -->
      <path d="M110 185 L165 95 L225 185 Z" fill="#D6E2D8" stroke="#4F6B57" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M165 95 L175 185" stroke="#4F6B57" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Foreground Peak (Dark Forest) -->
      <path d="M25 185 L95 80 L160 185 Z" fill="#4F6B57" stroke="#243327" stroke-width="4" stroke-linejoin="round"/>
      <path d="M95 80 L105 185" stroke="#243327" stroke-width="3" stroke-linecap="round"/>
      <!-- Snow cap -->
      <path d="M95 80 L80 105 L90 102 L98 108 L108 100 L115 110 L125 105 L95 80" fill="#FFFFFF"/>
      <!-- Ground line -->
      <path d="M15 185 L225 185" stroke="#243327" stroke-width="4" stroke-linecap="round"/>
      <path d="M35 198 L205 198" stroke="#78897B" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
  {
    id: 3,
    name: 'Zen Mandala Spiral',
    bg: '#F6F3FB',
    borderColor: '#DFD5EE',
    content: `
      <!-- Mandala concentric rings -->
      <circle cx="120" cy="120" r="14" fill="#EDE6F2" stroke="#735A88" stroke-width="3"/>
      <circle cx="120" cy="120" r="32" fill="none" stroke="#8E7DBE" stroke-width="2.5" stroke-dasharray="5 5"/>
      <circle cx="120" cy="120" r="68" fill="none" stroke="#735A88" stroke-width="3.5"/>
      <circle cx="120" cy="120" r="85" fill="none" stroke="#8E7DBE" stroke-width="2" stroke-dasharray="3 4"/>
      <!-- 8 Petal Loops -->
      <path d="M120 52 C108 78 132 78 120 52 Z M120 188 C108 162 132 162 120 188 Z M52 120 C78 108 78 132 52 120 Z M188 120 C162 108 162 132 188 120 Z" fill="#F0E8F8" stroke="#735A88" stroke-width="3"/>
      <path d="M72 72 C92 88 102 78 72 72 Z M168 168 C148 152 138 162 168 168 Z M168 72 C148 88 138 78 168 72 Z M72 168 C92 152 102 162 72 168 Z" fill="#F0E8F8" stroke="#735A88" stroke-width="3"/>
      <!-- Center dot & Outer pearls -->
      <circle cx="120" cy="120" r="5" fill="#735A88"/>
      <circle cx="120" cy="42" r="4.5" fill="#C86D51"/>
      <circle cx="120" cy="198" r="4.5" fill="#C86D51"/>
      <circle cx="42" cy="120" r="4.5" fill="#C86D51"/>
      <circle cx="198" cy="120" r="4.5" fill="#C86D51"/>
    `,
  },
  {
    id: 4,
    name: 'Curled Kitten Nap',
    bg: '#FDF6F0',
    borderColor: '#EED9C7',
    content: `
      <!-- Kitten body curve -->
      <path d="M140 180 C75 180 50 135 75 95 C92 72 135 68 165 85 C190 102 198 140 180 168 C168 185 145 192 120 192 C80 192 45 160 45 118" fill="#F8E5D8" stroke="#C86D51" stroke-width="4" stroke-linecap="round"/>
      <!-- Ears -->
      <path d="M92 78 L80 52 L105 65 M135 65 L155 48 L150 72" fill="#E8B4A2" stroke="#C86D51" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Peaceful Closed Eyes -->
      <path d="M98 98 C104 92 112 92 118 98 M130 98 C136 92 144 92 150 98" fill="none" stroke="#4F6B57" stroke-width="3" stroke-linecap="round"/>
      <!-- Nose & Mouth -->
      <path d="M124 108 L124 114 M120 114 C122 118 126 118 128 114" fill="none" stroke="#C86D51" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Whiskers -->
      <path d="M85 110 L62 105 M85 118 L60 120 M160 110 L182 105 M160 118 L185 120" stroke="#78897B" stroke-width="2" stroke-linecap="round"/>
      <!-- Floating Zzz -->
      <text x="175" y="60" font-family="sans-serif" font-weight="bold" font-size="16" fill="#8E7DBE">z</text>
      <text x="190" y="45" font-family="sans-serif" font-weight="bold" font-size="20" fill="#8E7DBE">Z</text>
    `,
  },
  {
    id: 5,
    name: 'Steaming Matcha Cup',
    bg: '#F4F8F4',
    borderColor: '#CCE0CE',
    content: `
      <!-- Rising Steam -->
      <path d="M102 75 C95 60 108 50 102 35 M122 70 C115 55 128 45 122 30 M142 75 C135 60 148 50 142 35" fill="none" stroke="#8E7DBE" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Ceramic Cup Body -->
      <ellipse cx="120" cy="100" rx="52" ry="16" fill="#D5E5D8" stroke="#4F6B57" stroke-width="4"/>
      <path d="M68 100 L76 175 C82 195 158 195 164 175 L172 100" fill="#E8F0EA" stroke="#4F6B57" stroke-width="4" stroke-linejoin="round"/>
      <!-- Tea Liquid Surface -->
      <ellipse cx="120" cy="100" rx="46" ry="11" fill="#4F6B57"/>
      <!-- Handle -->
      <path d="M168 115 C195 115 200 155 164 162" fill="none" stroke="#4F6B57" stroke-width="4" stroke-linecap="round"/>
      <!-- Heart Emblem on Mug -->
      <path d="M112 142 C112 135 118 130 122 135 C126 130 132 135 132 142 C132 150 122 158 122 158 C122 158 112 150 112 142 Z" fill="#C86D51"/>
      <!-- Saucer Plate -->
      <ellipse cx="120" cy="188" rx="68" ry="10" fill="#EFE8DC" stroke="#4F6B57" stroke-width="3.5"/>
    `,
  },
  {
    id: 6,
    name: 'Monstera Palm Leaf',
    bg: '#F2F7F3',
    borderColor: '#C7DEC9',
    content: `
      <!-- Main Leaf Outline with Organic Cutouts -->
      <path d="M120 40 C120 40 60 62 58 115 C56 155 86 190 120 200 C154 190 184 155 182 115 C180 62 120 40 120 40 Z" fill="#D5E5D8" stroke="#243327" stroke-width="4" stroke-linejoin="round"/>
      <!-- Center Stem -->
      <path d="M120 40 L120 225" stroke="#243327" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Monstera Leaf Cutout Ribs (Left) -->
      <path d="M120 85 C95 82 75 92 60 88 M120 120 C90 120 72 135 58 138 M120 155 C98 160 82 180 72 185" stroke="#243327" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Monstera Leaf Cutout Ribs (Right) -->
      <path d="M120 85 C145 82 165 92 180 88 M120 120 C150 120 168 135 182 138 M120 155 C142 160 158 180 168 185" stroke="#243327" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Organic fenestration holes -->
      <ellipse cx="102" cy="102" rx="4" ry="10" transform="rotate(-25 102 102)" fill="#F2F7F3" stroke="#243327" stroke-width="2"/>
      <ellipse cx="138" cy="102" rx="4" ry="10" transform="rotate(25 138 102)" fill="#F2F7F3" stroke="#243327" stroke-width="2"/>
    `,
  },
  {
    id: 7,
    name: 'Cosmic Saturn & Rings',
    bg: '#F4F3F8',
    borderColor: '#DDD8EE',
    content: `
      <!-- Planet Sphere -->
      <circle cx="120" cy="120" r="48" fill="#EDE6F2" stroke="#59446B" stroke-width="4"/>
      <!-- Atmospheric striping -->
      <path d="M78 108 C100 118 140 118 162 108 M82 132 C105 142 135 142 158 132" stroke="#8E7DBE" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Front Tilted Ring -->
      <path d="M35 135 C52 102 188 85 205 110 C222 135 68 165 35 135 Z" fill="none" stroke="#C86D51" stroke-width="4.5"/>
      <!-- Twinkling Constellation Stars -->
      <path d="M50 50 L50 64 M43 57 L57 57" stroke="#E07A5F" stroke-width="3" stroke-linecap="round"/>
      <path d="M190 180 L190 194 M183 187 L197 187" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
      <circle cx="195" cy="55" r="3" fill="#59446B"/>
      <circle cx="45" cy="185" r="3.5" fill="#E07A5F"/>
      <circle cx="120" cy="20" r="2.5" fill="#8E7DBE"/>
    `,
  },
  {
    id: 8,
    name: 'Origami Peace Crane',
    bg: '#FDF8F2',
    borderColor: '#EBDDC9',
    content: `
      <!-- Left Wing -->
      <polygon points="120,150 45,70 105,128" fill="#E8F0EA" stroke="#4F6B57" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Right Wing -->
      <polygon points="120,150 195,70 135,128" fill="#E8F0EA" stroke="#4F6B57" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Folded Neck & Beak -->
      <polyline points="105,128 55,115 40,130" fill="none" stroke="#243327" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Tail -->
      <line x1="135" y1="128" x2="190" y2="160" stroke="#243327" stroke-width="4" stroke-linecap="round"/>
      <!-- Body Diamond -->
      <polygon points="105,128 120,195 135,128 120,150" fill="#C5DBC8" stroke="#243327" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Little sparkle -->
      <path d="M40 95 L40 103 M36 99 L44 99" stroke="#C86D51" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
  {
    id: 9,
    name: 'Floating Sky Lantern',
    bg: '#FBF5EE',
    borderColor: '#E8D9C5',
    content: `
      <!-- Dome Lantern Balloon -->
      <path d="M85 180 C70 120 70 80 120 55 C170 80 170 120 155 180 Z" fill="#FCECE6" stroke="#C86D51" stroke-width="4" stroke-linejoin="round"/>
      <!-- Inner Glow -->
      <circle cx="120" cy="150" r="22" fill="#FEE9B5" opacity="0.8"/>
      <!-- Wood Base Ring -->
      <ellipse cx="120" cy="180" rx="35" ry="9" fill="#EBDDC9" stroke="#C86D51" stroke-width="3.5"/>
      <!-- Flame Center -->
      <circle cx="120" cy="155" r="7" fill="#E07A5F"/>
      <!-- Radiating Ember Stardust -->
      <circle cx="65" cy="45" r="3" fill="#E07A5F" opacity="0.7"/>
      <circle cx="175" cy="40" r="4" fill="#8E7DBE" opacity="0.8"/>
      <circle cx="195" cy="90" r="2.5" fill="#E07A5F" opacity="0.6"/>
      <circle cx="45" cy="120" r="3" fill="#8E7DBE" opacity="0.6"/>
    `,
  },
  {
    id: 10,
    name: 'Bonsai Zen Tree',
    bg: '#F5F7F4',
    borderColor: '#CFDDCF',
    content: `
      <!-- Planter Pot -->
      <polygon points="60,190 180,190 170,210 70,210" fill="#EFE8DC" stroke="#243327" stroke-width="4" stroke-linejoin="round"/>
      <line x1="50" y1="210" x2="190" y2="210" stroke="#243327" stroke-width="4" stroke-linecap="round"/>
      <!-- Gnarled Leaning Trunk -->
      <path d="M115 190 C110 150 135 140 125 115 C115 95 100 90 95 72" fill="none" stroke="#7A5230" stroke-width="7" stroke-linecap="round"/>
      <path d="M125 120 C140 115 165 120 170 105" fill="none" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/>
      <!-- Foliage Cloud Pads -->
      <path d="M70 72 C70 55 115 50 125 68 C132 80 105 88 70 72 Z" fill="#4F6B57" stroke="#243327" stroke-width="3"/>
      <path d="M145 105 C145 92 185 88 190 102 C195 112 170 118 145 105 Z" fill="#4F6B57" stroke="#243327" stroke-width="3"/>
      <path d="M52 108 C52 95 88 90 92 104 C95 114 75 120 52 108 Z" fill="#5E7A67" stroke="#243327" stroke-width="3"/>
    `,
  },
  {
    id: 11,
    name: 'Evergreen Pine Sprig',
    bg: '#F3F6F3',
    borderColor: '#C7DBC7',
    content: `
      <!-- Central Curved Branch -->
      <path d="M45 195 Q120 145 195 45" fill="none" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/>
      <!-- Needle Clusters (Left & Right) -->
      <path d="M95 165 L65 150 M95 165 L75 180 M125 135 L95 115 M125 135 L100 148 M155 100 L125 78 M155 100 L132 110 M180 65 L158 45 M180 65 L168 70" stroke="#4F6B57" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M95 165 L120 145 M125 135 L155 115 M155 100 L185 82" stroke="#4F6B57" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Pinecone Accent -->
      <ellipse cx="95" cy="180" rx="10" ry="14" fill="#A47551" stroke="#5A3D28" stroke-width="2.5"/>
    `,
  },
  {
    id: 12,
    name: 'Cozy Forest Cabin',
    bg: '#FBF6EE',
    borderColor: '#E6D7BE',
    content: `
      <!-- Roof -->
      <polygon points="60,130 120,70 180,130" fill="#C86D51" stroke="#243327" stroke-width="4" stroke-linejoin="round"/>
      <!-- Chimney with Smoke -->
      <rect x="150" y="85" width="14" height="26" fill="#8E7DBE" stroke="#243327" stroke-width="3"/>
      <path d="M157 75 C150 60 165 50 157 38 C150 28 160 20 155 10" fill="none" stroke="#8E7DBE" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Cabin Walls -->
      <rect x="72" y="130" width="96" height="65" fill="#F4EADB" stroke="#243327" stroke-width="4"/>
      <!-- Glowing Window -->
      <rect x="85" y="145" width="24" height="24" fill="#FEE9B5" stroke="#243327" stroke-width="3"/>
      <line x1="97" y1="145" x2="97" y2="169" stroke="#243327" stroke-width="2"/>
      <line x1="85" y1="157" x2="109" y2="157" stroke="#243327" stroke-width="2"/>
      <!-- Wooden Door -->
      <rect x="125" y="145" width="26" height="50" fill="#A47551" stroke="#243327" stroke-width="3"/>
      <circle cx="132" cy="170" r="2.5" fill="#FFFFFF"/>
      <!-- Ground line -->
      <line x1="35" y1="195" x2="205" y2="195" stroke="#4F6B57" stroke-width="4" stroke-linecap="round"/>
    `,
  },
  {
    id: 13,
    name: 'Whimsical Forest Mushroom',
    bg: '#FDF5F2',
    borderColor: '#EED3C7',
    content: `
      <!-- Big Spotted Mushroom Cap -->
      <path d="M50 130 C50 68 190 68 190 130 C190 138 50 138 50 130 Z" fill="#E07A5F" stroke="#243327" stroke-width="4.5" stroke-linejoin="round"/>
      <!-- Polka Dots on Cap -->
      <circle cx="85" cy="100" r="9" fill="#FFFFFF" stroke="#243327" stroke-width="2.5"/>
      <circle cx="125" cy="85" r="11" fill="#FFFFFF" stroke="#243327" stroke-width="2.5"/>
      <circle cx="158" cy="108" r="8" fill="#FFFFFF" stroke="#243327" stroke-width="2.5"/>
      <!-- Mushroom Stalk -->
      <path d="M92 138 C92 170 88 190 120 190 C152 190 148 170 148 138" fill="#FDF8EE" stroke="#243327" stroke-width="4" stroke-linecap="round"/>
      <!-- Gills under cap -->
      <line x1="98" y1="138" x2="98" y2="145" stroke="#78897B" stroke-width="2"/>
      <line x1="142" y1="138" x2="142" y2="145" stroke="#78897B" stroke-width="2"/>
      <!-- Grass Blades at Base -->
      <path d="M72 195 L80 180 M115 195 L120 178 M160 195 L155 182" stroke="#4F6B57" stroke-width="3.5" stroke-linecap="round"/>
    `,
  },
  {
    id: 14,
    name: 'Paper Plane in Flight',
    bg: '#F4F7FB',
    borderColor: '#CCDDF2',
    content: `
      <!-- Plane Body Fold -->
      <polygon points="200,45 60,130 105,145" fill="#E8F0EA" stroke="#243327" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="200,45 105,145 130,175 145,140" fill="#C5DBC8" stroke="#243327" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Looping Wind Trail -->
      <path d="M40 185 C65 200 75 178 55 160 C38 145 60 128 85 135" fill="none" stroke="#8E7DBE" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="6 7"/>
      <!-- Sparkles -->
      <path d="M195 90 L195 98 M191 94 L199 94" stroke="#E07A5F" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
  {
    id: 15,
    name: 'Night Owl Perch',
    bg: '#F5F3FA',
    borderColor: '#DFD8EE',
    content: `
      <!-- Owl Body Egg -->
      <path d="M85 75 C85 60 98 55 108 68 C120 62 132 62 144 68 C154 55 167 60 167 75 C167 125 162 178 126 178 C90 178 85 125 85 75 Z" fill="#EAE3F2" stroke="#59446B" stroke-width="4"/>
      <!-- Big Curious Eyes -->
      <circle cx="108" cy="95" r="14" fill="#FFFFFF" stroke="#59446B" stroke-width="3"/>
      <circle cx="108" cy="95" r="5" fill="#59446B"/>
      <circle cx="144" cy="95" r="14" fill="#FFFFFF" stroke="#59446B" stroke-width="3"/>
      <circle cx="144" cy="95" r="5" fill="#59446B"/>
      <!-- Triangle Beak -->
      <polygon points="126,108 120,118 132,118" fill="#E07A5F"/>
      <!-- Belly Feather Tufts -->
      <path d="M112 140 C118 146 124 146 130 140 M118 152 C124 158 130 158 136 152" fill="none" stroke="#8E7DBE" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Oak Branch -->
      <line x1="40" y1="185" x2="200" y2="185" stroke="#7A5230" stroke-width="6" stroke-linecap="round"/>
    `,
  },
  {
    id: 16,
    name: 'Ocean Cresting Wave',
    bg: '#F2F8F8',
    borderColor: '#C7E4E4',
    content: `
      <!-- Surging Wave Crest (Japanese inspired) -->
      <path d="M25 175 C70 175 95 165 130 120 C155 88 172 58 148 58 C124 58 132 88 115 98" fill="none" stroke="#3B8B88" stroke-width="5" stroke-linecap="round"/>
      <path d="M25 192 C85 192 120 182 165 150 C200 125 215 110 200 102" fill="none" stroke="#243327" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Foam Claws & Water Drops -->
      <circle cx="162" cy="52" r="3.5" fill="#3B8B88"/>
      <circle cx="180" cy="65" r="3.5" fill="#3B8B88"/>
      <circle cx="142" cy="42" r="3" fill="#8E7DBE"/>
      <circle cx="195" cy="85" r="2.5" fill="#3B8B88"/>
      <!-- Base ocean foam lines -->
      <path d="M40 205 C90 200 150 200 200 205" stroke="#A9CBAE" stroke-width="3" stroke-linecap="round"/>
    `,
  },
  {
    id: 17,
    name: 'Lavender Bouquet Sprigs',
    bg: '#F9F5FD',
    borderColor: '#E8DDF7',
    content: `
      <!-- Stems -->
      <line x1="95" y1="200" x2="115" y2="45" stroke="#4F6B57" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="120" y1="200" x2="124" y2="50" stroke="#4F6B57" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="145" y1="200" x2="133" y2="55" stroke="#4F6B57" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Purple Lavender Blossom Grains (Center) -->
      <ellipse cx="115" cy="55" rx="7" ry="4.5" fill="#8E7DBE"/>
      <ellipse cx="115" cy="70" rx="8" ry="5" fill="#735A88"/>
      <ellipse cx="115" cy="85" rx="9" ry="5.5" fill="#8E7DBE"/>
      <ellipse cx="115" cy="100" rx="9" ry="5.5" fill="#735A88"/>
      <!-- Left Sprig Grains -->
      <ellipse cx="124" cy="65" rx="7" ry="4.5" fill="#8E7DBE"/>
      <ellipse cx="124" cy="80" rx="8" ry="5" fill="#735A88"/>
      <ellipse cx="124" cy="95" rx="8.5" ry="5.5" fill="#8E7DBE"/>
      <!-- Right Sprig Grains -->
      <ellipse cx="133" cy="75" rx="7" ry="4.5" fill="#8E7DBE"/>
      <ellipse cx="133" cy="90" rx="8" ry="5" fill="#735A88"/>
      <!-- Ribbon Bow Tie -->
      <path d="M108 160 C98 152 98 168 108 164 C132 152 132 168 122 164" fill="#FCECE6" stroke="#C86D51" stroke-width="3" stroke-linecap="round"/>
    `,
  },
  {
    id: 18,
    name: 'Crescent Moon & Constellation',
    bg: '#F6F4FB',
    borderColor: '#DFD8EE',
    content: `
      <!-- Golden Crescent Moon -->
      <path d="M120 42 C72 42 48 95 68 155 C88 215 165 202 180 180 C132 180 100 145 108 100 C112 68 132 52 120 42 Z" fill="#FEE9B5" stroke="#E07A5F" stroke-width="4" stroke-linejoin="round"/>
      <!-- Sparkling Stars -->
      <path d="M165 65 L165 85 M155 75 L175 75" stroke="#8E7DBE" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M188 115 L188 130 M180 122 L196 122" stroke="#59446B" stroke-width="3" stroke-linecap="round"/>
      <circle cx="150" cy="150" r="3.5" fill="#E07A5F"/>
      <circle cx="180" cy="45" r="2.5" fill="#8E7DBE"/>
    `,
  },
  {
    id: 19,
    name: 'Potted Jade Succulent',
    bg: '#F5F8F5',
    borderColor: '#D0E2D1',
    content: `
      <!-- Ceramic Pot -->
      <polygon points="75,140 165,140 152,205 88,205" fill="#EFE8DC" stroke="#4F6B57" stroke-width="4" stroke-linejoin="round"/>
      <line x1="65" y1="205" x2="175" y2="205" stroke="#4F6B57" stroke-width="4" stroke-linecap="round"/>
      <!-- Succulent Rosette Petals -->
      <path d="M120 75 C108 100 108 125 120 138 C132 125 132 100 120 75 Z" fill="#5E7A67" stroke="#243327" stroke-width="3.5"/>
      <path d="M92 98 C102 112 108 128 115 138 C90 134 82 112 92 98 Z" fill="#A9CBAE" stroke="#243327" stroke-width="3"/>
      <path d="M148 98 C138 112 132 128 125 138 C150 134 158 112 148 98 Z" fill="#A9CBAE" stroke="#243327" stroke-width="3"/>
    `,
  },
  {
    id: 20,
    name: 'Singing Songbird on Twig',
    bg: '#FDF7F3',
    borderColor: '#EED9CC',
    content: `
      <!-- Bird Body -->
      <path d="M78 105 C78 82 102 70 125 82 C148 95 162 130 138 160 C115 170 92 160 78 105 Z" fill="#E8F0EA" stroke="#243327" stroke-width="4"/>
      <!-- Beak & Eye -->
      <polygon points="78,90 55,85 74,100" fill="#E07A5F" stroke="#243327" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="95" cy="90" r="3.5" fill="#243327"/>
      <!-- Tail & Wings -->
      <polyline points="138,160 185,188 162,152" fill="#C5DBC8" stroke="#243327" stroke-width="3.5" stroke-linejoin="round"/>
      <!-- Perched Branch with tiny leaves -->
      <path d="M40 175 Q120 165 200 170" fill="none" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/>
      <circle cx="160" cy="155" r="5" fill="#E07A5F"/>
    `,
  },
  {
    id: 21,
    name: 'Clay Teapot with Spout',
    bg: '#FAF5F0',
    borderColor: '#E7D9CB',
    content: `
      <!-- Teapot Body -->
      <path d="M85 105 C68 130 68 170 92 185 L148 185 C172 170 172 130 155 105 Z" fill="#F8E5D8" stroke="#C86D51" stroke-width="4.5" stroke-linejoin="round"/>
      <!-- Lid & Knob -->
      <polygon points="98,105 142,105 138,92 102,92" fill="#E8D5CE" stroke="#C86D51" stroke-width="3.5"/>
      <circle cx="120" cy="85" r="6" fill="#4F6B57"/>
      <!-- Curved Pouring Spout -->
      <path d="M78 135 C55 130 50 112 45 105 L45 120 C50 140 70 155 82 160" fill="#F8E5D8" stroke="#C86D51" stroke-width="4" stroke-linejoin="round"/>
      <!-- Handle -->
      <path d="M162 118 C185 118 195 155 162 165" fill="none" stroke="#C86D51" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Steam -->
      <path d="M42 95 C38 80 48 70 42 55" fill="none" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
    `,
  },
  {
    id: 22,
    name: 'Spiral Nautilus Shell',
    bg: '#F5F7FA',
    borderColor: '#D0DCEB',
    content: `
      <!-- Logarithmic Nautilus Curve -->
      <path d="M120 120 A9 9 0 0 1 129 129 A18 18 0 0 1 111 147 A32 32 0 0 1 79 115 A50 50 0 0 1 129 65 A72 72 0 0 1 201 137 A95 95 0 0 1 106 215 C60 215 32 165 46 106" fill="none" stroke="#3B8B88" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Growth Chamber Ribs -->
      <line x1="120" y1="120" x2="129" y2="129" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
      <line x1="111" y1="147" x2="102" y2="156" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
      <line x1="79" y1="115" x2="65" y2="110" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
      <line x1="129" y1="65" x2="133" y2="52" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
      <line x1="201" y1="137" x2="215" y2="147" stroke="#8E7DBE" stroke-width="3" stroke-linecap="round"/>
    `,
  },
  {
    id: 23,
    name: 'Ginkgo Biloba Fan Leaf',
    bg: '#FDF8F0',
    borderColor: '#EEDFC9',
    content: `
      <!-- Leaf Stem -->
      <path d="M120 205 Q120 165 120 135" fill="none" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/>
      <!-- Fan Leaf Blade with Split Notch -->
      <path d="M120 135 C85 128 50 105 55 72 C68 58 108 72 120 88 C132 72 172 58 185 72 C190 105 155 128 120 135 Z" fill="#FEE9B5" stroke="#C86D51" stroke-width="4.5" stroke-linejoin="round"/>
      <!-- Radiating Delicate Ribs -->
      <path d="M120 135 L78 78 M120 135 L102 72 M120 135 L120 90 M120 135 L138 72 M120 135 L162 78" stroke="#E07A5F" stroke-width="2.5" stroke-linecap="round"/>
    `,
  },
];

for (const doodle of DOODLES) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <rect width="240" height="240" rx="32" fill="${doodle.bg}" stroke="${doodle.borderColor}" stroke-width="3"/>
  ${doodle.content}
</svg>`;

  fs.writeFileSync(path.join(outputDir, `doodle-${doodle.id}.svg`), svg.trim());
}

console.log('Successfully generated 23 standalone doodle SVG images in public/doodles/');
