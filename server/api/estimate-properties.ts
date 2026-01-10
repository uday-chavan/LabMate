
import { Router } from 'express';

interface GroupContribution {
  [key: string]: {
    boilingPoint: number;
    meltingPoint: number;
    criticalTemp: number;
    criticalPressure: number;
  };
}

const groupContributions: GroupContribution = {
  'CH3': { boilingPoint: 23.58, meltingPoint: -20.71, criticalTemp: 68.81, criticalPressure: 6.75 },
  'CH2': { boilingPoint: 22.88, meltingPoint: -20.64, criticalTemp: 58.41, criticalPressure: 5.50 },
  'OH': { boilingPoint: 92.88, meltingPoint: 44.45, criticalTemp: 155.90, criticalPressure: 23.70 },
  'COOH': { boilingPoint: 169.09, meltingPoint: 79.63, criticalTemp: 262.31, criticalPressure: 39.89 },
  'NH2': { boilingPoint: 73.23, meltingPoint: 34.12, criticalTemp: 125.70, criticalPressure: 18.90 }
};

const router = Router();

function parseGroups(smiles: string) {
  // Simple SMILES parser for demonstration
  const groups: { [key: string]: number } = {};
  
  // Match common functional groups
  const patterns = {
    'OH': /OH/g,
    'COOH': /COOH/g,
    'NH2': /NH2/g,
    'CH3': /CH3/g,
    'CH2': /CH2/g
  };

  for (const [group, pattern] of Object.entries(patterns)) {
    const matches = smiles.match(pattern);
    if (matches) {
      groups[group] = matches.length;
    }
  }

  return groups;
}

function estimateProperties(groups: { [key: string]: number }) {
  const properties = {
    boilingPoint: 0,
    meltingPoint: 0,
    criticalTemp: 0,
    criticalPressure: 0
  };

  for (const [group, count] of Object.entries(groups)) {
    if (groupContributions[group]) {
      properties.boilingPoint += groupContributions[group].boilingPoint * count;
      properties.meltingPoint += groupContributions[group].meltingPoint * count;
      properties.criticalTemp += groupContributions[group].criticalTemp * count;
      properties.criticalPressure += groupContributions[group].criticalPressure * count;
    }
  }

  return properties;
}

router.post('/', async (req, res) => {
  try {
    const { smiles } = req.body;
    
    if (!smiles) {
      return res.status(400).json({ error: 'SMILES notation is required' });
    }

    const groups = parseGroups(smiles);
    const properties = estimateProperties(groups);

    res.json({
      ...properties,
      groups
    });
  } catch (error) {
    console.error('Error estimating properties:', error);
    res.status(500).json({ error: 'Failed to estimate properties' });
  }
});

export default router;
