export type ColorThemeId = 'modern' | 'pastel' | 'cyberpunk' | 'classic';

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;
  pyraminx: {
    bottom: string; // Yellow
    front: string;  // Red
    left: string;   // Green
    right: string;  // Blue
  };
  rubiks: {
    U: string; // White
    D: string; // Yellow
    F: string; // Green
    B: string; // Blue
    R: string; // Red
    L: string; // Orange
  };
}

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  modern: {
    id: 'modern',
    name: 'Modern Neo-Speedcube',
    description: 'Flagship GAN/MoYu style: ultra-vivid neon coral, mint, azure, and fluorescent yellow',
    pyraminx: {
      bottom: '#FFE500', // Modern Fluorescent Yellow
      front: '#FF2A55',  // Modern Neon Coral Red
      left: '#00E575',   // Modern Electric Mint Neo-Green
      right: '#0084FF'   // Modern Vivid Azure Blue
    },
    rubiks: {
      U: '#FFFFFF',      // Pure Studio Pearl White
      D: '#FFE500',      // Modern Fluorescent Yellow
      F: '#00E575',      // Modern Electric Mint Neo-Green
      B: '#0084FF',      // Modern Vivid Azure Blue
      R: '#FF2A55',      // Modern Neon Coral Red
      L: '#FF7700'       // Modern Neon Tangerine Orange
    }
  },
  pastel: {
    id: 'pastel',
    name: 'Modern Pastel Macaron',
    description: 'Trendy soft pastel tones: mint, peach, lavender-sky, and buttercup',
    pyraminx: {
      bottom: '#FDE047', // Buttercup Yellow
      front: '#FB7185',  // Soft Coral Rose
      left: '#4ADE80',   // Pastel Mint
      right: '#38BDF8'   // Sky Blue Pastel
    },
    rubiks: {
      U: '#F8FAFC',      // Cream Soft White
      D: '#FDE047',      // Buttercup Yellow
      F: '#4ADE80',      // Pastel Mint
      B: '#38BDF8',      // Sky Blue Pastel
      R: '#FB7185',      // Soft Coral Rose
      L: '#FB923C'       // Soft Peach
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon Glow',
    description: 'High-contrast futuristic electric cyan, hot magenta, laser lime, and electric amber',
    pyraminx: {
      bottom: '#FFE600', // Electric Cyber Yellow
      front: '#FF0055',  // Hot Neon Magenta
      left: '#00FF66',   // Laser Matrix Green
      right: '#00F0FF'   // Electric Cyan
    },
    rubiks: {
      U: '#FFFFFF',      // Hyper White
      D: '#FFE600',      // Electric Cyber Yellow
      F: '#00FF66',      // Laser Matrix Green
      B: '#00F0FF',      // Electric Cyan
      R: '#FF0055',      // Hot Neon Magenta
      L: '#FF6600'       // Neon Orange
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic WCA Standard',
    description: 'Traditional standard competition colors',
    pyraminx: {
      bottom: '#FACC15',
      front: '#EF4444',
      left: '#10B981',
      right: '#2563EB'
    },
    rubiks: {
      U: '#F8FAFC',
      D: '#FACC15',
      F: '#10B981',
      B: '#2563EB',
      R: '#EF4444',
      L: '#F97316'
    }
  }
};
