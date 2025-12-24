#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

// Load all schemas
const schemasDir = path.join(__dirname, '../../docs/schemas');
const schemas = {};

try {
  const schemaFiles = fs.readdirSync(schemasDir).filter(file => file.endsWith('.schema.json'));
  schemaFiles.forEach(file => {
    const schemaPath = path.join(schemasDir, file);
    const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const schemaName = path.basename(file, '.schema.json');
    schemas[schemaName] = schemaContent;
    // Remove $schema reference to avoid external dependency
    delete schemaContent.$schema;
    ajv.addSchema(schemaContent, schemaName);
  });
} catch (error) {
  console.error('Error loading schemas:', error.message);
  process.exit(1);
}

// Function to validate YAML frontmatter against schema
function validateFile(filePath, schemaName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    if (!match) {
      return { valid: false, errors: ['No YAML frontmatter found'] };
    }

    const yamlContent = match[1];
    const data = yaml.load(yamlContent);

    // Determine schema based on type field or file location
    let schemaToUse = schemas[schemaName];
    if (!schemaToUse && data.type) {
      schemaToUse = schemas[data.type];
    }

    if (!schemaToUse) {
      return { valid: false, errors: [`No schema found for type: ${data.type || schemaName}`] };
    }

    const validate = ajv.getSchema(schemaToUse.$id) || ajv.compile(schemaToUse);
    const valid = validate(data);

    if (valid) {
      const warnings = [];
      if (!data.schema_version) {
        warnings.push('Missing recommended field: schema_version');
      }
      if (!data.tags) {
        warnings.push('Missing recommended field: tags');
      }
      if (!data.status && !(data.metadata && data.metadata.status)) {
        warnings.push('Missing recommended field: status (top-level or metadata.status)');
      }
      return { valid: true, warnings };
    } else {
      return { valid: false, errors: validate.errors.map(err => {
        const propertyPath = err.instancePath || err.schemaPath;
        return `${propertyPath}: ${err.message} (${JSON.stringify(err.params)})`;
      })};
    }
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }
}

// Walk directories and validate files
function walkDir(dir, schemaName) {
  let hasErrors = false;

  if (!fs.existsSync(dir)) {
    return false;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (walkDir(filePath, schemaName)) {
        hasErrors = true;
      }
    } else if ((file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) && !file.endsWith('README.md')) {
      const result = validateFile(filePath, schemaName);
      if (!result.valid) {
        // Filter out UUID format warnings as they're not critical errors
        const criticalErrors = result.errors.filter(error =>
          !error.includes('unknown format "uuid" ignored in schema')
        );
        if (criticalErrors.length > 0) {
          console.error(`❌ ${filePath}`);
          criticalErrors.forEach(error => console.error(`  - ${error}`));
          hasErrors = true;
        } else {
          console.log(`✅ ${filePath} (with warnings)`);
        }
      } else {
        console.log(`✅ ${filePath}`);
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => console.warn(`⚠️  ${filePath}: ${warning}`));
        }
      }
    }
  }

  return hasErrors;
}

// Main execution
function main() {
  console.log('🔍 Validating YAML frontmatter against schemas...');

  let hasErrors = false;

  // Validate characters
  if (walkDir(path.join(__dirname, '../../characters'), 'character')) {
    hasErrors = true;
  }

  // Validate stories
  if (walkDir(path.join(__dirname, '../../stories'), 'story')) {
    hasErrors = true;
  }

  // Validate mechanics
  if (walkDir(path.join(__dirname, '../../mechanics'), 'mechanics_rule')) {
    hasErrors = true;
  }

  // Validate factions
  if (walkDir(path.join(__dirname, '../../factions'), 'faction')) {
    hasErrors = true;
  }

  // Validate atlas locations
  if (walkDir(path.join(__dirname, '../../atlas'), 'location')) {
    hasErrors = true;
  }

  // Validate data directories if they exist
  const dataDirs = ['data'];
  dataDirs.forEach(dir => {
    const fullPath = path.join(__dirname, `../../${dir}`);
    if (fs.existsSync(fullPath)) {
      if (walkDir(fullPath, null)) { // Let schema be determined by type field
        hasErrors = true;
      }
    }
  });

  if (hasErrors) {
    console.error('❌ Schema validation failed');
    process.exit(1);
  } else {
    console.log('✅ All files passed schema validation');
    process.exit(0);
  }
}

main();
