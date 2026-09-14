#!/usr/bin/env node

/**
 * Design Tokens to CSS Variables Converter
 * 
 * Converts design tokens from Figma (design-tokens.tokens.json) into CSS custom properties.
 * Distinguishes between:
 *  1. Primitive Colors (Foundational palette - NOT for direct UI use)
 *  2. Color Roles (Semantic tokens - TO BE applied on UI components)
 *  3. Spacing Tokens
 *  4. Typography Tokens (Individual properties, composite shorthands & utility classes)
 *  5. Elevation / Shadow Effects
 */

const fs = require('fs');
const path = require('path');

/**
 * Converts 8-digit or 6-digit hex color strings to standard CSS color format.
 * - If 8-digit with FF alpha -> #RRGGBB (6-digit hex)
 * - If 8-digit with partial alpha -> rgba(r, g, b, a)
 */
function formatColor(hex) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) {
    return hex;
  }

  const clean = hex.slice(1);
  if (clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const alphaRaw = parseInt(clean.slice(6, 8), 16);
    const alpha = parseFloat((alphaRaw / 255).toFixed(2));

    if (alpha === 1) {
      return `#${clean.slice(0, 6)}`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return hex;
}

/**
 * Formats a dimension number into a px value string.
 */
function formatDimension(val) {
  if (typeof val === 'number') {
    return `${val}px`;
  }
  return val;
}

/**
 * Converts drop shadow object to CSS box-shadow string.
 */
function formatShadow(shadowObj) {
  const { offsetX = 0, offsetY = 0, radius = 0, spread = 0, color = '#000000' } = shadowObj;
  const formattedColor = formatColor(color);
  return `${offsetX}px ${offsetY}px ${radius}px ${spread}px ${formattedColor}`;
}

/**
 * Maps a primitive token name into a standard kebab-cased CSS variable name.
 */
function getPrimitiveVarName(groupName, itemName) {
  if (groupName === 'key color group') {
    const cleanKey = itemName.replace(/\s*key\s*color$/i, '').trim().toLowerCase().replace(/\s+/g, '-');
    return `--color-primitive-key-${cleanKey}`;
  }

  // e.g. primary0 -> primary-0, neutralvariant90 -> neutral-variant-90
  let name = itemName
    .replace(/^neutralvariant/i, 'neutral-variant-')
    .replace(/^([a-zA-Z]+)(\d+)$/, '$1-$2')
    .toLowerCase()
    .replace(/\s+/g, '-');

  return `--color-primitive-${name}`;
}

/**
 * Maps a semantic color role name to a standard CSS variable name.
 */
function getColorRoleVarName(roleName) {
  const clean = roleName
    .toLowerCase()
    .replace(/^surface color$/i, 'surface')
    .replace(/\s+/g, '-');
  return `--color-${clean}`;
}

/**
 * Maps spacing token names to intuitive short names.
 */
function getSpacingVarName(spacingName) {
  const map = {
    'no spacing': '--spacing-none',
    'extra small spacing': '--spacing-xs',
    'small spacing': '--spacing-sm',
    'medium spacing': '--spacing-md',
    'base spacing': '--spacing-base',
    'large spacing': '--spacing-lg',
    'extra large spacing': '--spacing-xl',
    'very large spacing': '--spacing-2xl',
  };

  return map[spacingName.toLowerCase()] || `--spacing-${spacingName.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Main conversion function.
 */
function convertTokensToCSS(tokens) {
  const lines = [
    '/**',
    ' * ==========================================================================',
    ' * DESIGN SYSTEM TOKENS - AUTO-GENERATED CSS VARIABLES',
    ' * Generated from design-tokens.tokens.json',
    ' * ',
    ' * ARCHITECTURAL GUIDELINES:',
    ' * 1. Primitive Colors: Foundational raw palette tokens. DO NOT apply directly to UI.',
    ' * 2. Color Roles: Semantic tokens (primary, surface, error, on-*). APPLY THESE ON UI.',
    ' * 3. Spacing: Standard spacing scale (0px to 40px).',
    ' * 4. Typography: Typography tokens and atomic utility classes.',
    ' * 5. Effects: Standard elevation and drop shadow tokens.',
    ' * ==========================================================================',
    ' */',
    '',
    ':root {',
  ];

  // Map to store full path -> { varName, formattedValue } for resolving alias references
  const primitiveMap = new Map();

  // 1. Primitive Colors
  lines.push('  /* ======================================================================== */');
  lines.push('  /* 1. PRIMITIVE COLORS (Foundational palette - DO NOT apply directly to UI) */');
  lines.push('  /* ======================================================================== */');

  if (tokens['primitives colors']) {
    for (const [groupName, items] of Object.entries(tokens['primitives colors'])) {
      const groupTitle = groupName.toUpperCase();
      lines.push(`\n  /* Primitive Palette: ${groupTitle} */`);

      for (const [itemName, token] of Object.entries(items)) {
        const fullPath = `primitives colors.${groupName}.${itemName}`;
        const varName = getPrimitiveVarName(groupName, itemName);
        const formattedValue = formatColor(token.value);

        primitiveMap.set(fullPath, { varName, formattedValue });
        lines.push(`  ${varName}: ${formattedValue};`);
      }
    }
  }

  // 2. Color Roles (Semantic tokens for UI)
  lines.push('');
  lines.push('  /* ======================================================================== */');
  lines.push('  /* 2. COLOR ROLES / SEMANTIC TOKENS (APPLY THESE ON UI COMPONENTS)          */');
  lines.push('  /* ======================================================================== */');

  if (tokens['color roles']) {
    for (const [roleName, token] of Object.entries(tokens['color roles'])) {
      const roleVarName = getColorRoleVarName(roleName);
      let roleValue = token.value;

      if (typeof roleValue === 'string' && roleValue.startsWith('{') && roleValue.endsWith('}')) {
        const refPath = roleValue.slice(1, -1);
        const resolved = primitiveMap.get(refPath);
        if (resolved) {
          roleValue = `var(${resolved.varName}, ${resolved.formattedValue})`;
        } else {
          roleValue = formatColor(roleValue);
        }
      } else {
        roleValue = formatColor(roleValue);
      }

      lines.push(`  ${roleVarName}: ${roleValue};`);
    }
  }

  // 3. Spacing Tokens
  lines.push('');
  lines.push('  /* ======================================================================== */');
  lines.push('  /* 3. SPACING SCALE                                                         */');
  lines.push('  /* ======================================================================== */');

  if (tokens['spacing collection']) {
    for (const [spacingName, token] of Object.entries(tokens['spacing collection'])) {
      const spacingVarName = getSpacingVarName(spacingName);
      const formattedValue = formatDimension(token.value);
      lines.push(`  ${spacingVarName}: ${formattedValue};`);
    }
  }

  // 4. Typography Tokens
  lines.push('');
  lines.push('  /* ======================================================================== */');
  lines.push('  /* 4. TYPOGRAPHY TOKENS                                                     */');
  lines.push('  /* ======================================================================== */');

  const typographyUtilities = [];

  if (tokens['typography']) {
    for (const [typeName, props] of Object.entries(tokens['typography'])) {
      const kebabType = typeName.toLowerCase().replace(/\s+/g, '-');
      lines.push(`\n  /* Typography: ${typeName} */`);

      const fontSize = formatDimension(props.fontSize?.value || 16);
      const lineHeight = formatDimension(props.lineHeight?.value || 24);
      const fontWeight = props.fontWeight?.value || 400;
      const letterSpacing = formatDimension(props.letterSpacing?.value || 0);
      const fontFamily = props.fontFamily?.value ? `'${props.fontFamily.value}', sans-serif` : 'sans-serif';
      const fontStyle = props.fontStyle?.value || 'normal';
      const textDecoration = props.textDecoration?.value || 'none';
      const textCase = props.textCase?.value === 'none' ? 'none' : props.textCase?.value || 'none';

      lines.push(`  --typography-${kebabType}-font-family: ${fontFamily};`);
      lines.push(`  --typography-${kebabType}-font-size: ${fontSize};`);
      lines.push(`  --typography-${kebabType}-font-weight: ${fontWeight};`);
      lines.push(`  --typography-${kebabType}-line-height: ${lineHeight};`);
      lines.push(`  --typography-${kebabType}-letter-spacing: ${letterSpacing};`);
      lines.push(`  --typography-${kebabType}-font-style: ${fontStyle};`);
      lines.push(`  --typography-${kebabType}-text-decoration: ${textDecoration};`);
      lines.push(`  --typography-${kebabType}-text-transform: ${textCase};`);

      // Shorthand composite variable
      lines.push(`  --typography-${kebabType}: ${fontStyle !== 'normal' ? fontStyle + ' ' : ''}${fontWeight} ${fontSize}/${lineHeight} ${fontFamily};`);

      // Prepare utility class
      typographyUtilities.push(
        `.type-${kebabType} {`,
        `  font-family: var(--typography-${kebabType}-font-family);`,
        `  font-size: var(--typography-${kebabType}-font-size);`,
        `  font-weight: var(--typography-${kebabType}-font-weight);`,
        `  line-height: var(--typography-${kebabType}-line-height);`,
        `  letter-spacing: var(--typography-${kebabType}-letter-spacing);`,
        `  font-style: var(--typography-${kebabType}-font-style);`,
        `  text-decoration: var(--typography-${kebabType}-text-decoration);`,
        `  text-transform: var(--typography-${kebabType}-text-transform);`,
        `}`
      );
    }
  }

  // 5. Elevation / Effects
  lines.push('');
  lines.push('  /* ======================================================================== */');
  lines.push('  /* 5. ELEVATION / SHADOW EFFECTS                                            */');
  lines.push('  /* ======================================================================== */');

  if (tokens['effect']) {
    for (const [effectName, token] of Object.entries(tokens['effect'])) {
      const kebabEffect = effectName.toLowerCase().replace(/\s+/g, '-');
      const varName = `--shadow-${kebabEffect.replace(/-shadow$/, '')}`;
      const shadowValue = formatShadow(token.value);
      lines.push(`  ${varName}: ${shadowValue};`);
    }
  }

  lines.push('}');
  lines.push('');

  // Append Typography Utility Classes
  lines.push('/* ========================================================================== */');
  lines.push('/* TYPOGRAPHY UTILITY CLASSES                                                 */');
  lines.push('/* ========================================================================== */');
  lines.push(...typographyUtilities);
  lines.push('');

  return lines.join('\n');
}

// Execute as CLI if run directly
if (require.main === module) {
  const defaultInput = path.resolve(__dirname, '../design-tokens.tokens.json');
  const defaultOutput = path.resolve(__dirname, '../tokens.css');

  const inputPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : defaultInput;
  const outputPath = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : defaultOutput;

  if (!fs.existsSync(inputPath)) {
    console.error(`[Error] Design tokens file not found at: ${inputPath}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const tokens = JSON.parse(rawData);
    const cssContent = convertTokensToCSS(tokens);

    fs.writeFileSync(outputPath, cssContent, 'utf8');
    console.log(`[Success] Design tokens converted successfully!`);
    console.log(`- Source: ${inputPath}`);
    console.log(`- Output: ${outputPath}`);

    // Also copy to consumer app styles directory if it exists
    const consumerTokensPath = path.resolve(__dirname, '../apps/consumer/app/tokens.css');
    if (fs.existsSync(path.dirname(consumerTokensPath))) {
      fs.writeFileSync(consumerTokensPath, cssContent, 'utf8');
      console.log(`- Synced to: ${consumerTokensPath}`);
    }
  } catch (error) {
    console.error(`[Error] Failed to convert design tokens:`, error);
    process.exit(1);
  }
}

module.exports = {
  convertTokensToCSS,
  formatColor,
  formatDimension,
  formatShadow,
  getPrimitiveVarName,
  getColorRoleVarName,
  getSpacingVarName,
};
